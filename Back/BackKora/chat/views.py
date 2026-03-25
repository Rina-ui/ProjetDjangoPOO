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
        from rest_framework import status

        user = request.user
        proprietaire_id = request.data.get('owner_id') or request.data.get('proprietaire_id')
        locataire_id = request.data.get('locataire_id')
        bien_id = request.data.get('property_id') or request.data.get('bien_id')

        # Si connecté propriétaire, on complète automatiquement propriétaire_id depuis son profil.
        if user.is_authenticated and hasattr(user, 'profil_proprietaire'):
            proprietaire_id = user.profil_proprietaire.id

        # Si connecté locataire, on complète automatiquement locataire_id depuis son profil.
        if user.is_authenticated and hasattr(user, 'profil_locataire'):
            locataire_id = user.profil_locataire.id

        # Valider les champs requis
        if not proprietaire_id:
            return Response(
                {'error': 'owner_id (proprietaire_id) requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not locataire_id:
            return Response(
                {'error': 'locataire_id requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not bien_id:
            return Response(
                {'error': 'property_id (bien_id) requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier que les IDs existent
        from locataires.models import Locataire
        from utilisateurs.models import Proprietaire
        from patrimoine.models import Bien

        if not Locataire.objects.filter(id=locataire_id).exists():
            return Response(
                {'error': 'locataire_id inexistant'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not Proprietaire.objects.filter(id=proprietaire_id).exists():
            return Response(
                {'error': 'owner_id (proprietaire_id) inexistant'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not Bien.objects.filter(id=bien_id).exists():
            return Response(
                {'error': 'property_id (bien_id) inexistant'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation = Conversation.objects.create(
            locataire_id=locataire_id,
            proprietaire_id=proprietaire_id,
            bien_id=bien_id,
        )

        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        conversation_id = request.data.get('conversation_id') or pk
        conversation = Conversation.objects.filter(id=conversation_id).first()

        if not conversation:
            return Response({'detail': 'Conversation introuvable.'}, status=404)

        if request.method.lower() == 'get':
            messages = conversation.messages.all().order_by('date_envoi')
            return Response(MessageSerializer(messages, many=True).data)

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


