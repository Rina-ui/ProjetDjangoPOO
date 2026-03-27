from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class Utilisateur(AbstractUser):
    """Modèle utilisateur personnalisé avec rôles."""

    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('PROPRIETAIRE', 'Propriétaire'),
        ('LOCATAIRE', 'Locataire'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='LOCATAIRE',
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    totp_secret = models.CharField(max_length=255, blank=True, default='')
    totp_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list, blank=True)
    totp_last_verified_at = models.DateTimeField(null=True, blank=True)
    totp_last_used_step = models.BigIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'


class Proprietaire(models.Model):
    """Profil propriétaire lié à un utilisateur."""

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_proprietaire',
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField()
    telephone = models.CharField(max_length=20)
    adresse = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    class Meta:
        verbose_name = 'Propriétaire'
        verbose_name_plural = 'Propriétaires'


class AuditLog(models.Model):
    """Journal d'audit des actions effectuées dans le système."""

    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=50)
    modele = models.CharField(max_length=100)
    objet_id = models.IntegerField(null=True, blank=True)
    ancien_valeur = models.TextField(blank=True)
    nouvelle_valeur = models.TextField(blank=True)
    date_action = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.modele} (#{self.objet_id})"

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-date_action']


class TwoFactorChallenge(models.Model):
    """Challenge de connexion 2FA temporaire (phase 1 login)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='two_factor_challenges',
    )
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"2FA challenge {self.id} for {self.utilisateur_id}"

    class Meta:
        ordering = ['-created_at']

