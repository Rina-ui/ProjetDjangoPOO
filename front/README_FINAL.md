# 📚 Guide final : Système d'upload de photos avec Django + React

## 🎯 Objectif atteint

Vous avez un système complet permettant aux propriétaires de :
1. **Créer un bien immobilier** avec les détails (adresse, description, équipements, etc.)
2. **Ajouter des photos** (JPG, PNG, WEBP) lors de la création
3. **Voir les photos** dans la liste des biens

---

## 🏗️ Architecture du système

```
Frontend (React)                           Backend (Django)
    ↓                                          ↓
AddBienForm                            BienViewSet
    ↓                                          ↓
1. POST /api/biens/              →  Bien créé (photos = [])
    ↓                                          ↓
   [Reçoit bien.id = 5]                       ↓
    ↓                                          ↓
2. POST /api/biens/5/upload-photos/  →  PhotoBien créé(s)
    ↓                                          ↓
[Success message]               Fichiers sauvegardés
```

---

## 📦 Ce qui est en place (Frontend)

### ✅ Services (`src/services/biens.ts`)

- `createBien(payload)` - POST /api/biens/
- `uploadBienPhotos(bienId, files)` - POST /api/biens/{id}/upload-photos/
- `extractCreatedBienId(response)` - Extrait l'ID du bien créé
- Gestion complète des erreurs et authentification

### ✅ Composant (`src/component/AddBienForm.tsx`)

- Formulaire complet avec tous les champs
- Sélection et validation des photos
- Affichage de la liste des photos avant envoi
- Gestion du flux création → upload
- Messages succès/erreur clairs
- Statut "Envoi..." pendant la soumission

### ✅ API (`src/services/api.ts`)

- Authentification automatique avec Bearer token
- Gestion des headers multipart
- Interception des erreurs

---

## 🔧 À configurer côté Django

### 1️⃣ Modèle PhotoBien

**File**: `patrimoine/models.py`

```python
class PhotoBien(models.Model):
    bien = models.ForeignKey("patrimoine.Bien", on_delete=models.CASCADE, 
                            related_name="photos_files")
    image = models.ImageField(upload_to="biens/")
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Photo de bien'
        verbose_name_plural = 'Photos de biens'
        ordering = ['-date_creation']
```

### 2️⃣ Serializers

**File**: `patrimoine/serializers.py`

```python
from rest_framework import serializers
from .models import Bien, PhotoBien

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
```

### 3️⃣ Action upload-photos au ViewSet

**File**: `patrimoine/views.py`

```python
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class BienViewSet(viewsets.ModelViewSet):
    queryset = Bien.objects.all()
    serializer_class = BienSerializer
    
    @action(detail=True, methods=["post"], 
            parser_classes=[MultiPartParser, FormParser],
            url_path="upload-photos")
    def upload_photos(self, request, pk=None):
        bien = self.get_object()
        files = request.FILES.getlist("photos")
        
        if not files:
            return Response(
                {"detail": "Aucun fichier reçu"},
                status=status.HTTP_400_BAD_REQUEST
            )

        created = [PhotoBien.objects.create(bien=bien, image=f) 
                  for f in files]
        data = PhotoBienSerializer(created, many=True, 
                                   context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)
```

### 4️⃣ Admin

**File**: `patrimoine/admin.py`

```python
@admin.register(PhotoBien)
class PhotoBienAdmin(admin.ModelAdmin):
    list_display = ('id', 'bien', 'date_creation')
    list_filter = ('date_creation',)
    search_fields = ('bien__adresse',)
    readonly_fields = ('date_creation',)
```

### 5️⃣ Configuration

**File**: `LocationApp/settings.py`

```python
import os

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### 6️⃣ Migrations

```bash
python manage.py makemigrations patrimoine
python manage.py migrate
```

---

## 🧪 Vérification du flux

### Test 1 : Créer un bien

```bash
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

# Retour attendu
# {"id": 5, "proprietaire": 1, ...}
```

### Test 2 : Uploader une photo

```bash
curl -X POST http://127.0.0.1:8000/api/biens/5/upload-photos/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"

# Retour attendu
# [{"id": 1, "image": "/media/biens/...", "date_creation": "..."}, ...]
```

### Test 3 : Vérifier

```bash
curl -X GET http://127.0.0.1:8000/api/biens/5/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.photos_files'

