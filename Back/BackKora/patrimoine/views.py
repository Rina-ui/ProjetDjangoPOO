
<<<<<<< HEAD
# patrimoine/views.py

# ================================
# 🔹 IMPORTS DRF & DJANGO
# ================================
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

# ================================
# 🔹 IMPORTS LOCAUX
# ================================
from .models import Bien, Categorie, TypeBien
from .serializers import BienSerializer, CategorieSerializer, TypeBienSerializer
from .permissions import IsOwnerOrAdmin
from .filters import BienFilter

# 🔥 SERVICES (LOGIQUE METIER)
from .services import (
    changer_statut_bien,
    mettre_bien_en_ligne,
    creer_bien,
    modifier_bien,
    supprimer_bien
)


# ================================
# 🔹 VIEWSET BIEN (COEUR API)
# ================================
class BienViewSet(viewsets.ModelViewSet):
    """
    ViewSet principal pour gérer les biens immobiliers.

    ✔ CRUD complet
    ✔ Filtrage & recherche
    ✔ Permissions
    ✔ Actions personnalisées (statut, mise en ligne)
    ✔ Connexion avec services.py (logique métier)
    """

    queryset = Bien.objects.all()
    serializer_class = BienSerializer
    permission_classes = [IsOwnerOrAdmin]

    # 🔍 Filtrage + recherche
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = BienFilter
    search_fields = ['adresse']

    # ================================
    # 🔹 FILTRAGE PAR UTILISATEUR
    # ================================
    def get_queryset(self):
        """
        - Admin : voit tous les biens
        - Propriétaire : voit uniquement ses biens
        """
        user = self.request.user

        if user.is_staff:
            return Bien.objects.all()

        return Bien.objects.filter(proprietaire__user=user)

    # ================================
    # 🔹 CREATION D’UN BIEN
    # ================================
    def create(self, request, *args, **kwargs):
        """
        Création via service (avec audit log)
        """
        try:
            bien = creer_bien(request.data, request.user)
            serializer = self.get_serializer(bien)

            return Response({
                "success": True,
                "data": serializer.data,
                "message": "Bien créé avec succès"
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({
                "success": False,
                "error": "Erreur interne serveur"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ================================
    # 🔹 MODIFICATION D’UN BIEN
    # ================================
    def update(self, request, *args, **kwargs):
        """
        Mise à jour via service (avec audit log)
        """
        bien = self.get_object()

        try:
            bien = modifier_bien(bien, request.data, request.user)
            serializer = self.get_serializer(bien)

            return Response({
                "success": True,
                "data": serializer.data,
                "message": "Bien modifié avec succès"
            })

        except ValidationError as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ================================
    # 🔹 SUPPRESSION D’UN BIEN
    # ================================
    def destroy(self, request, *args, **kwargs):
        """
        Suppression via service (avec audit log)
        """
        bien = self.get_object()

        try:
            supprimer_bien(bien, request.user)

            return Response({
                "success": True,
                "message": "Bien supprimé avec succès"
            })

        except Exception:
            return Response({
                "success": False,
                "error": "Erreur lors de la suppression"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ================================
    # 🔹 ACTION : CHANGER STATUT
    # ================================
    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """
        Endpoint personnalisé pour changer le statut d’un bien
        """
        bien = self.get_object()

        try:
            nouveau_statut = request.data.get('statut')

            changer_statut_bien(bien, nouveau_statut, request.user)

            return Response({
                "success": True,
                "message": "Statut modifié avec succès"
            })

        except ValidationError as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({
                "success": False,
                "error": "Erreur interne serveur"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ================================
    # 🔹 ACTION : METTRE EN LIGNE
    # ================================
    @action(detail=True, methods=['post'])
    def mettre_en_ligne(self, request, pk=None):
        """
        Endpoint pour publier un bien
        """
        bien = self.get_object()

        try:
            mettre_bien_en_ligne(bien, request.user)

            return Response({
                "success": True,
                "message": "Bien mis en ligne"
            })

        except ValidationError as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({
                "success": False,
                "error": "Erreur interne serveur"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================================
# 🔹 VIEWSET CATEGORIE
# ================================
class CategorieViewSet(viewsets.ModelViewSet):
    """
    Gestion des catégories de biens
    """
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer


# ================================
# 🔹 VIEWSET TYPE BIEN
# ================================
class TypeBienViewSet(viewsets.ModelViewSet):
    """
    Gestion des types de biens
    """
    queryset = TypeBien.objects.all()
    serializer_class = TypeBienSerializer

=======
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Categorie, TypeBien, Bien
from .serializers import (
    CategorieSerializer,
    TypeBienSerializer,
    BienSerializer
)

class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer

class TypeBienViewSet(viewsets.ModelViewSet):
    queryset = TypeBien.objects.all()
    serializer_class = TypeBienSerializer

class BienViewSet(viewsets.ModelViewSet):
    queryset = Bien.objects.all()
    serializer_class = BienSerializer

    @action(detail=True, methods=['post'])
    def mettre_en_ligne(self, request, pk=None):
        bien = self.get_object()

        if bien.en_ligne:
            return Response({'message': 'Déjà en ligne'}, status=400)

        bien.mettre_en_ligne()
        return Response({'message': 'Bien mis en ligne'})

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        bien = self.get_object()

        nouveau_statut = request.data.get('statut')

        if not nouveau_statut:
            return Response({'error': 'Statut requis'}, status=400)

        if nouveau_statut not in dict(Bien.STATUT_CHOICES):
            return Response({'error': 'Statut invalide'}, status=400)

        bien.changer_statut(nouveau_statut)

        return Response({'message': 'Statut mis à jour'})

    @action(detail=True, methods=['get'])
    def loyer_total(self, request, pk=None):
        bien = self.get_object()
        total = bien.calculer_loyer_total()
        return Response({'loyer_total': total})


>>>>>>> features_Lionel


