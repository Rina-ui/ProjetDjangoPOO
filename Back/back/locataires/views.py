from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Locataire, Bail, BienSauvegarde, Visitebien
from .serializers import LocataireSerializer, BailSerializer, BienSauvegardeSerializer, VisiteSerializer


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
        return Visitebien.objects.filter(client=self.request.user).select_related('bien')

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        visite = self.get_object()
        visite.statut = 'ANNULEE'
        visite.save()
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