# Retour attendu
# [{"id": 1, "image": "http://....", "date_creation": "..."}, ...]
```

---

## 🖥️ Utilisation depuis le Frontend

1. **Naviguer** vers le ProprioDashboard
2. **Cliquer** sur "Ajouter un bien"
3. **Remplir** le formulaire :
   - Catégorie, Type de bien
   - Adresse, Description
   - Équipements (séparés par virgule)
   - Sélectionner des photos (optionnel)
   - Loyer HC, Charges
4. **Cliquer** "Enregistrer le bien"
5. **Vérifier** le message de succès
6. **Voir** le bien dans la liste avec les photos

---

## 🐛 Debugging

### Console Frontend

Ouvrir les DevTools (F12) et aller dans l'onglet **Console** :

```
[POST /api/biens/] payload: {...}
[POST /api/biens/] response: {id: 5, ...}
[POST /api/biens/] created id: 5
[POST /api/biens/{id}/upload-photos/] files: ["photo1.jpg", "photo2.jpg"]
✅ Bien ajoute avec succes.
```

### Terminal Django

```bash
python manage.py runserver

# Sortie attendue
[25/Mar/2026 12:00:00] "POST /api/biens/ HTTP/1.1" 201
[25/Mar/2026 12:00:01] "POST /api/biens/5/upload-photos/ HTTP/1.1" 201
```

### Vérifier les fichiers

```bash
ls -lh media/biens/
# -rw-r--r-- photo1.jpg
# -rw-r--r-- photo2.jpg
```

---

## 📋 Checklist finale

### Setup Django
- [ ] Modèle PhotoBien créé
- [ ] Serializers créés/mis à jour
- [ ] Action upload-photos au ViewSet
- [ ] Admin configuré
- [ ] Settings: MEDIA_URL et MEDIA_ROOT
- [ ] Migrations appliquées
- [ ] Serveur redémarré

### Vérification Frontend
- [ ] Formulaire apparaît
- [ ] Sélection de photos possible
- [ ] Validation des formats
- [ ] Upload et création du bien marche
- [ ] Messages succès/erreur affichés
- [ ] Photos visibles dans la liste

### Tests
- [ ] Bien créé en base
- [ ] Photos uploadées en base
- [ ] Fichiers sauvegardés dans /media/biens/
- [ ] Photos_files retournées en GET
- [ ] Affichage correct dans le Frontend

---

## 📚 Documentation complète

Des documents détaillés sont disponibles dans le dossier front/ :

1. **GUIDE_UPLOAD_PHOTOS.md** - Guide technique complet
2. **PYCHARM_IA_PROMPT.md** - Code à générer avec l'IA
3. **RÉSUMÉ_PHOTOS.md** - Résumé des étapes
4. **EXEMPLE_COMPLET_FLUX.md** - Flux détaillé avec logs
5. **TESTS_PHOTOS.md** - Plan de tests

---

## 🚀 Points clés à retenir

✅ **Flux en 2 étapes** : Bien d'abord, photos ensuite
✅ **Multipart** : Pour les fichiers binaires uniquement
✅ **Clé correcte** : "photos" (pas "image")
✅ **Authentification** : Bearer token dans les headers
✅ **Related_name** : "photos_files" pour matcher le frontend
✅ **Upload_to** : "biens/" pour l'organisation

---

## 💡 Optimisations futures

- [ ] Compression des images
- [ ] Génération de miniatures
- [ ] Édition des photos (recadrage, rotation)
- [ ] Galerie lightbox
- [ ] Suppression de photos
- [ ] Tri des photos (drag & drop)

---

## 📞 Support

Si vous avez des questions ou des problèmes :

1. Consultez les logs (Frontend console + Django terminal)
2. Vérifiez les documents dans le dossier front/
3. Assurez-vous que les migrations sont appliquées
4. Vérifiez que les fichiers sont sauvegardés dans /media/

---

## ✨ Résumé

Vous avez maintenant un système complet permettant à votre application d'enregistrer 
des biens immobiliers avec photos. Le système est :

- **Sécurisé** : Authentification requise
- **Performant** : Upload en arrière-plan
- **Scalable** : Peut gérer plusieurs photos par bien
- **Maintenable** : Code bien structuré et documenté

Bonne chance avec votre application ! 🎉

---

## 🔗 Fichiers frontend à connaître

```
src/
├── services/
│   ├── api.ts           ✅ Authentification automatique
│   └── biens.ts         ✅ createBien(), uploadBienPhotos()
├── component/
│   └── AddBienForm.tsx  ✅ Formulaire complet
├── view/
│   └── dashboard/
│       └── ProprioDashboard.tsx  ← Affiche le formulaire
└── style/
    └── dashboard.css    ✅ Styles pour le formulaire
```

Tout est déjà en place ! Il ne reste que la configuration Django.

