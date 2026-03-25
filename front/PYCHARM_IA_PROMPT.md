# Configuration complète pour le système de gestion des biens avec photos

## Étapes Django

### 1. Modèle Bien (patrimoine/models.py)

```python
from django.db import models
from django.contrib.auth import get_user_model

class Bien(models.Model):
    """Bien immobilier géré par un propriétaire."""

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
        'Categorie',
        on_delete=models.PROTECT,
        related_name='biens',
    )
    type_bien = models.ForeignKey(
        'TypeBien',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='biens',
    )
    adresse = models.TextField()
    description = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)  # Métadonnées des photos
    equipements = models.JSONField(default=list, blank=True)  # Liste d'équipements
    loyer_hc = models.DecimalField(max_digits=12, decimal_places=2)
    charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    statut = models.CharField(
        max_length=20, choices=STATUT_CHOICES, default='VACANT'
    )
    en_ligne = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

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

    def __str__(self):
        return f"{self.adresse} - {self.get_statut_display()}"

    class Meta:
        verbose_name = 'Bien'
        verbose_name_plural = 'Biens'


class PhotoBien(models.Model):
    """Photo d'un bien immobilier."""
    
    bien = models.ForeignKey(
        "patrimoine.Bien",
        on_delete=models.CASCADE,
        related_name="photos_files"
    )
    image = models.ImageField(upload_to="biens/")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Photo de bien'
        verbose_name_plural = 'Photos de biens'
        ordering = ['-date_creation']

    def __str__(self):
        return f"Photo de {self.bien.adresse}"
```

### 2. Serializer (patrimoine/serializers.py)

```python
from rest_framework import serializers
from .models import Bien, PhotoBien, Categorie, TypeBien

class PhotoBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoBien
        fields = ['id', 'image', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class BienSerializer(serializers.ModelSerializer):
    photos_files = PhotoBienSerializer(many=True, read_only=True)
    
    class Meta:
        model = Bien
        fields = [
            'id', 'proprietaire', 'categorie', 'type_bien', 'adresse',
            'description', 'photos', 'photos_files', 'equipements',
            'loyer_hc', 'charges', 'latitude', 'longitude', 'statut',
            'en_ligne', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'description', 'date_creation']


class TypeBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeBien
        fields = ['id', 'nom', 'description', 'categorie', 'date_creation']
```

### 3. ViewSet (patrimoine/views.py)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Bien, PhotoBien, Categorie, TypeBien
from .serializers import BienSerializer, PhotoBienSerializer, CategorieSerializer, TypeBienSerializer


class CategorieViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer


class TypeBienViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TypeBien.objects.all()
    serializer_class = TypeBienSerializer


