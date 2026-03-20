from django.db import models
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
