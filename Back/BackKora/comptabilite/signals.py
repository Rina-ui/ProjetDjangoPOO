from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Paiement


@receiver(post_save, sender=Paiement)
def creer_quittance_auto(sender, instance, **kwargs):
    if instance.statut == 'VALIDE':
        from notifications.models import Quittance
        Quittance.objects.get_or_create(paiement=instance)
