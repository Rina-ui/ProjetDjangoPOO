from django.db import models
from django.conf import settings


class Conversation(models.Model):
    bien         = models.ForeignKey('patrimoine.Bien', on_delete=models.CASCADE, related_name='conversations', null=True, blank=True)
    client       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations_client')
    proprietaire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations_proprio')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['bien', 'client']

    def __str__(self):
        return f"{self.client} ↔ {self.proprietaire} — {self.bien}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text         = models.TextField()
    read         = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender}: {self.text[:50]}"