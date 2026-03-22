import pyotp
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64


def generer_secret():
    """Génère une clé secrète TOTP unique."""
    return pyotp.random_base32()


def generer_qr_url(username, secret):
    """Génère l'URL otpauth pour Google Authenticator."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=username,
        issuer_name="KÔRÂ"
    )


def generer_qr_base64(username, secret):
    """Génère le QR code en base64 pour l'afficher dans le front."""
    url = generer_qr_url(username, secret)

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def verifier_code(secret, code):
    """Vérifie le code à 6 chiffres."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)