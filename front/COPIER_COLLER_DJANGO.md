# 💻 Script complet Django (Copier-Coller)

Voici tous les fichiers à créer/modifier pour configurer le backend Django.

---

## 📁 Fichier 1: `patrimoine/models.py`

**À ajouter à la fin du fichier existant :**

```python
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

---

## 📁 Fichier 2: `patrimoine/serializers.py`

**À ajouter/modifier :**

```python
from rest_framework import serializers
from .models import Bien, PhotoBien, Categorie, TypeBien

class PhotoBienSerializer(serializers.ModelSerializer):
    """Serializer pour les photos d'un bien."""
    
    class Meta:
        model = PhotoBien
        fields = ['id', 'image', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class BienSerializer(serializers.ModelSerializer):
    """Serializer pour les biens avec photos."""
    
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
```

---

## 📁 Fichier 3: `patrimoine/views.py`

**À ajouter à la classe BienViewSet :**

```python
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

# Dans la classe BienViewSet, ajouter cette méthode :

@action(
    detail=True,
    methods=["post"],
    parser_classes=[MultiPartParser, FormParser],
    url_path="upload-photos"
)
def upload_photos(self, request, pk=None):
    """
    Endpoint pour uploader les photos d'un bien.
    
    Utilisation :
    POST /api/biens/{id}/upload-photos/
    Body: multipart/form-data avec clé "photos"
    
    Retourne : Array de photos créées
    """
    bien = self.get_object()
    files = request.FILES.getlist("photos")
    
    if not files:
        return Response(
            {"detail": "Aucun fichier reçu"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Créer une PhotoBien pour chaque fichier
        created = [PhotoBien.objects.create(bien=bien, image=f) for f in files]
        
        # Sérialiser et retourner
        data = PhotoBienSerializer(
            created,
            many=True,
            context={"request": request}
        ).data
        
        return Response(data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {"detail": f"Erreur lors de l'upload: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
```

---

## 📁 Fichier 4: `patrimoine/admin.py`

**À ajouter :**

```python
from django.contrib import admin
from .models import PhotoBien

@admin.register(PhotoBien)
class PhotoBienAdmin(admin.ModelAdmin):
    list_display = ('id', 'bien', 'date_creation')
    list_filter = ('date_creation',)
    search_fields = ('bien__adresse',)
    readonly_fields = ('date_creation',)
    
    def get_queryset(self, request):
        # Optimiser les requêtes
        return super().get_queryset(request).select_related('bien')
```

---

## 📁 Fichier 5: `LocationApp/settings.py`

**Vérifier/ajouter :**

```python
import os

# ✅ Vérifier que cela existe
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ✅ Vérifier que rest_framework est en INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',  # ✅ Doit être présent
    'patrimoine',
    'utilisateurs',
    'locataires',
    'notifications',
    'comptabilite.apps.ComptabiliteConfig',
    'chat',
]
```

---

## 📁 Fichier 6: `LocationApp/urls.py`

**Vérifier que vous avez les imports et la configuration :**

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# ✅ Importer vos viewsets
from patrimoine.views import (
    BienViewSet,
    CategorieViewSet,
    TypeBienViewSet,
    # ... autres viewsets
)

# ✅ Créer le router
router = DefaultRouter()
router.register(r'biens', BienViewSet, basename='bien')
router.register(r'categories', CategorieViewSet, basename='categorie')
router.register(r'types-bien', TypeBienViewSet, basename='type_bien')
# ... enregistrer les autres viewsets

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # ... autres URLs
]

# ✅ Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 🚀 Exécuter les migrations

**Terminal :**

```bash
# 1. Créer les migrations
python manage.py makemigrations patrimoine

# 2. Appliquer les migrations
python manage.py migrate

# 3. Vérifier que c'est bon
python manage.py show_urls | grep "upload-photos"

# 4. Redémarrer le serveur
python manage.py runserver
```

**Sorties attendues :**

```
Migrations for 'patrimoine':
  patrimoine/migrations/000X_add_photobien.py
    - Create model PhotoBien

Operations to perform:
  Apply all migrations: ...
Running migrations:
  ...
  Applying patrimoine.000X_add_photobien... OK
```

---

## ✅ Vérification finale

### 1️⃣ Admin Django

```bash
# 1. Aller sur http://127.0.0.1:8000/admin/
# 2. Vérifier que "Photos de biens" apparaît dans le menu
# 3. Cliquer dessus (devrait afficher la liste vide)
```

### 2️⃣ API

```bash
# Test simple
curl -X GET http://127.0.0.1:8000/api/biens/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.'
```

### 3️⃣ Frontend

```bash
# Ouvrir http://localhost:5173
# Naviguer vers ProprioDashboard
# Cliquer "Ajouter un bien"
# Remplir et soumettre
```

---

## 🐛 Debugging

### Erreur : "No module named 'django.core.management.commands.show_urls'"

```bash
# C'est normal, utilisez simplement :
python manage.py runserver
# Et vérifiez manuellement dans le navigateur
```

### Erreur : "AttributeError: 'BienViewSet' object has no attribute 'upload_photos'"

```bash
# Vérifier que la méthode @action est bien ajoutée au ViewSet
# Vérifier l'indentation (Python est sensible à l'indentation)
# Redémarrer le serveur
```

### Erreur : "400 Bad Request" lors de l'upload

```bash
# Vérifier que :
# 1. La clé multipart est "photos"
# 2. Les fichiers sont bien envoyés
# 3. Le bien existe en base
```

---

## 📝 Checklist complète

### Avant de commencer
- [ ] Django 6.0.3+ installé
- [ ] DRF installé
- [ ] Base de données configurée

### Code à ajouter
- [ ] Modèle PhotoBien créé dans models.py
- [ ] PhotoBienSerializer créé dans serializers.py
- [ ] BienSerializer mis à jour (photos_files ajouté)
- [ ] Action upload_photos ajoutée au ViewSet
- [ ] PhotoBienAdmin créé dans admin.py

### Configuration
- [ ] MEDIA_URL configuré
- [ ] MEDIA_ROOT configuré
- [ ] rest_framework en INSTALLED_APPS
- [ ] Router configuré pour les ViewSets

### Exécution
- [ ] makemigrations exécuté
- [ ] migrate exécuté
- [ ] Serveur redémarré
- [ ] Dossier /media/biens/ créé (automatiquement)

### Vérification
- [ ] Admin accessible
- [ ] API répond
- [ ] Frontend fonctionne
- [ ] Photos uploadées et sauvegardées

---

## 📚 Fichiers à consulter

| Fichier | Pour quoi ? |
|---------|-----------|
| models.py | Créer/modifier les modèles |
| serializers.py | Définir la sérialisation |
| views.py | Ajouter les actions API |
| admin.py | Interface d'administration |
| settings.py | Configuration générale |
| urls.py | Routage des URLs |

---

## 🎉 C'est tout !

Une fois les migrations appliquées, votre système est **100% fonctionnel**.

Testez depuis le Frontend et vous verrez :
- ✅ Bien créé en base
- ✅ Photos uploadées dans /media/biens/
- ✅ Photos visibles dans la liste
- ✅ Message de succès affiché

---

## 💡 Important

⚠️ **Le dossier /media/ doit être accessible en écriture**

```bash
# Si problème de permissions :
chmod -R 755 media/
```

✅ **Les fichiers seront sauvegardés dans :**
```
LocationApp/
├── media/
│   └── biens/
│       ├── photo1_abc123.jpg
│       ├── photo2_def456.jpg
│       └── ...
```

✅ **Accès via :**
```
http://127.0.0.1:8000/media/biens/photo1_abc123.jpg
```

---

## 🚀 Prêt ?

Copier-coller le code ci-dessus dans vos fichiers Django et c'est fini !

Bon développement ! 🎊

