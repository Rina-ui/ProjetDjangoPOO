from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from locataires.models import Locataire, Reservation
from patrimoine.models import Bien, Categorie
from utilisateurs.models import Proprietaire


class ReservationAPITestCase(APITestCase):
    def setUp(self):
        user_model = get_user_model()

        self.locataire_user = user_model.objects.create_user(
            username='locataire1@example.com',
            password='123456',
            role='LOCATAIRE',
        )
        self.locataire = Locataire.objects.create(
            utilisateur=self.locataire_user,
            nom='A',
            prenom='Locataire',
            email='locataire1@example.com',
            telephone='22911111111',
        )

        self.autre_locataire_user = user_model.objects.create_user(
            username='locataire2@example.com',
            password='123456',
            role='LOCATAIRE',
        )
        self.autre_locataire = Locataire.objects.create(
            utilisateur=self.autre_locataire_user,
            nom='B',
            prenom='Locataire',
            email='locataire2@example.com',
            telephone='22922222222',
        )

        self.proprietaire_user = user_model.objects.create_user(
            username='proprio@example.com',
            password='123456',
            role='PROPRIETAIRE',
        )
        self.proprietaire = Proprietaire.objects.create(
            utilisateur=self.proprietaire_user,
            nom='Doe',
            prenom='Proprio',
            email='proprio@example.com',
            telephone='22933333333',
            adresse='Cotonou',
        )

        self.categorie = Categorie.objects.create(nom='Categorie Reservation Test')
        self.bien = Bien.objects.create(
            proprietaire=self.proprietaire,
            categorie=self.categorie,
            adresse='Akpakpa, Cotonou',
            description='Bien pour reservation',
            photos=[],
            equipements=[],
            loyer_hc='100000.00',
            charges='10000.00',
            statut='VACANT',
        )

        self.list_url = reverse('reservation-list')

    def test_creation_reservation_valide(self):
        self.client.force_authenticate(user=self.locataire_user)

        payload = {
            'bien': self.bien.id,
            'date_debut': '2026-03-25',
            'date_fin': '2026-03-30',
            'message': 'Je souhaite reserver ce bien.',
        }
        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 1)
        reservation = Reservation.objects.first()
        self.assertEqual(reservation.locataire_id, self.locataire.id)

    def test_echec_si_date_invalide(self):
        self.client.force_authenticate(user=self.locataire_user)

        payload = {
            'bien': self.bien.id,
            'date_debut': '2026-03-30',
            'date_fin': '2026-03-25',
            'message': '',
        }
        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date_fin', response.data)

    def test_echec_si_chevauchement(self):
        self.client.force_authenticate(user=self.locataire_user)

        Reservation.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            date_debut='2026-03-25',
            date_fin='2026-03-30',
            message='Reservation existante',
            statut=Reservation.STATUT_CONFIRMEE,
        )

        payload = {
            'bien': self.bien.id,
            'date_debut': '2026-03-28',
            'date_fin': '2026-04-02',
            'message': 'Conflit attendu',
        }
        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_echec_si_user_non_locataire(self):
        self.client.force_authenticate(user=self.proprietaire_user)

        payload = {
            'bien': self.bien.id,
            'date_debut': '2026-03-25',
            'date_fin': '2026-03-30',
            'message': 'Doit echouer',
        }
        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_liste_retourne_reservations_du_locataire_connecte(self):
        Reservation.objects.create(
            bien=self.bien,
            locataire=self.locataire,
            date_debut='2026-03-25',
            date_fin='2026-03-30',
            message='Reservation locataire 1',
            statut=Reservation.STATUT_EN_ATTENTE,
        )
        Reservation.objects.create(
            bien=self.bien,
            locataire=self.autre_locataire,
            date_debut='2026-04-05',
            date_fin='2026-04-10',
            message='Reservation locataire 2',
            statut=Reservation.STATUT_EN_ATTENTE,
        )

        self.client.force_authenticate(user=self.locataire_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['locataire'], self.locataire.id)
