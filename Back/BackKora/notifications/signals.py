# signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from comptabilite.models import Paiement
from .models import Quittance


@receiver(post_save, sender=Paiement)
def creer_quittance(sender, instance, created, **kwargs):
    if created:
        Quittance.objects.get_or_create(paiement=instance)