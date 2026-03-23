import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.conv_id   = self.scope['url_route']['kwargs']['conversation_id']
        self.room_name = f"chat_{self.conv_id}"
        user = self.scope.get('user')

        if not user or isinstance(user, AnonymousUser):
            await self.close()
            return

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        room_name = getattr(self, 'room_name', None)
        if room_name:
            await self.channel_layer.group_discard(room_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        user = self.scope['user']

        if data.get('type') == 'message':
            text = data.get('text', '').strip()
            if not text:
                return

            msg, conv = await self.save_message(self.conv_id, user, text)

            # Pousser dans le groupe de la conversation
            await self.channel_layer.group_send(self.room_name, {
                'type':            'chat_message',
                'conversation_id': int(self.conv_id),
                'message':         msg,
            })

            # Pousser une notification au destinataire
            recipient_id = await self.get_recipient_id(conv, user)
            if recipient_id:
                await self.channel_layer.group_send(
                    f"notifs_{recipient_id}",
                    {
                        'type': 'notification',
                        'data': {
                            'type':            'new_message',
                            'conversation_id': int(self.conv_id),
                            'message':         msg,
                        }
                    }
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type':            'new_message',
            'conversation_id': event['conversation_id'],
            'message':         event['message'],
        }))

    @database_sync_to_async
    def save_message(self, conv_id, user, text):
        from .models import Conversation, Message
        conv = Conversation.objects.get(id=conv_id)
        msg  = Message.objects.create(conversation=conv, sender=user, text=text)
        return {
            'id':          msg.id,
            'sender_id':   user.id,
            'sender_name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'text':        msg.text,
            'created_at':  msg.created_at.isoformat(),
            'read':        False,
        }, conv

    @database_sync_to_async
    def get_recipient_id(self, conv, sender):
        if conv.client == sender:
            return conv.proprietaire.id
        return conv.client.id


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser):
            await self.close()
            return

        self.room_name = f"notifs_{user.id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        room_name = getattr(self, 'room_name', None)
        if room_name:
            await self.channel_layer.group_discard(room_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def notification(self, event):
        await self.send(text_data=json.dumps(event['data']))