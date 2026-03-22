
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import AuditLog, Bien


# ==========================================
# 🔹 FONCTION UTILITAIRE : LOG D'AUDIT
# ==========================================
def log_action(user, action, modele, objet_id=None, ancienne_valeur="", nouvelle_valeur=""):
    """
    Fonction utilitaire pour créer un log d’audit.
    """

    AuditLog.objects.create(
        utilisateur=user if user and user.is_authenticated else None,
        action=action,
        modele=modele,
        objet_id=objet_id,
        ancienne_valeur=str(ancienne_valeur),
        nouvelle_valeur=str(nouvelle_valeur)
    )


# ==========================================
# 🔹 CHANGEMENT DE STATUT D’UN BIEN
# ==========================================
@transaction.atomic
def changer_statut_bien(bien, nouveau_statut, user=None):
    """
    Change le statut d’un bien avec validation, règles métier et audit log.
    """

    STATUTS_VALIDES = [choice[0] for choice in bien.STATUT_CHOICES]

    # 🔴 Validation
    if not nouveau_statut:
        raise ValidationError("Le statut est requis.")

    if nouveau_statut not in STATUTS_VALIDES:
        raise ValidationError(f"Statut invalide : {nouveau_statut}")

    ancien_statut = bien.statut

    # 🧠 Règles métier
    if ancien_statut == "EN_VENTE" and nouveau_statut == "LOUE":
        raise ValidationError("Un bien en vente ne peut pas être loué directement.")

    if ancien_statut == nouveau_statut:
        raise ValidationError("Le bien a déjà ce statut.")

    # ✅ Mise à jour
    bien.statut = nouveau_statut
    bien.save()

    # 🔥 Audit log
    log_action(
        user=user,
        action="CHANGEMENT_STATUT",
        modele="Bien",
        objet_id=bien.id,
        ancienne_valeur=ancien_statut,
        nouvelle_valeur=nouveau_statut
    )

    return bien


# ==========================================
# 🔹 MISE EN LIGNE D’UN BIEN
# ==========================================
@transaction.atomic
def mettre_bien_en_ligne(bien, user=None):
    """
    Met un bien en ligne avec validation et audit log.
    """

    # 🔴 Vérifications
    if not bien.adresse:
        raise ValidationError("Adresse du bien manquante.")

    if not bien.loyer_hc:
        raise ValidationError("Le loyer est obligatoire.")

    if bien.statut == "EN_TRAVAUX":
        raise ValidationError("Impossible de mettre en ligne un bien en travaux.")

    if bien.en_ligne:
        raise ValidationError("Ce bien est déjà en ligne.")

    # ✅ Mise en ligne
    bien.en_ligne = True
    bien.save()

    # 🔥 Audit log
    log_action(
        user=user,
        action="MISE_EN_LIGNE",
        modele="Bien",
        objet_id=bien.id,
        nouvelle_valeur="EN_LIGNE"
    )

    return bien


# ==========================================
# 🔹 CREATION D’UN BIEN
# ==========================================
@transaction.atomic
def creer_bien(data, user=None):
    """
    Création d’un bien avec validation et audit log.
    """

    # 🔴 Validation minimale
    if not data.get("adresse"):
        raise ValidationError("L'adresse est obligatoire.")

    if not data.get("loyer_hc"):
        raise ValidationError("Le loyer est obligatoire.")

    # ✅ Création
    bien = Bien.objects.create(**data)

    # 🔥 Audit log
    log_action(
        user=user,
        action="CREATION",
        modele="Bien",
        objet_id=bien.id,
        nouvelle_valeur=str(bien)
    )

    return bien


# ==========================================
# 🔹 SUPPRESSION D’UN BIEN
# ==========================================
@transaction.atomic
def supprimer_bien(bien, user=None):
    """
    Suppression d’un bien avec audit log.
    """

    bien_id = bien.id
    ancienne_valeur = str(bien)

    # ✅ Suppression
    bien.delete()

    # 🔥 Audit log
    log_action(
        user=user,
        action="SUPPRESSION",
        modele="Bien",
        objet_id=bien_id,
        ancienne_valeur=ancienne_valeur
    )


# ==========================================
# 🔹 MODIFICATION D’UN BIEN
# ==========================================
@transaction.atomic
def modifier_bien(bien, data, user=None):
    """
    Mise à jour d’un bien avec audit log détaillé.
    """

    ancienne_valeur = str(bien)

    # 🔴 Mise à jour sécurisée (évite écrasement dangereux)
    champs_autorises = [
        'categorie',
        'type_bien',
        'adresse',
        'description',
        'photos',
        'equipements',
        'loyer_hc',
        'charges',
        'latitude',
        'longitude',
        'statut',
        'en_ligne'
    ]

    for attr, value in data.items():
        if attr in champs_autorises:
            setattr(bien, attr, value)

    bien.save()

    # 🔥 Audit log
    log_action(
        user=user,
        action="MODIFICATION",
        modele="Bien",
        objet_id=bien.id,
        ancienne_valeur=ancienne_valeur,
        nouvelle_valeur=str(bien)
    )

    return bien