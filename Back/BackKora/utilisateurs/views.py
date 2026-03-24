from django.shortcuts import render
from django.contrib.auth import authenticate

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import Utilisateur, Proprietaire, AuditLog
from .serializers import (
    UtilisateurSerializer,
    ProprietaireSerializer,
    AuditLogSerializer, RegisterSerializer
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


class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Utilisateur créé'}, status=201)

        return Response(serializer.errors, status=400)


class LoginView(APIView):
    """Vue pour l'authentification des utilisateurs."""

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username et password sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authentifier l'utilisateur avec le username/email
        user = authenticate(username=username, password=password)

        if user is not None:
            serializer = UtilisateurSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(
            {'error': 'Identifiants invalides'},
            status=status.HTTP_401_UNAUTHORIZED
        )


