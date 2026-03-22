from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Locataire, Bail
from .serializers import LocataireSerializer, BailSerializer


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
