from django.core.mail import EmailMessage
from django.db import models
from django.utils import timezone
from reportlab.pdfgen import canvas
from rest_framework.decorators import action
from rest_framework.response import Response


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
        file_name = f"quittance_{self.pk}.pdf"
        file_path = f"media/quittances/{file_name}"

        c = canvas.Canvas(file_path)
        c.drawString(100, 800, f"Quittance #{self.pk}")
        c.drawString(100, 780, f"Montant: {self.paiement.montant}")
        c.drawString(100, 760, f"Date: {self.paiement.date_paiement}")
        c.save()

        self.fichier_pdf = f"quittances/{file_name}"
        self.save()

    def envoyer_par_email(self):
        if not self.fichier_pdf:
            raise ValueError("PDF non généré")

        locataire = self.paiement.bail.locataire

        if not locataire.email:
            raise ValueError("Email du locataire manquant")

        email = EmailMessage(
            subject='Quittance de loyer',
            body='Veuillez trouver votre quittance en pièce jointe.',
            to=[locataire.email]
        )

        email.attach_file(self.fichier_pdf.path)
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

    @action(detail=True, methods=['post'])
    def traiter(self, request, pk=None):
        demande = self.get_object()

        if demande.statut != 'EN_ATTENTE':
            return Response({'error': 'Déjà traitée'}, status=400)

        reponse = request.data.get('reponse')
        if not reponse:
            return Response({'error': 'Réponse obligatoire'}, status=400)

        demande.traiter(reponse)

        return Response({'message': 'Demande traitée'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        demande = self.get_object()

        if demande.statut != 'EN_ATTENTE':
            return Response({'error': 'Déjà traitée'}, status=400)

        raison = request.data.get('raison')
        if not raison:
            return Response({'error': 'Raison obligatoire'}, status=400)

        demande.rejeter(raison)

        return Response({'message': 'Demande rejetée'})

    def __str__(self):
        return f"{self.sujet} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Demande de contact'
        verbose_name_plural = 'Demandes de contact'
        ordering = ['-date_creation']
