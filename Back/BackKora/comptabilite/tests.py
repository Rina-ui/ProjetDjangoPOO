from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.core.exceptions import ValidationError

from utilisateurs.models import Utilisateur
from patrimoine.models import Categorie, Bien
from locataires.models import Locataire, Bail
from notifications.models import Quittance
from .models import Paiement, Depense
from .services import BalanceComptable


def _setup_bail():
    """Helper : crée un propriétaire + bien + locataire + bail actif."""
    user_p = Utilisateur.objects.create_user(
        username='proprio', password='pass', role='PROPRIETAIRE',
        first_name='P', last_name='O', email='p@t.com',
    )
    proprio = user_p.profil_proprietaire
    cat = Categorie.objects.create(nom='Résidentiel')
    bien = Bien.objects.create(
        proprietaire=proprio, categorie=cat,
        adresse='123 rue Test', loyer_hc=Decimal('500.00'),
    )
    user_l = Utilisateur.objects.create_user(
        username='loc', password='pass', role='LOCATAIRE',
    )
    locataire = Locataire.objects.create(
        utilisateur=user_l, nom='Nom', prenom='Prenom',
        email='l@t.com', telephone='0000',
    )
    bail = Bail.objects.create(
        bien=bien, locataire=locataire,
        date_entree=date.today() - timedelta(days=30),
        loyer_initial=Decimal('500.00'),
    )
    return proprio, bien, locataire, bail


class PaiementModelTest(TestCase):
    """Tests pour le modèle Paiement."""

    def setUp(self):
        self.proprio, self.bien, self.locataire, self.bail = _setup_bail()

    def test_creation_paiement(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        self.assertEqual(p.statut, 'EN_ATTENTE')

    def test_montant_negatif_invalide(self):
        with self.assertRaises(ValidationError):
            Paiement.objects.create(
                bail=self.bail, montant=Decimal('-100'),
                date_paiement=date.today(),
            )

    def test_montant_zero_invalide(self):
        with self.assertRaises(ValidationError):
            Paiement.objects.create(
                bail=self.bail, montant=Decimal('0'),
                date_paiement=date.today(),
            )

    def test_valider(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.valider()
        p.refresh_from_db()
        self.assertEqual(p.statut, 'VALIDE')

    def test_valider_annule_impossible(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.annuler()
        with self.assertRaises(ValidationError):
            p.valider()

    def test_annuler(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.annuler()
        p.refresh_from_db()
        self.assertEqual(p.statut, 'ANNULE')

    def test_annuler_deja_annule_impossible(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.annuler()
        with self.assertRaises(ValidationError):
            p.annuler()


class DepenseModelTest(TestCase):
    """Tests pour le modèle Depense."""

    def setUp(self):
        self.proprio, self.bien, _, _ = _setup_bail()

    def test_creation_depense(self):
        d = Depense.objects.create(
            bien=self.bien, montant=Decimal('200.00'),
            date_depense=date.today(), type_depense='TRAVAUX',
        )
        self.assertIn('Travaux', str(d))

    def test_montant_negatif_invalide(self):
        with self.assertRaises(ValidationError):
            Depense.objects.create(
                bien=self.bien, montant=Decimal('-50'),
                date_depense=date.today(),
            )

    def test_montant_zero_invalide(self):
        with self.assertRaises(ValidationError):
            Depense.objects.create(
                bien=self.bien, montant=Decimal('0'),
                date_depense=date.today(),
            )


class QuittanceSignalTest(TestCase):
    """Tests pour le signal de création automatique de quittance."""

    def setUp(self):
        self.proprio, self.bien, self.locataire, self.bail = _setup_bail()

    def test_quittance_auto_apres_validation(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.valider()
        self.assertTrue(Quittance.objects.filter(paiement=p).exists())

    def test_pas_de_quittance_en_attente(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        self.assertFalse(Quittance.objects.filter(paiement=p).exists())


class BalanceComptableTest(TestCase):
    """Tests pour le service BalanceComptable."""

    def setUp(self):
        self.proprio, self.bien, self.locataire, self.bail = _setup_bail()
        self.debut = date.today() - timedelta(days=60)
        self.fin = date.today()

    def test_calculer_revenus(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.valider()
        revenus = BalanceComptable.calculer_revenus(self.bien, self.debut, self.fin)
        self.assertEqual(revenus, Decimal('500.00'))

    def test_calculer_revenus_aucun(self):
        revenus = BalanceComptable.calculer_revenus(self.bien, self.debut, self.fin)
        self.assertEqual(revenus, Decimal('0'))

    def test_calculer_depenses(self):
        Depense.objects.create(
            bien=self.bien, montant=Decimal('200.00'),
            date_depense=date.today(), type_depense='TRAVAUX',
        )
        depenses = BalanceComptable.calculer_depenses(self.bien, self.debut, self.fin)
        self.assertEqual(depenses, Decimal('200.00'))

    def test_calculer_benefice_net(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.valider()
        Depense.objects.create(
            bien=self.bien, montant=Decimal('200.00'),
            date_depense=date.today(), type_depense='TRAVAUX',
        )
        benefice = BalanceComptable.calculer_benefice_net(self.bien, self.debut, self.fin)
        self.assertEqual(benefice, Decimal('300.00'))

    def test_exporter_donnees_fiscales(self):
        p = Paiement.objects.create(
            bail=self.bail, montant=Decimal('500.00'),
            date_paiement=date.today(),
        )
        p.valider()
        data = BalanceComptable.exporter_donnees_fiscales(self.proprio, self.debut, self.fin)
        self.assertEqual(data['total_revenus'], Decimal('500.00'))
        self.assertEqual(len(data['details']), 1)
