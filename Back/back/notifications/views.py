from rest_framework import viewsets, status
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
        return Response({'success': True, 'message': 'PDF généré'})

    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        quittance = self.get_object()
        if not quittance.fichier_pdf:
            return Response({'error': 'Générer le PDF d\'abord'}, status=400)
        quittance.envoyer_par_email()
        quittance.envoyee = True
        quittance.save()
        return Response({'success': True, 'message': 'Quittance envoyée par email'})


class DemandeContactViewSet(viewsets.ModelViewSet):
    queryset = DemandeContact.objects.all()
    serializer_class = DemandeContactSerializer

    @action(detail=True, methods=['post'])
    def traiter(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'EN_ATTENTE':
            return Response({'error': 'Déjà traitée'}, status=400)
        reponse = request.data.get('reponse')
        if not reponse:
            return Response({'error': 'Réponse obligatoire'}, status=400)
        from django.utils import timezone
        demande.reponse_admin = reponse
        demande.statut = 'TRAITEE'
        demande.date_traitement = timezone.now()
        demande.save()
        return Response({'success': True, 'message': 'Demande traitée'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'EN_ATTENTE':
            return Response({'error': 'Déjà traitée'}, status=400)
        raison = request.data.get('raison')
        if not raison:
            return Response({'error': 'Raison obligatoire'}, status=400)
        demande.reponse_admin = raison
        demande.statut = 'REJETEE'
        demande.save()
        return Response({'success': True, 'message': 'Demande rejetée'})
