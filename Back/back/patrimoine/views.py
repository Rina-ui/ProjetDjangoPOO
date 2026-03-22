from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Bien, Categorie, TypeBien
from .serializers import BienSerializer, CategorieSerializer, TypeBienSerializer


class BienViewSet(viewsets.ModelViewSet):
    queryset = Bien.objects.all()
    serializer_class = BienSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['statut', 'categorie', 'proprietaire', 'en_ligne']
    search_fields = ['adresse', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return Bien.objects.all()
        return Bien.objects.filter(proprietaire__utilisateur=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bien = serializer.save()
        return Response({'success': True, 'data': BienSerializer(bien).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        bien = self.get_object()
        nouveau_statut = request.data.get('statut')
        if not nouveau_statut or nouveau_statut not in dict(Bien.STATUT_CHOICES):
            return Response({'error': 'Statut invalide'}, status=400)
        bien.changer_statut(nouveau_statut)
        return Response({'success': True, 'message': 'Statut mis à jour'})

    @action(detail=True, methods=['post'])
    def mettre_en_ligne(self, request, pk=None):
        bien = self.get_object()
        bien.mettre_en_ligne()
        return Response({'success': True, 'message': 'Bien mis en ligne'})

    @action(detail=True, methods=['get'])
    def loyer_total(self, request, pk=None):
        bien = self.get_object()
        return Response({'loyer_total': bien.calculer_loyer_total()})


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer


class TypeBienViewSet(viewsets.ModelViewSet):
    queryset = TypeBien.objects.all()
    serializer_class = TypeBienSerializer
