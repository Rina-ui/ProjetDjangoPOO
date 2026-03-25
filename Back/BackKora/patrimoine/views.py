from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Categorie, TypeBien, Bien, PhotoBien
from .serializers import (
    CategorieSerializer,
    TypeBienSerializer,
    BienSerializer, PhotoBienSerializer
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

    @action(
        detail=True,
        methods=["post"],
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[IsAuthenticated],
        url_path="upload-photos",
    )
    def upload_photos(self, request, pk=None):
        bien = self.get_object()
        files = request.FILES.getlist("photos")

        if bien.proprietaire.utilisateur_id != request.user.id:
            return Response(
                {"detail": "Vous n'etes pas autorise a modifier ce bien."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not files:
            return Response(
                {"detail": "Aucune photo recue. Utilisez la cle multipart 'photos'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = [PhotoBien.objects.create(bien=bien, image=f) for f in files]
        data = PhotoBienSerializer(created, many=True, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)


