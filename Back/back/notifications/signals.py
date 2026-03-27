# notifications/signals.py

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from comptabilite.models import Paiement
from .models import DemandeContact, Quittance
from .emails import envoyer_email

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Paiement)
def creer_et_envoyer_quittance(sender, instance, created, **kwargs):
    """
    Flux automatique complet lors d'un nouveau paiement :
    1. Crée la quittance
    2. Génère le PDF
    3. Envoie par email au locataire
    """
    if not created:
        return

    quittance, _ = Quittance.objects.get_or_create(paiement=instance)

    try:
        quittance.generer_pdf()
        quittance.envoyer_par_email()
        quittance.envoyee = True
        quittance.save()
        logger.info("Quittance #%s envoyée au locataire %s", quittance.pk, instance.bail.locataire.email)
    except Exception as e:
        logger.error("Échec envoi quittance #%s : %s", quittance.pk, e)


@receiver(post_save, sender=DemandeContact)
def notify_new_demande(sender, instance, created, **kwargs):
    """Notifie le propriétaire quand une nouvelle demande est créée."""
    if not created:
        return

    try:
        envoyer_email(
            sujet="Nouvelle demande reçue",
            message=instance.message,
            destinataire=instance.proprietaire.user.email,
        )
    except Exception as e:
        logger.error("Échec notification demande #%s : %s", instance.pk, e)
