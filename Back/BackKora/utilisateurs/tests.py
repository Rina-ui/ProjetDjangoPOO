from django.test import TestCase, RequestFactory
from django.contrib.sessions.middleware import SessionMiddleware

from .models import Utilisateur, Proprietaire, AuditLog


class UtilisateurModelTest(TestCase):
    """Tests pour le modèle Utilisateur."""

    def test_creation_utilisateur(self):
        user = Utilisateur.objects.create_user(
            username='testuser', password='testpass123', role='LOCATAIRE'
        )
        self.assertEqual(user.role, 'LOCATAIRE')
        self.assertEqual(str(user), 'testuser (Locataire)')

    def test_role_defaut_locataire(self):
        user = Utilisateur.objects.create_user(username='u1', password='pass')
        self.assertEqual(user.role, 'LOCATAIRE')

    def test_modifier_profil(self):
        user = Utilisateur.objects.create_user(
            username='u2', password='pass', first_name='Ancien'
        )
        user.modifier_profil(first_name='Nouveau', email='new@test.com')
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Nouveau')
        self.assertEqual(user.email, 'new@test.com')

    def test_modifier_profil_champs_proteges(self):
        """Les champs id, password et role ne doivent pas être modifiables via modifier_profil."""
        user = Utilisateur.objects.create_user(
            username='u3', password='pass', role='LOCATAIRE'
        )
        ancien_id = user.id
        user.modifier_profil(id=999, role='ADMIN', password='hack')
        user.refresh_from_db()
        self.assertEqual(user.id, ancien_id)
        self.assertEqual(user.role, 'LOCATAIRE')

    def test_se_connecter_succes(self):
        factory = RequestFactory()
        request = factory.post('/login/')
        middleware = SessionMiddleware(lambda r: None)
        middleware.process_request(request)
        request.session.save()

        user = Utilisateur.objects.create_user(username='u4', password='pass123')
        result = user.se_connecter(request, 'pass123')
        self.assertTrue(result)

    def test_se_connecter_echec(self):
        factory = RequestFactory()
        request = factory.post('/login/')
        middleware = SessionMiddleware(lambda r: None)
        middleware.process_request(request)
        request.session.save()

        user = Utilisateur.objects.create_user(username='u5', password='pass123')
        result = user.se_connecter(request, 'mauvais_mdp')
        self.assertFalse(result)


class ProprietaireModelTest(TestCase):
    """Tests pour le modèle Proprietaire."""

    def test_creation_auto_profil_proprietaire(self):
        """Le signal doit auto-créer un profil Proprietaire."""
        user = Utilisateur.objects.create_user(
            username='proprio1', password='pass', role='PROPRIETAIRE',
            first_name='Jean', last_name='Dupont', email='jean@test.com',
        )
        self.assertTrue(
            Proprietaire.objects.filter(utilisateur=user).exists()
        )
        profil = user.profil_proprietaire
        self.assertEqual(profil.nom, 'Dupont')
        self.assertEqual(profil.prenom, 'Jean')
        self.assertEqual(profil.email, 'jean@test.com')

    def test_pas_de_profil_pour_locataire(self):
        """Aucun profil Proprietaire pour un utilisateur LOCATAIRE."""
        user = Utilisateur.objects.create_user(
            username='loc1', password='pass', role='LOCATAIRE'
        )
        self.assertFalse(
            Proprietaire.objects.filter(utilisateur=user).exists()
        )

    def test_str(self):
        user = Utilisateur.objects.create_user(
            username='p2', password='pass', role='PROPRIETAIRE',
            first_name='Marie', last_name='Martin',
        )
        self.assertEqual(str(user.profil_proprietaire), 'Marie Martin')


class AuditLogSignalTest(TestCase):
    """Tests pour les signaux d'audit."""

    def test_audit_creation(self):
        AuditLog.objects.all().delete()
        Utilisateur.objects.create_user(username='audit1', password='pass')
        logs = AuditLog.objects.filter(modele='Utilisateur', action='CREATION')
        self.assertTrue(logs.exists())

    def test_audit_modification(self):
        user = Utilisateur.objects.create_user(username='audit2', password='pass')
        AuditLog.objects.all().delete()
        user.first_name = 'Modifié'
        user.save()
        logs = AuditLog.objects.filter(modele='Utilisateur', action='MODIFICATION')
        self.assertTrue(logs.exists())

    def test_audit_suppression(self):
        user = Utilisateur.objects.create_user(username='audit3', password='pass')
        AuditLog.objects.all().delete()
        user.delete()
        logs = AuditLog.objects.filter(modele='Utilisateur', action='SUPPRESSION')
        self.assertTrue(logs.exists())

    def test_pas_audit_pour_auditlog(self):
        """L'AuditLog ne doit pas s'auto-logger."""
        AuditLog.objects.all().delete()
        AuditLog.objects.create(
            action='TEST', modele='Test', objet_id=1
        )
        logs = AuditLog.objects.filter(modele='AuditLog')
        self.assertFalse(logs.exists())


class TwoFactorAuthTest(TestCase):
    """Tests pour l'authentification 2FA (TOTP)."""

    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            username='user2fa', password='pass123'
        )

    def test_2fa_desactive_par_defaut(self):
        self.assertEqual(self.user.otp_secret, '')

    def test_activer_2fa(self):
        secret = self.user.activer_2fa()
        self.user.refresh_from_db()
        self.assertEqual(len(secret), 32)
        self.assertEqual(self.user.otp_secret, secret)

    def test_desactiver_2fa(self):
        self.user.activer_2fa()
        self.user.desactiver_2fa()
        self.user.refresh_from_db()
        self.assertEqual(self.user.otp_secret, '')

    def test_verifier_otp_sans_2fa(self):
        """Sans 2FA activé, verifier_otp retourne toujours True."""
        self.assertTrue(self.user.verifier_otp('123456'))

    def test_verifier_otp_code_valide(self):
        import pyotp
        self.user.activer_2fa()
        totp = pyotp.TOTP(self.user.otp_secret)
        code = totp.now()
        self.assertTrue(self.user.verifier_otp(code))

    def test_verifier_otp_code_invalide(self):
        self.user.activer_2fa()
        self.assertFalse(self.user.verifier_otp('000000'))

    def test_generer_otp_uri(self):
        self.user.activer_2fa()
        uri = self.user.generer_otp_uri()
        self.assertIn('otpauth://totp/', uri)
        self.assertIn('user2fa', uri)
        self.assertIn('LocationApp', uri)

    def test_generer_otp_uri_sans_2fa(self):
        self.assertIsNone(self.user.generer_otp_uri())
