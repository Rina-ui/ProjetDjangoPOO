from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Paiement, Depense
from .serializers import PaiementSerializer, DepenseSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        paiement = self.get_object()
        paiement.valider()
        return Response({'success': True, 'message': 'Paiement validé'})

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        paiement = self.get_object()
        paiement.annuler()
        return Response({'success': True, 'message': 'Paiement annulé'})


class DepenseViewSet(viewsets.ModelViewSet):
    queryset = Depense.objects.all()
    serializer_class = DepenseSerializer
