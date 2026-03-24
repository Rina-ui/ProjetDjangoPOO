from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse

from .serializers import (
    InscriptionSerializer,
    ConnexionSerializer,
    ProfilSerializer,
    Activer2FASerializer,
    Verifier2FASerializer,
)


@extend_schema_view(
    post=extend_schema(request=InscriptionSerializer, responses={201: InscriptionSerializer})
)
class InscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Inscription d'un nouvel utilisateur."""
        serializer = InscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': InscriptionSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_201_CREATED)


@extend_schema_view(
    post=extend_schema(request=ConnexionSerializer, responses={200: ProfilSerializer})
)
class ConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """Connexion avec username + password + OTP (si 2FA activé)."""
        serializer = ConnexionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'detail': 'Identifiants invalides.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.otp_secret:
            otp_code = serializer.validated_data.get('otp_code', '')
            if not otp_code:
                return Response(
                    {'detail': 'Code 2FA requis.', '2fa_required': True},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not user.verifier_otp(otp_code):
                return Response(
                    {'detail': 'Code 2FA invalide.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': ProfilSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


@extend_schema_view(
    get=extend_schema(responses={200: ProfilSerializer}),
    put=extend_schema(request=ProfilSerializer, responses={200: ProfilSerializer}),
)
class ProfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Consulter son profil."""
        return Response(ProfilSerializer(request.user).data)

    def put(self, request):
        """Modifier son profil."""
        serializer = ProfilSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={200: OpenApiResponse(description='{"otp_secret": "...", "otp_uri": "otpauth://..."}')},
    )
)
class Activer2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Étape 1 : génère le secret TOTP et retourne l'URI pour le QR code."""
        user = request.user
        if user.otp_secret:
            return Response(
                {'detail': '2FA déjà activé.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = user.activer_2fa()
        uri = user.generer_otp_uri()
        return Response({'otp_secret': secret, 'otp_uri': uri})


@extend_schema_view(
    post=extend_schema(
        request=Activer2FASerializer,
        responses={200: OpenApiResponse(description='Confirmation 2FA activé')},
    )
)
class Confirmer2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Étape 2 : confirme l'activation avec un code de l'app Authenticator."""
        serializer = Activer2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.otp_secret:
            return Response(
                {'detail': "Appelez /2fa/activer/ d'abord."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.verifier_otp(serializer.validated_data['otp_code']):
            return Response({'detail': '2FA activé avec succès.'})

        user.desactiver_2fa()
        return Response(
            {'detail': 'Code invalide. 2FA annulé.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


@extend_schema_view(
    post=extend_schema(
        request=Verifier2FASerializer,
        responses={200: OpenApiResponse(description='2FA désactivé')},
    )
)
class Desactiver2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Désactive le 2FA après vérification du code actuel."""
        serializer = Verifier2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.otp_secret:
            return Response(
                {'detail': "2FA n'est pas activé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.verifier_otp(serializer.validated_data['otp_code']):
            return Response(
                {'detail': 'Code 2FA invalide.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.desactiver_2fa()
        return Response({'detail': '2FA désactivé.'})

        """Inscription d'un nouvel utilisateur."""
        serializer = InscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': InscriptionSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_201_CREATED)


class ConnexionView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=ConnexionSerializer, responses={200: ProfilSerializer})
    def post(self, request):
        """Connexion avec username + password + OTP (si 2FA activé)."""
        serializer = ConnexionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'detail': 'Identifiants invalides.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user.otp_secret:
            otp_code = serializer.validated_data.get('otp_code', '')
            if not otp_code:
                return Response(
                    {'detail': 'Code 2FA requis.', '2fa_required': True},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not user.verifier_otp(otp_code):
                return Response(
                    {'detail': 'Code 2FA invalide.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': ProfilSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


class ProfilView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ProfilSerializer})
    def get(self, request):
        """Consulter son profil."""
        return Response(ProfilSerializer(request.user).data)

    @extend_schema(request=ProfilSerializer, responses={200: ProfilSerializer})
    def put(self, request):
        """Modifier son profil."""
        serializer = ProfilSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class Activer2FAView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={200: OpenApiResponse(description='{"otp_secret": "...", "otp_uri": "otpauth://..."}')},
    )
    def post(self, request):
        """Étape 1 : génère le secret TOTP et retourne l'URI pour le QR code."""
        user = request.user
        if user.otp_secret:
            return Response(
                {'detail': '2FA déjà activé.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = user.activer_2fa()
        uri = user.generer_otp_uri()
        return Response({'otp_secret': secret, 'otp_uri': uri})


class Confirmer2FAView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=Activer2FASerializer, responses={200: OpenApiResponse(description='Confirmation 2FA activé')})
    def post(self, request):
        """Étape 2 : confirme l'activation avec un code de l'app Authenticator."""
        serializer = Activer2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.otp_secret:
            return Response(
                {'detail': "Appelez /2fa/activer/ d'abord."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.verifier_otp(serializer.validated_data['otp_code']):
            return Response({'detail': '2FA activé avec succès.'})

        user.desactiver_2fa()
        return Response(
            {'detail': 'Code invalide. 2FA annulé.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class Desactiver2FAView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=Verifier2FASerializer, responses={200: OpenApiResponse(description='2FA désactivé')})
    def post(self, request):
        """Désactive le 2FA après vérification du code actuel."""
        serializer = Verifier2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.otp_secret:
            return Response(
                {'detail': "2FA n'est pas activé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.verifier_otp(serializer.validated_data['otp_code']):
            return Response(
                {'detail': 'Code 2FA invalide.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user.desactiver_2fa()
        return Response({'detail': '2FA désactivé.'})

