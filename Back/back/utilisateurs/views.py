from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog, Proprietaire, Utilisateur
from .serializers import (
    AuditLogSerializer,
    KoraTokenSerializer,
    LoginSerializer,
    ProprietaireSerializer,
    RegisterSerializer,
    TwoFADisableSerializer,
    TwoFALoginSerializer,
    TwoFASetupResponseSerializer,
    TwoFAVerifySerializer,
    UtilisateurSerializer,
)
from .services import (
    MAX_OTP_ATTEMPTS,
    build_otpauth_url,
    build_qr_code_base64,
    clear_fallback_failures,
    decode_totp_secret,
    encode_totp_secret,
    generate_totp_secret,
    get_fallback_attempts,
    increment_challenge_attempt,
    issue_login_challenge,
    register_fallback_failure,
    resolve_login_challenge,
    verify_totp_for_user,
    consume_challenge,
)
from .throttles import LoginRateThrottle, TwoFALoginRateThrottle, TwoFAVerifyRateThrottle


def _extract_error_detail(serializer):
    if not serializer.errors:
        return "Donnees invalides."
    first_error = next(iter(serializer.errors.values()))
    if isinstance(first_error, list) and first_error:
        return str(first_error[0])
    return str(first_error)


def _issue_tokens_for_user(user):
    refresh = KoraTokenSerializer.get_token(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _audit(user, action, detail):
    AuditLog.objects.create(
        utilisateur=user,
        action=action,
        modele="Utilisateur",
        objet_id=getattr(user, "id", None),
        nouvelle_valeur=detail,
    )


class KoraLoginView(APIView):
    """Login JWT en 2 etapes: mot de passe puis OTP si 2FA active."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response({"detail": _extract_error_detail(serializer)}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.validated_data["user"]

        if user.totp_enabled:
            challenge, challenge_token = issue_login_challenge(user, request.META.get("REMOTE_ADDR"))
            _audit(user, "AUTH_LOGIN_2FA_REQUIRED", f"challenge={challenge.id}")
            return Response(
                {
                    "requires_2fa": True,
                    "challenge_token": challenge_token,
                    "method": "totp",
                    "temp_token": challenge_token,
                },
                status=status.HTTP_200_OK,
            )

        _audit(user, "AUTH_LOGIN_SUCCESS", "Connexion sans 2FA")
        return Response(_issue_tokens_for_user(user), status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    """Creation de compte public."""

    queryset = Utilisateur.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Compte cree avec succes.",
                "user": UtilisateurSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)


class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAdminUser]


class ProprietaireViewSet(viewsets.ModelViewSet):
    queryset = Proprietaire.objects.all()
    serializer_class = ProprietaireSerializer


class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]


class Setup2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        secret = decode_totp_secret(user.totp_secret)

        if not secret:
            secret = generate_totp_secret()
            user.totp_secret = encode_totp_secret(secret)
            user.save(update_fields=["totp_secret"])

        otpauth_url = build_otpauth_url(user.username, secret)
        qr_base64 = build_qr_code_base64(otpauth_url)
        payload = {
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "secret": secret,
            "qr": f"data:image/png;base64,{qr_base64}",
            "otpauth_url": otpauth_url,
            "base32": secret,
        }
        return Response(TwoFASetupResponseSerializer(payload).data, status=status.HTTP_200_OK)


class Verify2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TwoFAVerifyRateThrottle]

    def post(self, request):
        serializer = TwoFAVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": _extract_error_detail(serializer)}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        ok, detail, matched_step = verify_totp_for_user(user, serializer.validated_data["code"])
        if not ok:
            _audit(user, "AUTH_2FA_VERIFY_FAILED", detail)
            return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = True
        user.totp_last_verified_at = timezone.now()
        user.totp_last_used_step = matched_step
        user.save(update_fields=["totp_enabled", "totp_last_verified_at", "totp_last_used_step"])
        _audit(user, "AUTH_2FA_ENABLED", "Activation 2FA reussie")
        return Response({"detail": "2FA activee avec succes."}, status=status.HTTP_200_OK)


class Login2FAView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [TwoFALoginRateThrottle]

    def post(self, request):
        serializer = TwoFALoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": _extract_error_detail(serializer)}, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"]
        challenge_token = serializer.validated_data.get("challenge_token")
        ip_address = request.META.get("REMOTE_ADDR")

        if challenge_token:
            challenge, challenge_error = resolve_login_challenge(challenge_token)
            if challenge_error:
                return Response({"detail": challenge_error}, status=status.HTTP_400_BAD_REQUEST)

            user = challenge.utilisateur
            ok, detail, matched_step = verify_totp_for_user(user, code)
            if not ok:
                increment_challenge_attempt(challenge)
                _audit(user, "AUTH_2FA_LOGIN_FAILED", detail)
                if challenge.attempts >= challenge.max_attempts:
                    return Response(
                        {"detail": f"Trop de tentatives OTP (max {MAX_OTP_ATTEMPTS})."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
                return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

            user.totp_last_verified_at = timezone.now()
            user.totp_last_used_step = matched_step
            user.save(update_fields=["totp_last_verified_at", "totp_last_used_step"])
            consume_challenge(challenge)
            _audit(user, "AUTH_2FA_LOGIN_SUCCESS", f"challenge={challenge.id}")
            return Response(_issue_tokens_for_user(user), status=status.HTTP_200_OK)

        username = serializer.validated_data.get("username")
        attempts = get_fallback_attempts(username, ip_address)
        if attempts >= MAX_OTP_ATTEMPTS:
            return Response(
                {"detail": f"Trop de tentatives OTP (max {MAX_OTP_ATTEMPTS})."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        user = Utilisateur.objects.filter(username=username).first()
        if not user or not user.totp_enabled:
            register_fallback_failure(username, ip_address)
            _audit(user, "AUTH_2FA_LOGIN_FAILED", "Utilisateur introuvable ou 2FA desactive")
            return Response({"detail": "Authentification 2FA impossible."}, status=status.HTTP_400_BAD_REQUEST)

        ok, detail, matched_step = verify_totp_for_user(user, code)
        if not ok:
            attempts = register_fallback_failure(username, ip_address)
            _audit(user, "AUTH_2FA_LOGIN_FAILED", detail)
            if attempts >= MAX_OTP_ATTEMPTS:
                return Response(
                    {"detail": f"Trop de tentatives OTP (max {MAX_OTP_ATTEMPTS})."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

        clear_fallback_failures(username, ip_address)
        user.totp_last_verified_at = timezone.now()
        user.totp_last_used_step = matched_step
        user.save(update_fields=["totp_last_verified_at", "totp_last_used_step"])
        _audit(user, "AUTH_2FA_LOGIN_SUCCESS", "Mode fallback username+otp")
        return Response(_issue_tokens_for_user(user), status=status.HTTP_200_OK)


class Disable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TwoFAVerifyRateThrottle]

    def post(self, request):
        serializer = TwoFADisableSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": _extract_error_detail(serializer)}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        password = serializer.validated_data.get("password")
        code = serializer.validated_data.get("code")

        if password and not user.check_password(password):
            _audit(user, "AUTH_2FA_DISABLE_FAILED", "Mot de passe invalide")
            return Response({"detail": "Mot de passe invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if code and user.totp_enabled:
            ok, detail, _ = verify_totp_for_user(user, code)
            if not ok:
                _audit(user, "AUTH_2FA_DISABLE_FAILED", detail)
                return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = False
        user.totp_secret = ""
        user.backup_codes = []
        user.totp_last_verified_at = None
        user.totp_last_used_step = None
        user.save(
            update_fields=[
                "totp_enabled",
                "totp_secret",
                "backup_codes",
                "totp_last_verified_at",
                "totp_last_used_step",
            ]
        )
        _audit(user, "AUTH_2FA_DISABLED", "2FA desactive")
        return Response({"detail": "2FA desactivee avec succes."}, status=status.HTTP_200_OK)
