# Guide : Enregistrer un Bien avec Photos

## Vue d'ensemble du flux
Le système fonctionne en **2 étapes** :

1. **Créer le bien** via `POST /api/biens/` (sans photos)
2. **Uploader les photos** via `POST /api/biens/<id_du_bien>/upload-photos/` (multipart/form-data)

## Fonctionnement technique

### Frontend (React TypeScript)

#### Service `biens.ts`

**Créer un bien :**
```typescript
export const createBien = async (payload: CreateBienPayload) => {
    const body = {
        proprietaire: payload.proprietaire,      // ID du propriétaire
        categorie: payload.categorie,             // ID de la catégorie
        type_bien: payload.type_bien,             // ID du type de bien
        adresse: payload.adresse,
        description: payload.description,
        photos: [],                               // Array vide au départ
        equipements: payload.equipements,         // Array de strings
        loyer_hc: payload.loyer_hc,
        charges: payload.charges,
        statut: payload.statut,                   // "VACANT", "LOUE", "EN_TRAVAUX"
    };

    return api.post("biens/", body, {
        headers: { "Content-Type": "application/json" },
    });
};
```

**Uploader les photos :**
```typescript
export const uploadBienPhotos = async (bienId: number, files: File[]) => {
    if (!files.length) {
        return null;
    }

    const formData = new FormData();
    files.forEach((file) => {
        formData.append("photos", file);  // Clé attendue par le backend
    });

    return api.post(`biens/${bienId}/upload-photos/`, formData);
    // Note: Axios gère automatiquement les headers multipart/form-data
};
```

#### Composant `AddBienForm.tsx`

Le formulaire gère automatiquement :
- Sélection de fichiers image (JPG, PNG, WEBP)
- Validation : max 10 photos, 5 Mo chacune
- Affichage de la liste des photos sélectionnées
- Création du bien + upload des photos dans le bon ordre

**Flux dans `handleSubmit` :**
```typescript
1. Validation des champs obligatoires
2. Création du bien via createBien()
3. Extraction de l'ID du bien créé
4. Si photos présentes : uploadBienPhotos(bienId, photosFiles)
5. Affichage du succès ou de l'erreur
```

### Backend (Django)

#### Modèle `Bien`
```python
class Bien(models.Model):
    proprietaire = models.ForeignKey('utilisateurs.Proprietaire', ...)
    categorie = models.ForeignKey(Categorie, ...)
    type_bien = models.ForeignKey(TypeBien, ...)
    adresse = models.TextField()
    description = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)         # Array JSON
    equipements = models.JSONField(default=list, blank=True)    # Array JSON
    loyer_hc = models.DecimalField(max_digits=12, decimal_places=2)
    charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
```

#### Modèle `PhotoBien`
```python
class PhotoBien(models.Model):
    bien = models.ForeignKey("patrimoine.Bien", on_delete=models.CASCADE, 
                            related_name="photos_files")
    image = models.ImageField(upload_to="biens/")
    date_creation = models.DateTimeField(auto_now_add=True)
```

#### ViewSet `BienViewSet`
```python
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
                {"detail": "Aucun fichier recu"},
                status=status.HTTP_400_BAD_REQUEST
            )

        created = [PhotoBien.objects.create(bien=bien, image=f) 
                  for f in files]
        data = PhotoBienSerializer(created, many=True, 
                                   context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)
```

## Exemple d'utilisation complet

### 1. Remplir le formulaire
- Sélectionner la catégorie
- Sélectionner le type de bien
- Entrer l'adresse, description
- Entrer les équipements (séparés par virgule)
- Sélectionner des photos
- Entrer loyer HC et charges
- Cliquer sur "Enregistrer le bien"

### 2. Ce qui se passe automatiquement

**Requête 1 :**
```
POST http://127.0.0.1:8000/api/biens/
Content-Type: application/json

{
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 2,
    "adresse": "Lomé, Agoè",
    "description": "Belle maison",
    "photos": [],
    "equipements": ["Climatisation", "Wifi"],
    "loyer_hc": 100000,
    "charges": 10000,
    "statut": "VACANT"
}

Réponse :
{
    "id": 5,
    "proprietaire": 1,
    ...
}
```

**Requête 2 :**
```
POST http://127.0.0.1:8000/api/biens/5/upload-photos/
Content-Type: multipart/form-data

photos: [File1, File2, ...]

Réponse :
[
    {
        "id": 1,
        "image": "http://127.0.0.1:8000/media/biens/photo1.jpg",
        "date_creation": "2026-03-25T12:00:00Z"
    },
    ...
]
```

## Affichage des photos

Dans la liste des biens, les photos sont récupérées via `photos_files` :

```typescript
interface Bien {
    id: number;
    photos_files?: Array<{
        id: number;
        image?: string;
        image_url?: string;
    }>;
    // ...autres champs
}
```

Pour afficher les photos :
```typescript
{bien.photos_files?.map((photo) => (
    <img 
        key={photo.id} 
        src={photo.image || photo.image_url} 
        alt="Bien" 
    />
))}
```

## Vérification et logs

### Console Frontend
```
[POST /api/biens/] payload: { proprietaire: 1, ... }
[POST /api/biens/] response: { id: 5, ... }
[POST /api/biens/] created id: 5
[POST /api/biens/{id}/upload-photos/] files: ["photo1.jpg", "photo2.jpg"]
```

### Terminal Django
```
[25/Mar/2026 12:00:00] "POST /api/biens/ HTTP/1.1" 201 Created
[25/Mar/2026 12:00:01] "POST /api/biens/5/upload-photos/ HTTP/1.1" 201 Created
```

## Permissions et Authentification

⚠️ **Important** : L'utilisateur doit être authentifié pour :
- Créer un bien
- Uploader des photos

Vérifiez que le token d'authentification est envoyé dans les headers.

## Dépannage

### Erreur : "Aucun fichier reçu"
- Vérifier que des photos ont été sélectionnées
- Vérifier le format (JPG, PNG, WEBP)
- Vérifier la taille (max 5 Mo)

### Erreur : "Bien créé, mais l'upload des photos a échoué"
- Vérifier que le bien a bien été créé (voir l'ID dans les logs)
- Vérifier la taille des fichiers
- Vérifier l'endpoint `/api/biens/<id>/upload-photos/`

### Erreur 404 sur upload
- Vérifier que le bien a bien été créé
- Vérifier que l'ID du bien est correct
- Vérifier que l'action DRF `upload-photos` existe

### Photos n'apparaissent pas dans la liste
- Vérifier que `photos_files` est inclus dans la réponse
- Vérifier que le champ de relation `photos_files` est défini dans le modèle
- Vérifier que le serializer inclut les photos liées

## Points clés du système

✅ Fonctionnement :
- Les photos sont uploadées **après** la création du bien
- Utilisation de `multipart/form-data` pour les fichiers
- Validation des formats et tailles côté frontend
- Gestion des erreurs à chaque étape

✅ Sécurité :
- Validation des types de fichier
- Limitation du nombre et de la taille
- Authentification requise
- Propriétaire du bien vérifié

✅ Expérience utilisateur :
- Aperçu des fichiers sélectionnés
- Boutons pour supprimer les photos avant soumission
- Messages de succès/erreur clairs
- Statut "Envoi..." pendant la soumission

