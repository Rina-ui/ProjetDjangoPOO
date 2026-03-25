# Résumé : Système d'enregistrement de biens avec photos

## ✅ Ce qui est déjà en place (Frontend)

### 1. Service `biens.ts`
✔️ `createBien()` - Crée un bien (photos = [])
✔️ `uploadBienPhotos()` - Upload les photos via multipart/form-data
✔️ `extractCreatedBienId()` - Récupère l'ID du bien créé
✔️ Gestion correcte des headers et authentification

### 2. Composant `AddBienForm.tsx`
✔️ Sélection de fichiers image
✔️ Validation (format, taille, nombre max)
✔️ Affichage des fichiers sélectionnés
✔️ Flux complet: Créer bien → Upload photos → Afficher succès/erreur

### 3. Intégration API
✔️ Axios configuré avec authentification (Bearer token)
✔️ Gestion automatique des headers multipart
✔️ Gestion des erreurs et logs détaillés

---

## 🔧 Configurer côté Django

### Étape 1 : Ajouter PhotoBien au modèle

**patrimoine/models.py :**
```python
class PhotoBien(models.Model):
    bien = models.ForeignKey("patrimoine.Bien", on_delete=models.CASCADE, related_name="photos_files")
    image = models.ImageField(upload_to="biens/")
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Photo de bien'
        verbose_name_plural = 'Photos de biens'
        ordering = ['-date_creation']
```

### Étape 2 : Ajouter les serializers

**patrimoine/serializers.py :**
```python
class PhotoBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoBien
        fields = ['id', 'image', 'date_creation']
        read_only_fields = ['id', 'date_creation']

class BienSerializer(serializers.ModelSerializer):
    photos_files = PhotoBienSerializer(many=True, read_only=True)
    # ... autres champs
```

### Étape 3 : Ajouter l'action upload-photos au ViewSet

**patrimoine/views.py :**
```python
from rest_framework.parsers import MultiPartParser, FormParser

class BienViewSet(viewsets.ModelViewSet):
    # ...
    
    @action(detail=True, methods=["post"], 
            parser_classes=[MultiPartParser, FormParser],
            url_path="upload-photos")
    def upload_photos(self, request, pk=None):
        bien = self.get_object()
        files = request.FILES.getlist("photos")
        
        if not files:
            return Response({"detail": "Aucun fichier reçu"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        created = [PhotoBien.objects.create(bien=bien, image=f) 
                  for f in files]
        data = PhotoBienSerializer(created, many=True, 
                                   context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)
```

### Étape 4 : Migrations

```bash
python manage.py makemigrations patrimoine
python manage.py migrate
```

### Étape 5 : Vérifier settings.py

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

---

## 🎯 Flux complet

### Frontend (React)
```
1. Utilisateur sélectionne des photos
2. Remplit les autres champs du formulaire
3. Clique sur "Enregistrer le bien"
4. handleSubmit() s'exécute :
   a. createBien() → POST /api/biens/ → Retourne bien.id
   b. uploadBienPhotos(bien.id, files) → POST /api/biens/{id}/upload-photos/
   c. Affiche message succès
```

### Backend (Django)
```
1. POST /api/biens/ 
   → Crée Bien avec photos: []
   → Retourne { id: 5, ...biens }

2. POST /api/biens/5/upload-photos/
   → Reçoit multipart avec clé "photos"
   → Crée PhotoBien pour chaque fichier
   → Retourne [ {id, image_url, ...}, ... ]
```

---

## 🖼️ Affichage dans la liste des biens

**ProprioDashboard.tsx** ou similaire :

```typescript
{bien.photos_files?.map((photo) => (
    <img 
        key={photo.id} 
        src={`http://127.0.0.1:8000${photo.image}`}
        alt="Bien" 
        style={{maxWidth: '200px'}}
    />
))}
```

---

## 📝 Logs à vérifier

### Console Frontend
```
[POST /api/biens/] payload: {...}
[POST /api/biens/] response: {id: 5, ...}
[POST /api/biens/] created id: 5
[POST /api/biens/{id}/upload-photos/] files: ["photo1.jpg", "photo2.jpg"]
```

### Terminal Django
```
[25/Mar/2026 12:00:00] "POST /api/biens/ HTTP/1.1" 201
[25/Mar/2026 12:00:01] "POST /api/biens/5/upload-photos/ HTTP/1.1" 201
```

---

## 🧪 Test rapide cURL

```bash
# 1. Créer un bien
curl -X POST http://127.0.0.1:8000/api/biens/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"proprietaire": 1, "categorie": 1, "type_bien": 1, "adresse": "Adresse", "description": "Desc", "photos": [], "equipements": [], "loyer_hc": 100000, "charges": 10000, "statut": "VACANT"}'

# 2. Uploader les photos (récupérez l'ID de la réponse)
curl -X POST http://127.0.0.1:8000/api/biens/5/upload-photos/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

---

## ⚠️ Éléments importants

1. **Authentification** : Vérifier le Bearer token dans les headers
2. **Multipart** : Axios gère automatiquement `Content-Type: multipart/form-data`
3. **Clé multipart** : Doit être "photos" (pas "image", pas "file")
4. **MEDIA_URL/MEDIA_ROOT** : Doit être configuré dans settings.py
5. **Permissions** : Optionnellement vérifier que c'est le propriétaire

---

## 📌 Fichiers à modifier côté Django

| Fichier | Fonction |
|---------|----------|
| patrimoine/models.py | Ajouter PhotoBien |
| patrimoine/serializers.py | Ajouter PhotoBienSerializer, mettre à jour BienSerializer |
| patrimoine/views.py | Ajouter @action upload_photos |
| patrimoine/admin.py | Optionnel : ajouter PhotoBienAdmin |
| LocationApp/settings.py | Vérifier MEDIA_URL et MEDIA_ROOT |

---

## 🚀 Commandes à exécuter

```bash
# 1. Créer les migrations
python manage.py makemigrations patrimoine

# 2. Appliquer les migrations
python manage.py migrate

# 3. Vérifier que l'endpoint existe
python manage.py show_urls | grep "upload-photos"

# 4. Redémarrer le serveur
python manage.py runserver
```

---

## ✔️ Checklist finale

- [ ] PhotoBien model créé
- [ ] PhotoBienSerializer créé
- [ ] BienSerializer inclut photos_files
- [ ] @action upload_photos ajoutée au ViewSet
- [ ] Migrations appliquées
- [ ] MEDIA_URL et MEDIA_ROOT configurés
- [ ] Serveur Django redémarré
- [ ] Token d'authentification valide
- [ ] Frontend peut créer un bien
- [ ] Frontend peut uploader les photos
- [ ] Photos apparaissent dans la liste des biens

---

## 💡 Points clés du système

✅ **Séparation des requêtes** : Bien d'abord, photos ensuite
✅ **Multipart/form-data** : Pour les fichiers binaires
✅ **Authentification** : Bearer token dans les headers
✅ **Gestion des erreurs** : Logs détaillés à chaque étape
✅ **Validation** : Format et taille vérifiés frontend
✅ **UX** : Statut "Envoi..." et messages succès/erreur clairs


