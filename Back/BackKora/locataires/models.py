from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Locataire(models.Model):
    """Profil locataire lié à un utilisateur."""

    utilisateur = models.OneToOneField(
        'utilisateurs.Utilisateur',
        on_delete=models.CASCADE,
        related_name='profil_locataire',
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField()
    telephone = models.CharField(max_length=20)
    date_naissance = models.DateField(null=True, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    piece_identite = models.FileField(
        upload_to='pieces_identite/', null=True, blank=True
    )
    garant_nom = models.CharField(max_length=100, blank=True)
    garant_prenom = models.CharField(max_length=100, blank=True)
    garant_telephone = models.CharField(max_length=20, blank=True)
    actif = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    class Meta:
        verbose_name = 'Locataire'
        verbose_name_plural = 'Locataires'


class Bail(models.Model):
    """Contrat de bail entre un locataire et un bien."""

    bien = models.ForeignKey(
        'patrimoine.Bien',
        on_delete=models.CASCADE,
        related_name='baux',
    )
    locataire = models.ForeignKey(
        Locataire,
        on_delete=models.CASCADE,
        related_name='baux',
    )
    date_entree = models.DateField()
    date_sortie = models.DateField(null=True, blank=True)
    loyer_initial = models.DecimalField(max_digits=12, decimal_places=2)
    depot_garantie = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    taux_revision = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def resilier(self):
        """Résilie le bail."""
        self.actif = False
        self.date_sortie = timezone.now().date()
        self.save()

    def reviser_loyer(self):
        """Applique la révision du loyer selon le taux défini."""
        from decimal import Decimal
        revision = self.loyer_initial * (self.taux_revision / Decimal('100'))
        self.loyer_initial += revision
        self.save()
        return self.loyer_initial

    def est_expire(self):
        """Vérifie si le bail est expiré."""
        if self.date_sortie:
            return timezone.now().date() > self.date_sortie
        return False

    def __str__(self):
        return f"Bail {self.locataire} - {self.bien}"

    class Meta:
        verbose_name = 'Bail'
        verbose_name_plural = 'Baux'
        ordering = ['-date_entree']


class Reservation(models.Model):
    STATUT_EN_ATTENTE = 'EN_ATTENTE'
    STATUT_CONFIRMEE = 'CONFIRMEE'
    STATUT_ANNULEE = 'ANNULEE'
    STATUT_TERMINEE = 'TERMINEE'

    STATUT_CHOICES = [
        (STATUT_EN_ATTENTE, 'En attente'),
        (STATUT_CONFIRMEE, 'Confirmee'),
        (STATUT_ANNULEE, 'Annulee'),
        (STATUT_TERMINEE, 'Terminee'),
    ]

    bien = models.ForeignKey(
        'patrimoine.Bien',
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    locataire = models.ForeignKey(
        Locataire,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    message = models.TextField(blank=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_EN_ATTENTE,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.date_fin < self.date_debut:
            raise ValidationError({'date_fin': 'La date de fin doit etre superieure ou egale a la date de debut.'})

        if self.bien and self.bien.statut == 'LOUE':
            raise ValidationError({'bien': 'Ce bien est deja loue et ne peut pas etre reserve.'})

        conflits = Reservation.objects.filter(
            bien=self.bien,
            statut__in=[self.STATUT_EN_ATTENTE, self.STATUT_CONFIRMEE],
            date_debut__lte=self.date_fin,
            date_fin__gte=self.date_debut,
        )
        if self.pk:
            conflits = conflits.exclude(pk=self.pk)

        if conflits.exists():
            raise ValidationError({'non_field_errors': 'Une reservation existe deja sur cette periode pour ce bien.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reservation #{self.pk} - {self.bien} - {self.locataire}"

    class Meta:
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'
        ordering = ['-date_creation']

