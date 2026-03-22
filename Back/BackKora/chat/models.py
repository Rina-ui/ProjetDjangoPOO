from django.db import models

from django.db import models

class Conversation(models.Model):
    locataire = models.ForeignKey(
        'locataires.Locataire',
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    proprietaire = models.ForeignKey(
        'utilisateurs.Proprietaire',
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    bien = models.ForeignKey(
        'patrimoine.Bien',
        on_delete=models.CASCADE
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conv {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    expediteur = models.ForeignKey(
        'utilisateurs.Utilisateur',
        on_delete=models.CASCADE
    )
    texte = models.TextField()
    lu = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.expediteur} - {self.texte[:20]}"