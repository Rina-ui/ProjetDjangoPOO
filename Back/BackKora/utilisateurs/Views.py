from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Utilisateur, Proprietaire, AuditLog
from .serializers import (
    UtilisateurSerializer, RegisterSerializer,
    ProprietaireSerializer, AuditLogSerializer, KoraTokenSerializer
)


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