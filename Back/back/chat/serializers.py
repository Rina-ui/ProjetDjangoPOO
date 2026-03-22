from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'text', 'read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username


class ConversationSerializer(serializers.ModelSerializer):
    messages        = MessageSerializer(many=True, read_only=True)
    last_message    = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    unread_count    = serializers.SerializerMethodField()
    property_name   = serializers.CharField(source='bien.adresse', read_only=True)
    client_name     = serializers.SerializerMethodField()
    owner_name      = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'bien', 'property_name',
            'client', 'client_name',
            'proprietaire', 'owner_name',
            'messages', 'last_message',
            'last_message_at', 'unread_count',
            'created_at'
        ]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.text if msg else ''

    def get_last_message_at(self, obj):
        msg = obj.messages.last()
        return msg.created_at.isoformat() if msg else obj.created_at.isoformat()

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(read=False).exclude(sender=user).count()

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}".strip() or obj.client.username

    def get_owner_name(self, obj):
        return f"{obj.proprietaire.first_name} {obj.proprietaire.last_name}".strip() or obj.proprietaire.username