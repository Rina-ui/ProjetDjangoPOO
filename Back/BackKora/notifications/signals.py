# notifications/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import DemandeContact
from .emails import envoyer_email


@receiver(post_save, sender=DemandeContact)
def notify_new_demande(sender, instance, created, **kwargs):
    if created:
        envoyer_email(
            sujet="Nouvelle demande reçue",
            message=instance.message,
            destinataire=instance.proprietaire.user.email
        )