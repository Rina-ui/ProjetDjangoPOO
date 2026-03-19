from django.contrib.auth.models import AbstractUser
from django.contrib.auth import authenticate, login, logout
from django.db import models


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

    def se_connecter(self, request, password):
        utilisateur = authenticate(request, username=self.username, password=password)
        if utilisateur is not None:
            login(request, utilisateur)
            return True
        return False

    def se_deconnecter(self, request):
        logout(request)

    def modifier_profil(self, **kwargs):
        for champ, valeur in kwargs.items():
            if hasattr(self, champ) and champ not in ('id', 'password', 'role'):
                setattr(self, champ, valeur)
        self.save()

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

    def consulter_stats(self):
        from django.db.models import Sum, Count
        from comptabilite.models import Paiement, Depense
        biens = self.biens.all()
        return {
            'nombre_biens': biens.count(),
            'biens_loues': biens.filter(statut='LOUE').count(),
            'biens_vacants': biens.filter(statut='VACANT').count(),
            'total_revenus': Paiement.objects.filter(
                bail__bien__in=biens, statut='VALIDE'
            ).aggregate(total=Sum('montant'))['total'] or 0,
            'total_depenses': Depense.objects.filter(
                bien__in=biens
            ).aggregate(total=Sum('montant'))['total'] or 0,
        }

    def demander_mise_en_ligne(self, bien, sujet, message):
        from notifications.models import DemandeContact
        return DemandeContact.objects.create(
            proprietaire=self,
            sujet=sujet,
            message=message,
            type_demande='MISE_EN_LIGNE',
        )

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
