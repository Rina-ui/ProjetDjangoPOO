from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.core.exceptions import ValidationError

from utilisateurs.models import Utilisateur, Proprietaire
from patrimoine.models import Categorie, Bien
from .models import Locataire, Bail


def creer_bien(proprietaire):
    """Helper : crée un Bien lié à un propriétaire."""
    cat = Categorie.objects.create(nom='Résidentiel')
    return Bien.objects.create(
        proprietaire=proprietaire,
        categorie=cat,
        adresse='123 rue Test',
        loyer_hc=Decimal('500.00'),
    )


def creer_locataire(username='loc1'):
    """Helper : crée un Utilisateur LOCATAIRE + Locataire."""
    user = Utilisateur.objects.create_user(
        username=username, password='pass', role='LOCATAIRE'
    )
    return Locataire.objects.create(
        utilisateur=user, nom='Nom', prenom='Prenom',
        email='loc@test.com', telephone='0000',
    )


def creer_proprio():
    """Helper : crée un Utilisateur PROPRIETAIRE et retourne son profil."""
    user = Utilisateur.objects.create_user(
        username='proprio', password='pass', role='PROPRIETAIRE',
        first_name='P', last_name='O', email='p@t.com',
    )
    return user.profil_proprietaire


class LocataireModelTest(TestCase):
    """Tests pour le modèle Locataire."""

    def setUp(self):
        self.proprio = creer_proprio()
        self.bien = creer_bien(self.proprio)
        self.locataire = creer_locataire()

    def test_str(self):
        self.assertEqual(str(self.locataire), 'Prenom Nom')

    def test_payer_loyer(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        paiement = self.locataire.payer_loyer(bail, Decimal('500.00'))
        self.assertEqual(paiement.montant, Decimal('500.00'))
        self.assertEqual(paiement.statut, 'EN_ATTENTE')

    def test_consulter_historique(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        self.locataire.payer_loyer(bail, Decimal('500.00'))
        self.locataire.payer_loyer(bail, Decimal('300.00'))
        historique = self.locataire.consulter_historique()
        self.assertEqual(historique.count(), 2)


class BailModelTest(TestCase):
    """Tests pour le modèle Bail."""

    def setUp(self):
        self.proprio = creer_proprio()
        self.bien = creer_bien(self.proprio)
        self.locataire = creer_locataire()

    def test_creation_bail(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        self.assertTrue(bail.actif)
        self.assertIn('Bail', str(bail))

    def test_date_sortie_avant_entree_invalide(self):
        with self.assertRaises(ValidationError):
            Bail.objects.create(
                bien=self.bien, locataire=self.locataire,
                date_entree=date(2025, 6, 1),
                date_sortie=date(2025, 1, 1),
                loyer_initial=Decimal('500.00'),
            )

    def test_bail_actif_unique_par_bien(self):
        Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        loc2 = creer_locataire(username='loc2')
        with self.assertRaises(ValidationError):
            Bail.objects.create(
                bien=self.bien, locataire=loc2,
                date_entree=date.today(), loyer_initial=Decimal('600.00'),
            )

    def test_resilier(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        bail.resilier()
        bail.refresh_from_db()
        self.assertFalse(bail.actif)
        self.assertIsNotNone(bail.date_sortie)

    def test_reviser_loyer(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(),
            loyer_initial=Decimal('1000.00'),
            taux_revision=Decimal('10.00'),
        )
        nouveau = bail.reviser_loyer()
        self.assertEqual(nouveau, Decimal('1100.00'))

    def test_est_expire_true(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today() - timedelta(days=365),
            date_sortie=date.today() - timedelta(days=1),
            loyer_initial=Decimal('500.00'),
            actif=False,
        )
        self.assertTrue(bail.est_expire())

    def test_est_expire_false(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(),
            date_sortie=date.today() + timedelta(days=365),
            loyer_initial=Decimal('500.00'),
        )
        self.assertFalse(bail.est_expire())

    def test_est_expire_sans_date_sortie(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        self.assertFalse(bail.est_expire())


class BailSignalTest(TestCase):
    """Tests pour le signal de mise à jour du statut du bien."""

    def setUp(self):
        self.proprio = creer_proprio()
        self.bien = creer_bien(self.proprio)
        self.locataire = creer_locataire()

    def test_bien_loue_apres_bail(self):
        Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        self.bien.refresh_from_db()
        self.assertEqual(self.bien.statut, 'LOUE')

    def test_bien_vacant_apres_resiliation(self):
        bail = Bail.objects.create(
            bien=self.bien, locataire=self.locataire,
            date_entree=date.today(), loyer_initial=Decimal('500.00'),
        )
        bail.resilier()
        self.bien.refresh_from_db()
        self.assertEqual(self.bien.statut, 'VACANT')
