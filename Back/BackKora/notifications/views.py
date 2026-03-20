# notifications/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from .models import Quittance, DemandeContact
from .services import traiter_quittance, traiter_demande, rejeter_demande


# ==========================================
# 🔹 QUITTANCE API
# ==========================================
class QuittanceViewSet(viewsets.ModelViewSet):
    queryset = Quittance.objects.all()
    serializer_class = None  # à ajouter si besoin

    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        quittance = self.get_object()

        try:
            traiter_quittance(quittance, request.user)

            return Response({"success": True, "message": "Quittance envoyée"})

        except ValidationError as e:
            return Response({"error": str(e)}, status=400)


# ==========================================
# 🔹 DEMANDE CONTACT API
# ==========================================
class DemandeContactViewSet(viewsets.ModelViewSet):
    queryset = DemandeContact.objects.all()
    serializer_class = None

    @action(detail=True, methods=['post'])
    def traiter(self, request, pk=None):
        demande = self.get_object()
        reponse = request.data.get("reponse")

        try:
            traiter_demande(demande, reponse)
            return Response({"success": True, "message": "Demande traitée"})
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        demande = self.get_object()
        raison = request.data.get("raison")

        try:
            rejeter_demande(demande, raison)
            return Response({"success": True, "message": "Demande rejetée"})
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)