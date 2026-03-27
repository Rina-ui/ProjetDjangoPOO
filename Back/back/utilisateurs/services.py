import base64
import re
import secrets
import time
from datetime import timedelta
from io import BytesIO

import pyotp
import qrcode
from django.core import signing
from django.core.cache import cache
from django.utils import timezone

from .models import TwoFactorChallenge

CHALLENGE_TTL_SECONDS = 300
MAX_OTP_ATTEMPTS = 5
TOTP_VALID_WINDOW = 1
TOTP_ISSUER = "KORA"

_SECRET_SALT = "utilisateurs.totp.secret"
_CHALLENGE_SALT = "utilisateurs.totp.challenge"
_OTP_PATTERN = re.compile(r"^\d{6}$")


def encode_totp_secret(secret: str) -> str:
    if not secret:
        return ""
    return signing.dumps(secret, salt=_SECRET_SALT, compress=True)


def decode_totp_secret(encoded_secret: str) -> str:
    if not encoded_secret:
        return ""
    try:
        return signing.loads(encoded_secret, salt=_SECRET_SALT)
    except signing.BadSignature:
        # Compat descendante: anciens secrets stockes en clair.
        return encoded_secret


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def build_otpauth_url(username: str, secret: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=TOTP_ISSUER)


def build_qr_code_base64(otpauth_url: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(otpauth_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def is_valid_otp_code(code: str) -> bool:
    return bool(code and _OTP_PATTERN.fullmatch(code))


def verify_totp_for_user(user, code: str, valid_window: int = TOTP_VALID_WINDOW):
    if not is_valid_otp_code(code):
        return False, "Le code OTP doit contenir exactement 6 chiffres.", None

    secret = decode_totp_secret(user.totp_secret)
    if not secret:
        return False, "2FA non configure pour ce compte.", None

    totp = pyotp.TOTP(secret)
    current_step = int(time.time()) // totp.interval
    matched_step = None

    for delta in range(-valid_window, valid_window + 1):
        step = current_step + delta
        if step < 0:
            continue
        candidate = totp.at(step * totp.interval)
        if secrets.compare_digest(candidate, code):
            matched_step = step
            break

    if matched_step is None:
        return False, "Code OTP invalide ou expire.", None

    if user.totp_last_used_step is not None and matched_step <= user.totp_last_used_step:
        return False, "Ce code OTP a deja ete utilise.", None

    return True, "", matched_step


def issue_login_challenge(user, ip_address=None):
    challenge = TwoFactorChallenge.objects.create(
        utilisateur=user,
        expires_at=timezone.now() + timedelta(seconds=CHALLENGE_TTL_SECONDS),
        max_attempts=MAX_OTP_ATTEMPTS,
        ip_address=ip_address,
    )
    payload = {"cid": str(challenge.id), "uid": user.id}
    challenge_token = signing.dumps(payload, salt=_CHALLENGE_SALT, compress=True)
    return challenge, challenge_token


def resolve_login_challenge(challenge_token: str):
    try:
        payload = signing.loads(
            challenge_token,
            salt=_CHALLENGE_SALT,
            max_age=CHALLENGE_TTL_SECONDS,
        )
    except signing.SignatureExpired:
        return None, "Challenge 2FA expire."
    except signing.BadSignature:
        return None, "Challenge 2FA invalide."

    challenge_id = payload.get("cid")
    user_id = payload.get("uid")
    if not challenge_id or not user_id:
        return None, "Challenge 2FA invalide."

    challenge = TwoFactorChallenge.objects.select_related("utilisateur").filter(
        id=challenge_id,
        utilisateur_id=user_id,
    ).first()
    if not challenge:
        return None, "Challenge 2FA introuvable."

    now = timezone.now()
    if challenge.consumed_at is not None:
        return None, "Challenge 2FA deja consomme."
    if challenge.expires_at <= now:
        return None, "Challenge 2FA expire."
    if challenge.attempts >= challenge.max_attempts:
        return None, "Trop de tentatives OTP pour ce challenge."

    return challenge, ""


def increment_challenge_attempt(challenge):
    challenge.attempts += 1
    if challenge.attempts >= challenge.max_attempts:
        challenge.consumed_at = timezone.now()
    challenge.save(update_fields=["attempts", "consumed_at"])


def consume_challenge(challenge):
    challenge.consumed_at = timezone.now()
    challenge.save(update_fields=["consumed_at"])


def _fallback_attempts_key(username: str, ip_address: str) -> str:
    return f"2fa_fallback_attempts:{username}:{ip_address or 'unknown'}"


def register_fallback_failure(username: str, ip_address: str):
    key = _fallback_attempts_key(username, ip_address)
    attempts = cache.get(key, 0) + 1
    cache.set(key, attempts, CHALLENGE_TTL_SECONDS)
    return attempts


def clear_fallback_failures(username: str, ip_address: str):
    cache.delete(_fallback_attempts_key(username, ip_address))


def get_fallback_attempts(username: str, ip_address: str):
    return cache.get(_fallback_attempts_key(username, ip_address), 0)

