from django.db import models

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from utilisateurs.models import Utilisateur

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    queryset = Conversation.objects.all()

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Conversation.objects.all()

        return Conversation.objects.filter(
            models.Q(locataire__utilisateur=user) |
            models.Q(proprietaire__utilisateur=user)
        )

    def create(self, request, *args, **kwargs):
        user = request.user
        proprietaire_id = request.data.get('owner_id') or request.data.get('proprietaire_id')
        locataire_id = request.data.get('locataire_id')
        bien_id = request.data.get('property_id') or request.data.get('bien_id')

        # Si connecté, on complète automatiquement l'ID manquant depuis son profil.
        if user.is_authenticated and hasattr(user, 'profil_locataire'):
            locataire = user.profil_locataire
            locataire_id = locataire.id

        elif user.is_authenticated and hasattr(user, 'profil_proprietaire'):
            proprietaire = user.profil_proprietaire
            proprietaire_id = proprietaire.id

        if not (proprietaire_id and locataire_id and bien_id):
            return Response(
                {
                    'error': (
                        'Champs requis: locataire_id, owner_id/proprietaire_id '
                        'et property_id/bien_id.'
                    )
                },
                status=400,
            )

        conversation = Conversation.objects.create(
            locataire_id=locataire_id,
            proprietaire_id=proprietaire_id,
            bien_id=bien_id,
        )

        return Response(ConversationSerializer(conversation).data)

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        texte = request.data.get('text')
        expediteur_id = request.user.id if request.user.is_authenticated else request.data.get('expediteur_id')

        if not texte:
            return Response({'error': 'Champ text requis'}, status=400)

        if not expediteur_id:
            return Response({'error': 'Champ expediteur_id requis'}, status=400)

        if not Utilisateur.objects.filter(id=expediteur_id).exists():
            return Response({'error': 'expediteur_id invalide'}, status=400)

        message = Message.objects.create(
            conversation=conversation,
            expediteur_id=expediteur_id,
            texte=texte,
        )

        return Response(MessageSerializer(message).data)


    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conversation = self.get_object()

        conversation.messages.filter(lu=False).update(lu=True)

        return Response({'message': 'Messages lus'})


