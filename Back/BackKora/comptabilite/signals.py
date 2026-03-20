from django.core.exceptions import ObjectDoesNotExist
from django.db.models.signals import post_save
from django.dispatch import receiver

from comptabilite.models import Paiement
from notifications.models import Quittance


@receiver(post_save, sender=Paiement)
def envoyer_quittance_apres_paiement(sender, instance, **kwargs):
    # On ne fait rien si le paiement n'est pas validé
    if instance.statut != 'VALIDE':
        return

    # Vérifie si une quittance existe déjà
    try:
        instance.quittance
        return  # existe déjà
    except ObjectDoesNotExist:
        pass

    # Crée la quittance
    quittance = Quittance.objects.create(paiement=instance)

    # Génère le PDF
    try:
        quittance.generer_pdf()
    except Exception as e:
        print("❌ Erreur génération PDF :", e)
        return

    # Envoie email
    try:
        locataire_email = instance.bail.locataire.email
        if locataire_email:  # si l'email existe
            quittance.envoyer_par_email()
            print(f"✅ Quittance envoyée à {locataire_email}")
        else:
            print("⚠️ Locataire n'a pas d'email")
    except Exception as e:
        print("❌ Erreur envoi email :", e)