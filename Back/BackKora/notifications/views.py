from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Quittance, DemandeContact
from .serializers import QuittanceSerializer, DemandeContactSerializer


class QuittanceViewSet(viewsets.ModelViewSet):
    queryset = Quittance.objects.all()
    serializer_class = QuittanceSerializer

    @action(detail=True, methods=['post'])
    def generer_pdf(self, request, pk=None):
        quittance = self.get_object()

        if quittance.fichier_pdf:
            return Response({'message': 'PDF déjà généré'}, status=400)

        quittance.generer_pdf()
        return Response({'message': 'PDF généré'})

    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        quittance = self.get_object()

        if not quittance.fichier_pdf:
            return Response({'error': 'Générer le PDF avant'}, status=400)

        if quittance.envoyee:
            return Response({'message': 'Déjà envoyée'}, status=400)

        quittance.envoyer_par_email()
        quittance.envoyee = True
        quittance.save()

        return Response({'message': 'Envoyée avec succès'})

class DemandeContactViewSet(viewsets.ModelViewSet):
        queryset = DemandeContact.objects.all()
        serializer_class = DemandeContactSerializer

        @action(detail=True, methods=['post'])
        def traiter(self, request, pk=None):
            demande = self.get_object()
            reponse = request.data.get('reponse', '')
            demande.traiter(reponse)
            return Response({'message': 'Demande traitée'})

        @action(detail=True, methods=['post'])
        def rejeter(self, request, pk=None):
            demande = self.get_object()
            raison = request.data.get('raison', '')
            demande.rejeter(raison)
            return Response({'message': 'Demande rejetée'})