# notifications/services.py

from django.core.exceptions import ValidationError
from .models import Quittance, DemandeContact
from .emails import envoyer_email


# ==========================================
# 🔹 QUITTANCE WORKFLOW
# ==========================================
def traiter_quittance(quittance, user=None):
    """
    Workflow propre basé sur le modèle.
    """

    if quittance.envoyee:
        raise ValidationError("Quittance déjà envoyée.")

    # Génération PDF via modèle
    quittance.generer_pdf()

    quittance.save()

    # Envoi email via modèle
    quittance.envoyer_par_email()

    quittance.envoyee = True
    quittance.save()

    return quittance


# ==========================================
# 🔹 DEMANDE CONTACT WORKFLOW
# ==========================================
def traiter_demande(demande, reponse):
    if demande.statut != "EN_ATTENTE":
        raise ValidationError("Demande déjà traitée.")

    demande.traiter(reponse)

    envoyer_email(
        sujet="Réponse à votre demande",
        message=demande.reponse_admin,
        destinataire=demande.proprietaire.user.email
    )

    return demande


def rejeter_demande(demande, raison):
    demande.rejeter(raison)

    envoyer_email(
        sujet="Demande rejetée",
        message=raison,
        destinataire=demande.proprietaire.user.email
    )

    return demande