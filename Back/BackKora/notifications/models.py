from django.db import models
from django.utils import timezone


class Quittance(models.Model):
    """Quittance de loyer générée après un paiement."""

    paiement = models.OneToOneField(
        'comptabilite.Paiement',
        on_delete=models.CASCADE,
        related_name='quittance',
    )
    fichier_pdf = models.FileField(
        upload_to='quittances/', null=True, blank=True
    )
    date_generation = models.DateTimeField(auto_now_add=True)
    envoyee = models.BooleanField(default=False)

    def generer_pdf(self):
        """Génère le PDF de la quittance. TODO: implémenter avec ReportLab/WeasyPrint."""
        pass

    def envoyer_par_email(self):
        """Envoie la quittance par email. TODO: implémenter."""
        pass

    def __str__(self):
        return f"Quittance #{self.pk} - Paiement {self.paiement.pk}"

    class Meta:
        verbose_name = 'Quittance'
        verbose_name_plural = 'Quittances'
        ordering = ['-date_generation']


class DemandeContact(models.Model):
    """Demande de contact ou de mise en ligne envoyée par un propriétaire."""

    TYPE_CHOICES = [
        ('MISE_EN_LIGNE', 'Mise en ligne'),
        ('MODIFICATION', 'Modification'),
        ('AUTRE', 'Autre'),
    ]

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('TRAITEE', 'Traitée'),
        ('REJETEE', 'Rejetée'),
    ]

    proprietaire = models.ForeignKey(
        'utilisateurs.Proprietaire',
        on_delete=models.CASCADE,
        related_name='demandes',
    )
    sujet = models.CharField(max_length=200)
    message = models.TextField()
    type_demande = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='AUTRE'
    )
    statut = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE'
    )
    reponse_admin = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)

    def traiter(self, reponse):
        """Traite la demande avec une réponse."""
        self.statut = 'TRAITEE'
        self.reponse_admin = reponse
        self.date_traitement = timezone.now()
        self.save()

    def rejeter(self, raison):
        """Rejette la demande avec une raison."""
        self.statut = 'REJETEE'
        self.reponse_admin = raison
        self.date_traitement = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.sujet} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Demande de contact'
        verbose_name_plural = 'Demandes de contact'
        ordering = ['-date_creation']
