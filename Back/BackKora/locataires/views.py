from django.shortcuts import render

from rest_framework import viewsets
from .models import Locataire, Bail
from .serializers import LocataireSerializer, BailSerializer


class LocataireViewSet(viewsets.ModelViewSet):
    queryset = Locataire.objects.all()
    serializer_class = LocataireSerializer


class BailViewSet(viewsets.ModelViewSet):
    queryset = Bail.objects.all()
    serializer_class = BailSerializer