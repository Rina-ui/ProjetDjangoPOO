from datetime import timedelta

import pyotp
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import TwoFactorChallenge, Utilisateur
from .services import encode_totp_secret, generate_totp_secret


class TwoFactorAuthTests(APITestCase):
    def setUp(self):
        self.password = "Password123!"
        self.user = Utilisateur.objects.create_user(
            username="alice",
            email="alice@example.com",
            password=self.password,
        )

    def _enable_totp(self):
        secret = generate_totp_secret()
        self.user.totp_secret = encode_totp_secret(secret)
        self.user.totp_enabled = True
        self.user.totp_last_used_step = None
        self.user.save(update_fields=["totp_secret", "totp_enabled", "totp_last_used_step"])
        return secret

    def test_login_without_2fa_returns_tokens(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertNotIn("requires_2fa", response.data)

    def test_login_with_2fa_required_returns_challenge(self):
        self._enable_totp()

        response = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("requires_2fa"))
        self.assertEqual(response.data.get("method"), "totp")
        self.assertIn("challenge_token", response.data)

    def test_verify_otp_incorrect_then_correct_then_expired(self):
        self.client.force_authenticate(user=self.user)

        setup_response = self.client.get("/api/auth/2fa/setup/")
        self.assertEqual(setup_response.status_code, status.HTTP_200_OK)
        secret = setup_response.data["secret"]

        incorrect = self.client.post("/api/auth/2fa/verify/", {"code": "000000"}, format="json")
        self.assertEqual(incorrect.status_code, status.HTTP_400_BAD_REQUEST)

        expired_code = pyotp.TOTP(secret).at(timezone.now() - timedelta(minutes=2))
        expired = self.client.post("/api/auth/2fa/verify/", {"code": expired_code}, format="json")
        self.assertEqual(expired.status_code, status.HTTP_400_BAD_REQUEST)

        valid_code = pyotp.TOTP(secret).now()
        ok = self.client.post("/api/auth/2fa/verify/", {"code": valid_code}, format="json")
        self.assertEqual(ok.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.totp_enabled)

    def test_setup_then_activation(self):
        self.client.force_authenticate(user=self.user)

        setup_response = self.client.get("/api/auth/2fa/setup/")
        self.assertEqual(setup_response.status_code, status.HTTP_200_OK)
        self.assertIn("qr_code", setup_response.data)
        self.assertIn("secret", setup_response.data)
        self.assertIn("otpauth_url", setup_response.data)

        code = pyotp.TOTP(setup_response.data["secret"]).now()
        verify_response = self.client.post("/api/auth/2fa/verify/", {"otp": code}, format="json")
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

    def test_2fa_login_challenge_flow_and_expired_challenge(self):
        secret = self._enable_totp()

        login_response = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": self.password},
            format="json",
        )
        challenge_token = login_response.data["challenge_token"]

        code = pyotp.TOTP(secret).now()
        twofa_response = self.client.post(
            "/api/auth/2fa/login/",
            {"challenge_token": challenge_token, "code": code},
            format="json",
        )
        self.assertEqual(twofa_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", twofa_response.data)
        self.assertIn("refresh", twofa_response.data)

        second_login = self.client.post(
            "/api/auth/login/",
            {"username": self.user.username, "password": self.password},
            format="json",
        )
        expired_token = second_login.data["challenge_token"]
        challenge = TwoFactorChallenge.objects.latest("created_at")
        challenge.expires_at = timezone.now() - timedelta(seconds=1)
        challenge.save(update_fields=["expires_at"])

        expired_response = self.client.post(
            "/api/auth/2fa/login/",
            {"challenge_token": expired_token, "code": pyotp.TOTP(secret).now()},
            format="json",
        )
        self.assertEqual(expired_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_disable_2fa(self):
        secret = self._enable_totp()
        self.client.force_authenticate(user=self.user)

        disable_response = self.client.post(
            "/api/auth/2fa/disable/",
            {"password": self.password, "code": pyotp.TOTP(secret).now()},
            format="json",
        )

        self.assertEqual(disable_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)
        self.assertEqual(self.user.totp_secret, "")
