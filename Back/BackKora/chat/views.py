from django.db import models
from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


from rest_framework.permissions import IsAuthenticated

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer
    queryset = Conversation.objects.all()

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Conversation.objects.none()

        return Conversation.objects.filter(
            models.Q(locataire__utilisateur=user) |
            models.Q(proprietaire__utilisateur=user)
        )

    def create(self, request):
        user = request.user

        # Vérifier si locataire
        if hasattr(user, 'profil_locataire'):
            locataire = user.profil_locataire
            proprietaire_id = request.data.get('owner_id')

        # Vérifier si propriétaire
        elif hasattr(user, 'profil_proprietaire'):
            proprietaire = user.profil_proprietaire
            locataire_id = request.data.get('locataire_id')

            from locataires.models import Locataire
            locataire = Locataire.objects.get(id=locataire_id)
            proprietaire_id = proprietaire.id

        else:
            return Response({'error': 'Profil non trouvé'}, status=400)

        conversation = Conversation.objects.create(
            locataire=locataire,
            proprietaire_id=proprietaire_id,
            bien_id=request.data.get('property_id')
        )

        return Response(ConversationSerializer(conversation).data)

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()

        message = Message.objects.create(
            conversation=conversation,
            expediteur=request.user,
            texte=request.data.get('text')
        )

        return Response(MessageSerializer(message).data)


    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conversation = self.get_object()

        conversation.messages.filter(lu=False).update(lu=True)

        return Response({'message': 'Messages lus'})


