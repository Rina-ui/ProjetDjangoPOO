from django.db import models
from django.contrib.auth.models import User


# ================================
# 🔹 MODELE CATEGORIE
# ================================
class Categorie(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'


# ================================
# 🔹 MODELE TYPE BIEN
# ================================
class TypeBien(models.Model):
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.CASCADE,
        related_name='types',
    )
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.categorie.nom})"

    class Meta:
        verbose_name = 'Type de bien'
        verbose_name_plural = 'Types de bien'
        unique_together = ['categorie', 'nom']


# ================================
# 🔹 MODELE BIEN
# ================================
class Bien(models.Model):

    STATUT_CHOICES = [
        ('LOUE', 'Loué'),
        ('VACANT', 'Vacant'),
        ('EN_TRAVAUX', 'En travaux'),
        ('EN_VENTE', 'En vente'),
    ]

    proprietaire = models.ForeignKey(
        'utilisateurs.Proprietaire',
        on_delete=models.CASCADE,
        related_name='biens',
    )

    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT,
        related_name='biens',
    )

    type_bien = models.ForeignKey(
        TypeBien,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='biens',
    )

    adresse = models.TextField()
    description = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)
    equipements = models.JSONField(default=list, blank=True)

    loyer_hc = models.DecimalField(max_digits=12, decimal_places=2)
    charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='VACANT')
    en_ligne = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    # 🔹 Méthodes métier
    def calculer_loyer_total(self):
        return self.loyer_hc + self.charges

    def mettre_en_ligne(self):
        self.en_ligne = True
        self.save()

    def changer_statut(self, nouveau_statut):
        self.statut = nouveau_statut
        self.save()

    def __str__(self):
        return f"{self.adresse} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Bien'
        verbose_name_plural = 'Biens'


# ================================
# 🔹 MODELE AUDIT LOG
# ================================
class AuditLog(models.Model):

    ACTION_CHOICES = [
        ('CREATION', 'Création'),
        ('MODIFICATION', 'Modification'),
        ('SUPPRESSION', 'Suppression'),
        ('CHANGEMENT_STATUT', 'Changement de statut'),
        ('MISE_EN_LIGNE', 'Mise en ligne'),
    ]

    utilisateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    modele = models.CharField(max_length=100)
    objet_id = models.IntegerField(null=True, blank=True)

    ancienne_valeur = models.TextField(blank=True)
    nouvelle_valeur = models.TextField(blank=True)

    date_action = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} - {self.modele} (ID: {self.objet_id})"