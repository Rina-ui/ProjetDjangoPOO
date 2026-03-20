
# Import du module de base pour créer des modèles Django
from django.db import models

# Import du modèle User de Django (utilisé pour le système d'audit)
from django.contrib.auth.models import User


# ================================
# 🔹 MODELE CATEGORIE
# ================================
class Categorie(models.Model):
    """
    Catégorie de bien immobilier (ex: Résidentiel, Commercial).
    """

    # Nom unique de la catégorie
    nom = models.CharField(max_length=100, unique=True)

    # Description facultative
    description = models.TextField(blank=True)

    # Date de création automatique
    date_creation = models.DateTimeField(auto_now_add=True)

    # Représentation texte de l'objet
    def __str__(self):
        return self.nom

    # Configuration du modèle dans l’admin Django
    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'


# ================================
# 🔹 MODELE TYPE DE BIEN
# ================================
class TypeBien(models.Model):
    """
    Type de bien au sein d'une catégorie (ex: Appartement, Villa).
    """

    # Relation avec la catégorie (une catégorie peut avoir plusieurs types)
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.CASCADE,
        related_name='types',
    )

    # Nom du type (ex: Studio, Duplex)
    nom = models.CharField(max_length=100)

    # Description facultative
    description = models.TextField(blank=True)

    # Date de création
    date_creation = models.DateTimeField(auto_now_add=True)

    # Affichage texte
    def __str__(self):
        return f"{self.nom} ({self.categorie.nom})"

    class Meta:
        verbose_name = 'Type de bien'
        verbose_name_plural = 'Types de bien'

        # Empêche deux types identiques dans une même catégorie
        unique_together = ['categorie', 'nom']


# ================================
# 🔹 MODELE BIEN (COEUR DU SYSTEME)
# ================================
class Bien(models.Model):
    """
    Bien immobilier géré par un propriétaire.
    """

    # Choix des statuts possibles
    STATUT_CHOICES = [
        ('LOUE', 'Loué'),
        ('VACANT', 'Vacant'),
        ('EN_TRAVAUX', 'En travaux'),
        ('EN_VENTE', 'En vente'),
    ]

    # Relation avec le propriétaire (1 propriétaire → plusieurs biens)
    proprietaire = models.ForeignKey(
        'utilisateurs.Proprietaire',
        on_delete=models.CASCADE,
        related_name='biens',
    )

    # Catégorie du bien
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT,  # empêche suppression si utilisé
        related_name='biens',
    )

    # Type du bien (optionnel)
    type_bien = models.ForeignKey(
        TypeBien,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='biens',
    )

    # Adresse complète du bien
    adresse = models.TextField()

    # Description facultative
    description = models.TextField(blank=True)

    # Liste de photos (format JSON)
    photos = models.JSONField(default=list, blank=True)

    # Liste des équipements (JSON)
    equipements = models.JSONField(default=list, blank=True)

    # Loyer hors charges
    loyer_hc = models.DecimalField(max_digits=12, decimal_places=2)

    # Charges
    charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Coordonnées GPS
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )

    # Statut du bien
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='VACANT'
    )

    # Indique si le bien est visible en ligne
    en_ligne = models.BooleanField(default=False)

    # Dates de suivi
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    # ======================
    # 🔹 METHODES METIER
    # ======================

    def calculer_loyer_total(self):
        """Retourne le loyer total (hors charges + charges)."""
        return self.loyer_hc + self.charges

    def mettre_en_ligne(self):
        """Met le bien en ligne."""
        self.en_ligne = True
        self.save()

    def changer_statut(self, nouveau_statut):
        """Change le statut du bien."""
        self.statut = nouveau_statut
        self.save()

    # Affichage texte
    def __str__(self):
        return f"{self.adresse} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Bien'
        verbose_name_plural = 'Biens'


# ================================
# 🔹 MODELE AUDIT LOG (NOUVEAU 🔥)
# ================================
class AuditLog(models.Model):
    """
    Journal des actions effectuées dans le système (audit trail).
    Permet de tracer toutes les opérations importantes.
    """

    # Types d'actions possibles
    ACTION_CHOICES = [
        ('CREATION', 'Création'),
        ('MODIFICATION', 'Modification'),
        ('SUPPRESSION', 'Suppression'),
        ('CHANGEMENT_STATUT', 'Changement de statut'),
        ('MISE_EN_LIGNE', 'Mise en ligne'),
    ]

    # Utilisateur ayant effectué l'action
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )

    # Type d'action réalisée
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)

    # Nom du modèle concerné (ex: "Bien")
    modele = models.CharField(max_length=100)

    # ID de l'objet concerné
    objet_id = models.IntegerField(null=True, blank=True)

    # Ancienne valeur (avant modification)
    ancienne_valeur = models.TextField(blank=True)

    # Nouvelle valeur (après modification)
    nouvelle_valeur = models.TextField(blank=True)

    # Date automatique de l'action
    date_action = models.DateTimeField(auto_now_add=True)

    # Affichage texte
    def __str__(self):
        return f"{self.action} - {self.modele} (ID: {self.objet_id})"