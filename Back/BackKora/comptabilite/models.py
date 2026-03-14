from django.db import models


class Paiement(models.Model):
    """Paiement d'un loyer lié à un bail."""

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REFUSE', 'Refusé'),
        ('ANNULE', 'Annulé'),
    ]

    METHODE_CHOICES = [
        ('ESPECES', 'Espèces'),
        ('VIREMENT', 'Virement'),
        ('FEDAPAY', 'FedaPay'),
        ('CHEQUE', 'Chèque'),
    ]

    bail = models.ForeignKey(
        'locataires.Bail',
        on_delete=models.CASCADE,
        related_name='paiements',
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date_paiement = models.DateField()
    methode = models.CharField(
        max_length=20, choices=METHODE_CHOICES, default='ESPECES'
    )
    reference_fedapay = models.CharField(max_length=255, blank=True)
    statut = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def valider(self):
        """Valide le paiement."""
        self.statut = 'VALIDE'
        self.save()

    def annuler(self):
        """Annule le paiement."""
        self.statut = 'ANNULE'
        self.save()

    def __str__(self):
        return f"Paiement {self.montant} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']


class Depense(models.Model):
    """Dépense liée à un bien immobilier."""

    TYPE_CHOICES = [
        ('TRAVAUX', 'Travaux'),
        ('TAXES', 'Taxes'),
        ('FRAIS_AGENCE', "Frais d'agence"),
        ('COPROPRIETE', 'Copropriété'),
        ('AUTRE', 'Autre'),
    ]

    bien = models.ForeignKey(
        'patrimoine.Bien',
        on_delete=models.CASCADE,
        related_name='depenses',
    )
    type_depense = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='AUTRE'
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date_depense = models.DateField()
    description = models.TextField(blank=True)
    facture = models.FileField(
        upload_to='factures/', null=True, blank=True
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_depense_display()} - {self.montant}"

    class Meta:
        verbose_name = 'Dépense'
        verbose_name_plural = 'Dépenses'
        ordering = ['-date_depense']
