# 📝 Prompt complet à copier dans PyCharm IA

Utilisez ce texte comme prompt dans l'IA de PyCharm pour générer le code Django automatiquement.

---

## 🎯 Prompt complet

```
Je développe une application Django (version 6.0.3) avec DRF (Django REST Framework) pour gérer 
des biens immobiliers. J'ai actuellement un modèle Bien en base avec les champs suivants :

- proprietaire (FK vers Proprietaire)
- categorie (FK vers Categorie)
- type_bien (FK vers TypeBien)
- adresse (TextField)
- description (TextField)
- photos (JSONField)
- equipements (JSONField)
- loyer_hc (DecimalField)
- charges (DecimalField)
- statut (CharField avec choices)
- date_creation et date_modification

Mon Frontend (React) utilise un formulaire pour ajouter des biens avec photos.
Le flux est le suivant :
1. Créer le bien via POST /api/biens/ (avec photos = [])
2. Upload les photos via POST /api/biens/{id}/upload-photos/ (multipart/form-data)

J'ai besoin de :

## 1. Créer le modèle PhotoBien

Un modèle PhotoBien qui :
- A une FK vers Bien (relation one-to-many)
- Stocke l'image via ImageField avec upload_to="biens/"
- A un champ date_creation (auto_now_add=True)
- Inclut related_name="photos_files" pour accéder depuis Bien

## 2. Créer les Serializers

- PhotoBienSerializer : sérialize id, image, date_creation
- Mettre à jour BienSerializer pour inclure photos_files en read_only avec PhotoBienSerializer(many=True)

## 3. Mettre à jour le ViewSet

Dans BienViewSet, ajouter une action personnalisée @action :
- Endpoint: upload-photos
- Méthode: POST
- Parsers: MultiPartParser, FormParser
- Parameters: files envoyés avec clé "photos" en multipart
- Logique:
  - Récupérer le bien via pk
  - Récupérer les fichiers avec request.FILES.getlist("photos")
  - Créer une instance PhotoBien pour chaque fichier
  - Retourner les données sérialisées avec status 201

## 4. Admin

Créer un PhotoBienAdmin qui affiche : id, bien, date_creation (readonly)

## 5. Configuration

S'assurer que settings.py a :
- MEDIA_URL = '/media/'
- MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

## 6. Migrations

Générer et appliquer les migrations automatiquement.

Génère le code complet et prêt à utiliser.
```

---

## 🎨 Version courte (si le prompt long est trop)

```
Je développe une application Django pour gérer des biens immobiliers.
Je dois créer un système d'upload de photos pour chaque bien.

Actuellement :
- Modèle Bien existe
- DRF ViewSet BienViewSet existe
- Frontend envoie d'abord le bien (sans photos), puis les photos après

Je besoin de :
1. Modèle PhotoBien (image, bien FK, date_creation)
2. Serializer pour PhotoBien et BienSerializer mis à jour (inclure photos_files)
3. Action @action upload-photos au ViewSet (POST, multipart)
4. Admin pour PhotoBien
5. Migrations

Génère le code complet.
```

---

## 📋 Checklist après génération

Après que PyCharm génère le code :

### 1. Modèle
- [ ] Classe PhotoBien créée
- [ ] FK vers Bien avec on_delete=models.CASCADE
- [ ] related_name="photos_files"
- [ ] ImageField avec upload_to="biens/"
- [ ] date_creation avec auto_now_add=True
- [ ] Meta class avec verbose_name et ordering

### 2. Serializer
- [ ] PhotoBienSerializer créé
- [ ] BienSerializer inclut photos_files = PhotoBienSerializer(many=True, read_only=True)
- [ ] Fields corrects dans Meta

### 3. ViewSet
- [ ] @action décorateur avec detail=True, methods=['post']
- [ ] parser_classes=[MultiPartParser, FormParser]
- [ ] url_path="upload-photos"
- [ ] Logique pour créer PhotoBien
- [ ] Retour des données sérialisées

### 4. Admin
- [ ] PhotoBienAdmin enregistrée avec @admin.register
- [ ] list_display montrant bien et date_creation
- [ ] readonly_fields pour date_creation

### 5. Settings
- [ ] MEDIA_URL configuré
- [ ] MEDIA_ROOT configuré

