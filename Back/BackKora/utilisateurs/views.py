from django.shortcuts import render

from rest_framework import viewsets
from .models import Utilisateur, Proprietaire, AuditLog
from .serializers import (
    UtilisateurSerializer,
    ProprietaireSerializer,
    AuditLogSerializer
)


class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer


class ProprietaireViewSet(viewsets.ModelViewSet):
    queryset = Proprietaire.objects.all()
    serializer_class = ProprietaireSerializer


class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer