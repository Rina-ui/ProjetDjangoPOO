from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


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

        existing = Conversation.objects.filter(
            bien_id=bien_id, client=request.user
        ).first()
        if existing:
            return Response(ConversationSerializer(existing, context={'request': request}).data)

        conv = Conversation.objects.create(
            bien_id=bien_id,
            client=request.user,
            proprietaire_id=proprio_id,
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

        # Pousser via WebSocket
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{conv.id}",
                {
                    'type': 'chat_message',
                    'conversation_id': conv.id,
                    'message': {
                        'id':          msg.id,
                        'sender_id':   request.user.id,
                        'sender_name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                        'text':        msg.text,
                        'created_at':  msg.created_at.isoformat(),
                        'read':        False,
                    }
                }
            )
        except Exception:
            pass

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conv = self.get_object()
        conv.messages.filter(read=False).exclude(sender=request.user).update(read=True)
        return Response({'success': True})