### 6. Migrations
- [ ] Fichier de migration créé
- [ ] Migration appliquée (ou commands à exécuter)

---

## 🚀 Après génération : tests

### Test 1 : Créer un bien

```bash
curl -X POST http://127.0.0.1:8000/api/biens/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 1,
    "adresse": "Test",
    "description": "Test",
    "photos": [],
    "equipements": [],
    "loyer_hc": 100000,
    "charges": 10000,
    "statut": "VACANT"
  }'
```

### Test 2 : Uploader une photo

```bash
curl -X POST http://127.0.0.1:8000/api/biens/1/upload-photos/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@photo.jpg"
```

### Test 3 : Vérifier en GET

```bash
curl -X GET http://127.0.0.1:8000/api/biens/1/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Vérifier que la réponse inclut :
```json
{
    "id": 1,
    ...
    "photos_files": [
        {
            "id": 1,
            "image": "/media/biens/photo.jpg",
            "date_creation": "..."
        }
    ]
}
```

---

## 📝 Structure attendue après génération

```
patrimoine/
├── models.py
│   ├── Bien (existant)
│   └── PhotoBien (NOUVEAU)
├── serializers.py
│   ├── PhotoBienSerializer (NOUVEAU)
│   └── BienSerializer (MODIFIÉ)
├── views.py
│   └── BienViewSet.upload_photos (NOUVEAU)
├── admin.py
│   └── PhotoBienAdmin (NOUVEAU)
├── migrations/
│   └── 000X_add_photobien.py (NOUVEAU)
└── ...
```

---

## 💡 Points importants

1. **Related_name**: Doit être "photos_files" pour matcher le frontend
2. **Upload_to**: Doit être "biens/" pour l'organisation
3. **Parsers**: DOIT inclure MultiPartParser et FormParser
4. **Clé multipart**: DOIT être "photos" (pas "image", pas "file")
5. **Status codes**: 201 CREATED pour succès, 400 pour erreurs
6. **Authentification**: Les utilisateurs ne peuvent upload que pour leurs propres biens

---

## 🔗 Ressources

- Frontend: voir src/services/biens.ts (uploadBienPhotos)
- Frontend: voir src/component/AddBienForm.tsx (handleSubmit)
- Django docs: https://www.django-rest-framework.org/api-guide/parsers/#multipartparser

---

## ✅ Validation finale

Après la génération et les tests, vous devez avoir :

✅ Bien créé sans photos
✅ Photos uploadées et sauvegardées
✅ Photos accessibles via GET /api/biens/{id}/
✅ Photos affichées dans la liste avec les biens
✅ Authentification requise
✅ Gestion des erreurs complète

Bon développement ! 🚀
```

---

## Alternative : Demande progressive à l'IA

Si vous voulez guider l'IA étape par étape :

### Étape 1
```
Crée un modèle Django PhotoBien pour stocker les photos d'un bien immobilier.
Le modèle doit avoir une FK vers Bien avec related_name="photos_files", 
un ImageField avec upload_to="biens/" et un date_creation auto.
```

### Étape 2
```
Crée un PhotoBienSerializer et mets à jour BienSerializer pour inclure 
photos_files en tant que relation sérialisée (many=True, read_only=True).
```

### Étape 3
```
Ajoute une action @action au BienViewSet pour uploader les photos.
L'endpoint doit être upload-photos en POST, avec MultiPartParser et FormParser.
Il doit récupérer les fichiers avec request.FILES.getlist("photos") 
et créer une PhotoBien pour chaque fichier.
```

### Étape 4
```
Crée un PhotoBienAdmin pour gérer les photos en Django admin.
Affiche id, bien, et date_creation.
```

### Étape 5
```
Génère les migrations pour PhotoBien et crée une commande pour les appliquer.
```

---

## ✨ Pro tip

Après que l'IA génère le code, testez immédiatement avec :

```bash
# 1. Démarrer le serveur
python manage.py runserver

# 2. Accéder à l'admin
# http://127.0.0.1:8000/admin/
# Vérifier que PhotoBien est visible

# 3. Tester l'API
python manage.py shell_plus

# 4. Créer un test manuel depuis le Frontend
# Ouvrir le formulaire et tenter de créer un bien avec une photo
```

Bonne chance ! 🎉
```