class BienViewSet(viewsets.ModelViewSet):
    queryset = Bien.objects.all()
    serializer_class = BienSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrer les biens selon l'utilisateur s'il est propriétaire."""
        user = self.request.user
        if user.role == 'PROPRIETAIRE':
            # Récupérer les biens du propriétaire
            return Bien.objects.filter(proprietaire__utilisateur=user)
        return Bien.objects.all()

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], url_path="upload-photos")
    def upload_photos(self, request, pk=None):
        """
        Endpoint pour uploader les photos d'un bien.
        
        Utilisation :
        POST /api/biens/{id}/upload-photos/
        Body: multipart/form-data avec clé "photos"
        """
        bien = self.get_object()
        files = request.FILES.getlist("photos")
        
        if not files:
            return Response(
                {"detail": "Aucun fichier reçu"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que l'utilisateur est le propriétaire du bien
        if bien.proprietaire.utilisateur != request.user:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à ajouter des photos à ce bien"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            created = [PhotoBien.objects.create(bien=bien, image=f) for f in files]
            data = PhotoBienSerializer(created, many=True, context={"request": request}).data
            return Response(data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mettre_en_ligne(self, request, pk=None):
        """Mettre le bien en ligne."""
        bien = self.get_object()
        
        if bien.proprietaire.utilisateur != request.user:
            return Response(
                {"detail": "Non autorisé"},
                status=status.HTTP_403_FORBIDDEN
            )

        if bien.en_ligne:
            return Response({'message': 'Déjà en ligne'}, status=400)

        bien.mettre_en_ligne()
        return Response({'message': 'Bien mis en ligne'})

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """Changer le statut du bien."""
        bien = self.get_object()
        
        if bien.proprietaire.utilisateur != request.user:
            return Response(
                {"detail": "Non autorisé"},
                status=status.HTTP_403_FORBIDDEN
            )

        nouveau_statut = request.data.get('statut')

        if not nouveau_statut:
            return Response({'error': 'Statut requis'}, status=400)

        if nouveau_statut not in dict(Bien.STATUT_CHOICES):
            return Response({'error': 'Statut invalide'}, status=400)

        bien.changer_statut(nouveau_statut)
        return Response({'message': 'Statut mis à jour'})

    @action(detail=True, methods=['get'])
    def loyer_total(self, request, pk=None):
        """Retourner le loyer total."""
        bien = self.get_object()
        total = bien.calculer_loyer_total()
        return Response({'loyer_total': total})
```

### 4. Router (patrimoine/urls.py ou dans le projet)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategorieViewSet, TypeBienViewSet, BienViewSet
)

router = DefaultRouter()
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'types-bien', TypeBienViewSet, basename='type_bien')
router.register(r'biens', BienViewSet, basename='bien')

urlpatterns = [
    path('', include(router.urls)),
]
```

### 5. Admin (patrimoine/admin.py)

```python
from django.contrib import admin
from .models import Bien, PhotoBien, Categorie, TypeBien


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'date_creation')
    search_fields = ('nom',)


@admin.register(TypeBien)
class TypeBienAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'categorie', 'date_creation')
    list_filter = ('categorie',)
    search_fields = ('nom',)


@admin.register(Bien)
class BienAdmin(admin.ModelAdmin):
    list_display = ('id', 'adresse', 'proprietaire', 'categorie', 'type_bien', 'statut', 'loyer_hc', 'date_creation')
    list_filter = ('statut', 'categorie', 'date_creation')
    search_fields = ('adresse', 'description')
    readonly_fields = ('date_creation', 'date_modification')


@admin.register(PhotoBien)
class PhotoBienAdmin(admin.ModelAdmin):
    list_display = ('id', 'bien', 'date_creation')
    list_filter = ('date_creation',)
    search_fields = ('bien__adresse',)
    readonly_fields = ('date_creation',)
```

### 6. Settings (LocationApp/settings.py)

S'assurer que :
```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'patrimoine',
    # ...
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Si vous utilisez JWT
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 7. Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

## Frontend - Fichiers clés

### src/services/biens.ts
- `createBien()` - Crée un bien sans photos
- `uploadBienPhotos()` - Upload les photos du bien
- `fetchBiensByOwner()` - Récupère les biens de l'utilisateur connecté
- `updateBien()` - Met à jour un bien

### src/component/AddBienForm.tsx
- Formulaire pour ajouter/modifier un bien
- Gestion des photos (sélection, validation, affichage)
- Gestion des erreurs et succès

## Flux complet d'utilisation

1. **Propriétaire se connecte** → Accès à ProprioDashboard
2. **Clique sur "Ajouter un bien"** → AddBienForm s'ouvre
3. **Remplit le formulaire** → Sélectionne photos, catégorie, etc.
4. **Clique "Enregistrer le bien"** → 
   - POST /api/biens/ → Bien créé, reçoit un ID
   - POST /api/biens/{id}/upload-photos/ → Photos uploadées
5. **Liste des biens** → Affiche le bien avec les photos

## Vérification

### Test via cURL
```bash
# 1. Créer un bien
curl -X POST http://127.0.0.1:8000/api/biens/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 1,
    "adresse": "Lomé, Agoè",
    "description": "Belle maison",
    "photos": [],
    "equipements": ["Climatisation", "Wifi"],
    "loyer_hc": 100000,
    "charges": 10000,
    "statut": "VACANT"
  }'

# 2. Uploader les photos
curl -X POST http://127.0.0.1:8000/api/biens/1/upload-photos/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@/chemin/vers/photo1.jpg" \
  -F "photos=@/chemin/vers/photo2.jpg"
```

### Test depuis Django Admin
1. Aller sur http://127.0.0.1:8000/admin/
2. Naviguer vers Biens
3. Créer/modifier un bien
4. Dans PhotoBien, ajouter des images manuellement

## Dépannage

**Erreur: "Aucun fichier reçu"**
- Vérifier que la clé multipart est "photos"
- Vérifier que les fichiers sont envoyés

**Erreur: "Non autorisé"**
- Vérifier que l'utilisateur est connecté
- Vérifier que c'est le bon propriétaire

**Erreur: "Bien introuvable" (404)**
- Vérifier que le bien a bien été créé
- Vérifier l'ID utilisé

**Les photos n'apparaissent pas**
- Vérifier que les fichiers sont bien uploadés
- Vérifier le chemin MEDIA_URL/MEDIA_ROOT
- Vérifier que le serializer inclut photos_files

