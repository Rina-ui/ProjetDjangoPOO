import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from patrimoine.models import Bien, Categorie, PhotoBien
from utilisateurs.models import Proprietaire


class BienUploadPhotosAPITest(APITestCase):
    def setUp(self):
        self.temp_media_root = tempfile.mkdtemp(prefix="test_media_")
        self.media_override = override_settings(MEDIA_ROOT=self.temp_media_root)
        self.media_override.enable()

        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="leo389176@gmail.com",
            password="123456",
            role="PROPRIETAIRE",
        )
        self.client.login(username="leo389176@gmail.com", password="123456")

        self.proprietaire = Proprietaire.objects.create(
            utilisateur=self.user,
            nom="Doe",
            prenom="Leo",
            email="leo389176@gmail.com",
            telephone="22900000000",
            adresse="Cotonou",
        )
        self.categorie = Categorie.objects.create(nom="Residentiel")

    def tearDown(self):
        self.media_override.disable()
        shutil.rmtree(self.temp_media_root, ignore_errors=True)

    def test_upload_two_photos_and_get_bien_contains_image_urls(self):
        create_bien_url = reverse("bien-list")
        payload = {
            "proprietaire": self.proprietaire.id,
            "categorie": self.categorie.id,
            "type_bien": None,
            "adresse": "Akpakpa, Cotonou",
            "description": "Appartement test",
            "photos": [],
            "equipements": [],
            "loyer_hc": "100000.00",
            "charges": "15000.00",
            "latitude": None,
            "longitude": None,
            "statut": "VACANT",
            "en_ligne": False,
        }

        create_response = self.client.post(create_bien_url, payload, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        bien_id = create_response.data["id"]
        bien = Bien.objects.get(id=bien_id)

        upload_url = reverse("bien-upload-photos", kwargs={"pk": bien.id})
        photo_1 = tempfile.SpooledTemporaryFile()
        photo_1.write(b"fake-image-content-1")
        photo_1.seek(0)

        photo_2 = tempfile.SpooledTemporaryFile()
        photo_2.write(b"fake-image-content-2")
        photo_2.seek(0)

        from django.core.files.uploadedfile import SimpleUploadedFile

        file_1 = SimpleUploadedFile("photo1.jpg", photo_1.read(), content_type="image/jpeg")
        file_2 = SimpleUploadedFile("photo2.jpg", photo_2.read(), content_type="image/jpeg")

        upload_response = self.client.post(
            upload_url,
            {"photos": [file_1, file_2]},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PhotoBien.objects.filter(bien=bien).count(), 2)

        detail_url = reverse("bien-detail", kwargs={"pk": bien.id})
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)

        photos_files = detail_response.data.get("photos_files", [])
        self.assertEqual(len(photos_files), 2)
        for photo_data in photos_files:
            self.assertIn("image_url", photo_data)
            self.assertTrue(photo_data["image_url"].startswith("http://testserver/media/"))

