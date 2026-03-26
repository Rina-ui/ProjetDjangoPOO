from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Locataire, Bail, BienSauvegarde, Visitebien
from .serializers import LocataireSerializer, BailSerializer, BienSauvegardeSerializer, VisiteSerializer
from patrimoine.models import Bien


class LocataireViewSet(viewsets.ModelViewSet):
    queryset = Locataire.objects.all()
    serializer_class = LocataireSerializer


class BailViewSet(viewsets.ModelViewSet):
    queryset = Bail.objects.all()
    serializer_class = BailSerializer

    @action(detail=True, methods=['post'])
    def resilier(self, request, pk=None):
        bail = self.get_object()
        bail.resilier()
        return Response({'success': True, 'message': 'Bail résilié'})

    @action(detail=True, methods=['post'])
    def reviser_loyer(self, request, pk=None):
        bail = self.get_object()
        nouveau_loyer = bail.reviser_loyer()
        return Response({'success': True, 'nouveau_loyer': nouveau_loyer})


class VisiteViewSet(viewsets.ModelViewSet):
    serializer_class   = VisiteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Visitebien.objects.filter(
            client=self.request.user
        ).select_related('bien', 'bien__proprietaire')

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        bien_id = request.data.get('bien')
        # Bloquer double réservation
        deja = Visitebien.objects.filter(
            bien_id=bien_id,
            client=request.user,
            statut__in=['EN_ATTENTE', 'CONFIRMEE']
        ).exists()
        if deja:
            return Response(
                {'detail': 'Vous avez déjà une visite planifiée pour ce bien.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(client=request.user)
        Bien.objects.filter(id=bien_id).update(visite_en_cours=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        visite = self.get_object()
        if visite.client != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        visite.statut = 'ANNULEE'
        visite.save()
        Bien.objects.filter(id=visite.bien_id).update(visite_en_cours=False)
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Admin confirme la visite."""
        visite = self.get_object()
        visite.statut = 'CONFIRMEE'
        visite.save()
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def effectuee(self, request, pk=None):
        """Admin marque la visite comme effectuée."""
        visite = self.get_object()
        visite.statut = 'EFFECTUEE'
        visite.save()
        Bien.objects.filter(id=visite.bien_id).update(visite_en_cours=False)
        return Response({'success': True})


class BienSauvegardeViewSet(viewsets.ModelViewSet):
    serializer_class   = BienSauvegardeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BienSauvegarde.objects.filter(client=self.request.user).select_related('bien')

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle save/unsave un bien."""
        bien_id = request.data.get('bien_id')
        if not bien_id:
            return Response({'error': 'bien_id requis'}, status=400)

        obj = BienSauvegarde.objects.filter(client=request.user, bien_id=bien_id).first()
        if obj:
            obj.delete()
            return Response({'saved': False})
        else:
            BienSauvegarde.objects.create(client=request.user, bien_id=bien_id)
            return Response({'saved': True}, status=201)

    @action(detail=False, methods=['get'])
    def ids(self, request):
        """Retourne juste la liste des IDs sauvegardés."""
        ids = BienSauvegarde.objects.filter(client=request.user).values_list('bien_id', flat=True)
        return Response(list(ids))