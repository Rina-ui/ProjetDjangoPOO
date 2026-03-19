from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Utilisateur, Proprietaire, AuditLog


@receiver(post_save, sender=Utilisateur)
def creer_profil_proprietaire(sender, instance, created, **kwargs):
    if created and instance.role == 'PROPRIETAIRE':
        Proprietaire.objects.create(
            utilisateur=instance,
            nom=instance.last_name or instance.username,
            prenom=instance.first_name or '',
            email=instance.email,
            telephone='',
        )


@receiver(post_save)
def audit_log_creation_modification(sender, instance, created, **kwargs):
    if sender in (AuditLog,) or sender._meta.app_label in (
        'admin', 'auth', 'contenttypes', 'sessions', 'migrations',
    ):
        return

    from django.contrib.contenttypes.models import ContentType
    if sender == ContentType:
        return

    try:
        action = 'CREATION' if created else 'MODIFICATION'
        AuditLog.objects.create(
            utilisateur=None,
            action=action,
            modele=sender.__name__,
            objet_id=instance.pk,
            ancien_valeur='',
            nouvelle_valeur=str(instance),
        )
    except Exception:
        pass


@receiver(post_delete)
def audit_log_suppression(sender, instance, **kwargs):
    if sender in (AuditLog,) or sender._meta.app_label in (
        'admin', 'auth', 'contenttypes', 'sessions', 'migrations',
    ):
        return

    from django.contrib.contenttypes.models import ContentType
    if sender == ContentType:
        return

    try:
        AuditLog.objects.create(
            utilisateur=None,
            action='SUPPRESSION',
            modele=sender.__name__,
            objet_id=instance.pk,
            ancien_valeur=str(instance),
            nouvelle_valeur='',
        )
    except Exception:
        pass
