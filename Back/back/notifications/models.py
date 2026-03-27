import os

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import models
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


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

    # models.py

    def generer_pdf(self):
        """Génère un PDF stylé pour la quittance."""
        nom_fichier = f"quittance_{self.pk}.pdf"
        chemin = os.path.join(settings.MEDIA_ROOT, "quittances")
        os.makedirs(chemin, exist_ok=True)
        chemin_complet = os.path.join(chemin, nom_fichier)

        c = canvas.Canvas(chemin_complet, pagesize=A4)
        largeur, hauteur = A4

        # Header
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(largeur / 2, hauteur - 50, "QUITTANCE DE LOYER")

        # Logo si tu veux
        # c.drawImage("chemin/logo.png", x, y, width, height)

        c.setFont("Helvetica", 12)
        y = hauteur - 100

        c.drawString(50, y, f"Numéro de quittance : {self.pk}")
        y -= 20
        c.drawString(50, y, f"Date : {self.date_generation.strftime('%d/%m/%Y')}")
        y -= 20
        c.drawString(50, y, f"Locataire : {self.paiement.bail.locataire.prenom} {self.paiement.bail.locataire.nom}")
        y -= 20
        c.drawString(50, y, f"Bien : {self.paiement.bail.bien.adresse}")
        y -= 20
        c.drawString(50, y, f"Montant payé : {self.paiement.montant} FCFA")
        y -= 20
        c.drawString(50, y, f"Méthode : {self.paiement.methode}")

        # Footer
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(50, 50, "Merci pour votre paiement !")

        c.save()

        # Enregistre le chemin dans le modèle
        self.fichier_pdf.name = f"quittances/{nom_fichier}"
        self.save()

    def envoyer_par_email(self):
        if not self.fichier_pdf:
            raise ValueError("PDF non généré. Appelez generer_pdf() d'abord.")

        chemin_pdf = self.fichier_pdf.path
        if not os.path.isfile(chemin_pdf):
            raise FileNotFoundError(f"Le fichier PDF n'existe pas : {chemin_pdf}")

        locataire = self.paiement.bail.locataire

        if not locataire.email:
            raise ValueError("Email du locataire manquant")

        email = EmailMessage(
            subject="Votre quittance de loyer",
            body="Bonjour,\n\nVeuillez trouver ci-joint votre quittance de loyer.\n\nCordialement,\nL'équipe KÔRÂ",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[locataire.email],
        )

        email.attach_file(chemin_pdf)
        email.send()

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
        """Marque la demande comme traitée avec la réponse admin."""
        self.reponse_admin = reponse
        self.statut = 'TRAITEE'
        self.date_traitement = timezone.now()
        self.save()

    def rejeter(self, raison):
        """Rejette la demande avec une raison."""
        self.reponse_admin = raison
        self.statut = 'REJETEE'
        self.date_traitement = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.sujet} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Demande de contact'
        verbose_name_plural = 'Demandes de contact'
        ordering = ['-date_creation']
