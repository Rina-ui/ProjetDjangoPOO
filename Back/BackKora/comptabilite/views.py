from django.shortcuts import render

from rest_framework import viewsets
from .models import Paiement, Depense
from .serializers import PaiementSerializer, DepenseSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer


class DepenseViewSet(viewsets.ModelViewSet):
    queryset = Depense.objects.all()
    serializer_class = DepenseSerializer
