from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Bail


@receiver(post_save, sender=Bail)
def mettre_a_jour_statut_bien(sender, instance, created, **kwargs):
    if created and instance.actif:
        bien = instance.bien
        bien.statut = 'LOUE'
        bien.save()

    if not instance.actif:
        bien = instance.bien
        baux_actifs = Bail.objects.filter(bien=bien, actif=True).exclude(pk=instance.pk).exists()
        if not baux_actifs:
            bien.statut = 'VACANT'
            bien.save()
