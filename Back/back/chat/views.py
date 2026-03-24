from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


def push_message_to_channels(conv, msg, sender):
    """Pousse le message dans le groupe chat ET dans les notifs du destinataire."""
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()

        msg_payload = {
            'id':          msg.id,
            'sender_id':   sender.id,
            'sender_name': f"{sender.first_name} {sender.last_name}".strip() or sender.username,
            'text':        msg.text,
            'created_at':  msg.created_at.isoformat(),
            'read':        False,
        }

        # 1. Pousser dans le groupe de la conversation
        async_to_sync(channel_layer.group_send)(
            f"chat_{conv.id}",
            {
                'type':            'chat_message',
                'conversation_id': conv.id,
                'message':         msg_payload,
            }
        )

        # 2. Pousser une notification au destinataire
        recipient = conv.proprietaire if sender == conv.client else conv.client
        async_to_sync(channel_layer.group_send)(
            f"notifs_{recipient.id}",
            {
                'type': 'notification',
                'data': {
                    'type':            'new_message',
                    'conversation_id': conv.id,
                    'message':         msg_payload,
                }
            }
        )

    except Exception as e:
        print(f"[WS push error] {e}")


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class   = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(client=user) | Q(proprietaire=user)
        ).prefetch_related('messages')

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        bien_id    = request.data.get('bien_id') or request.data.get('property_id')
        proprio_id = request.data.get('proprietaire_id') or request.data.get('owner_id')

        # ── Résoudre le vrai Utilisateur depuis le profil Proprietaire ──
        # Le front envoie l'id du profil Proprietaire (lié au Bien)
        # Il faut récupérer l'Utilisateur associé à ce profil
        try:
            from utilisateurs.models import Proprietaire
            profil = Proprietaire.objects.get(id=proprio_id)
            proprio_user = profil.utilisateur
        except Exception:
            # Fallback : si proprio_id est déjà un Utilisateur id
            from utilisateurs.models import Utilisateur
            try:
                proprio_user = Utilisateur.objects.get(id=proprio_id)
            except Exception:
                return Response({'error': 'Propriétaire introuvable'}, status=400)

        # Vérifier si une conversation existe déjà
        existing = Conversation.objects.filter(
            bien_id=bien_id, client=request.user
        ).first()
        if existing:
            return Response(ConversationSerializer(existing, context={'request': request}).data)

        conv = Conversation.objects.create(
            bien_id=bien_id,
            client=request.user,
            proprietaire=proprio_user,
        )
        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        conv = self.get_object()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Message vide'}, status=400)

        msg = Message.objects.create(
            conversation=conv,
            sender=request.user,
            text=text
        )

        push_message_to_channels(conv, msg, request.user)

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conv = self.get_object()
        conv.messages.filter(read=False).exclude(sender=request.user).update(read=True)
        return Response({'success': True})