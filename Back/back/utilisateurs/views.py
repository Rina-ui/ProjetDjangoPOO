from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Utilisateur, Proprietaire, AuditLog
from .serializers import (
    UtilisateurSerializer, RegisterSerializer,
    ProprietaireSerializer, AuditLogSerializer, KoraTokenSerializer
)
from .topt import generer_qr_base64, generer_secret, verifier_code


class KoraLoginView(TokenObtainPairView):
    """Login JWT enrichi avec role + full_name."""
    serializer_class = KoraTokenSerializer


class RegisterView(generics.CreateAPIView):
    """Création de compte — public."""
    queryset = Utilisateur.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'Compte créé avec succès.',
            'user': UtilisateurSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """Retourne l'utilisateur connecté."""
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
    """Génère le QR code pour Google Authenticator."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.totp_secret:
            user.totp_secret = generer_secret()
            user.save()

        qr_base64 = generer_qr_base64(user.username, user.totp_secret)

        return Response({
            'qr_code':  f"data:image/png;base64,{qr_base64}",
            'secret':   user.totp_secret,
        })


class Verify2FAView(APIView):
    """Vérifie le code et active le 2FA."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '')
        user = request.user

        if not user.totp_secret:
            return Response({'error': 'Setup 2FA d\'abord'}, status=400)

        if verifier_code(user.totp_secret, code):
            user.totp_enabled = True
            user.save()
            return Response({'success': True, 'message': '2FA activé !'})

        return Response({'error': 'Code invalide'}, status=400)


class Login2FAView(APIView):
    """Vérifie le code 2FA lors de la connexion."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        code     = request.data.get('code')

        try:
            user = Utilisateur.objects.get(username=username)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)

        if verifier_code(user.totp_secret, code):
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
            })

        return Response({'error': 'Code invalide'}, status=400)
