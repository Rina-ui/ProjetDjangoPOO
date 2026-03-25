# Guide complet : Flux d'enregistrement d'un bien avec photos

## 🎬 Scénario complet

Un propriétaire (ID: 1) se connecte et veut créer un bien avec 2 photos.

---

## 📊 Flux détaillé avec logs

### Phase 1 : Sélection et préparation des données

**Frontend - AddBienForm.tsx**

```typescript
// Utilisateur remplit le formulaire
const formData = {
    categorie: 1,      // Résidentiel
    typeBien: 2,       // Appartements
    adresse: "Lomé, Agoè",
    description: "Belle maison avec jardin",
    equipements: ["Climatisation", "Wifi", "Parking"],
    photosFiles: [File1 (photo1.jpg), File2 (photo2.jpg)],
    loyerHc: 100000,
    charges: 10000,
    statut: "VACANT"
}

// Utilisateur clique sur "Enregistrer le bien"
// handleSubmit() s'exécute
```

### Phase 2 : Création du bien

**Console Frontend :**
```
[POST /api/biens/] payload: {
    proprietaire: 1,
    categorie: 1,
    type_bien: 2,
    adresse: "Lomé, Agoè",
    description: "Belle maison avec jardin",
    photos: [],                           // Array vide
    equipements: ["Climatisation", "Wifi", "Parking"],
    loyer_hc: 100000,
    charges: 10000,
    statut: "VACANT"
}
```

**Requête HTTP :**
```http
POST http://127.0.0.1:8000/api/biens/ HTTP/1.1
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 2,
    "adresse": "Lomé, Agoè",
    "description": "Belle maison avec jardin",
    "photos": [],
    "equipements": ["Climatisation", "Wifi", "Parking"],
    "loyer_hc": 100000,
    "charges": 10000,
    "statut": "VACANT"
}
```

**Terminal Django :**
```
[25/Mar/2026 12:00:00] "POST /api/biens/ HTTP/1.1" 201 Created
```

**Réponse Backend :**
```json
{
    "id": 5,
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 2,
    "adresse": "Lomé, Agoè",
    "description": "Belle maison avec jardin",
    "photos": [],
    "photos_files": [],
    "equipements": ["Climatisation", "Wifi", "Parking"],
    "loyer_hc": "100000.00",
    "charges": "10000.00",
    "statut": "VACANT",
    "en_ligne": false,
    "latitude": null,
    "longitude": null,
    "date_creation": "2026-03-25T12:00:00Z",
    "date_modification": "2026-03-25T12:00:00Z"
}
```

**Console Frontend :**
```
[POST /api/biens/] response: { id: 5, proprietaire: 1, ... }
[POST /api/biens/] created id: 5
```

### Phase 3 : Upload des photos

**Frontend - Préparation du multipart**

```typescript
const formData = new FormData();
formData.append("photos", File1);  // photo1.jpg
formData.append("photos", File2);  // photo2.jpg

// Axios va automatiquement ajouter :
// Content-Type: multipart/form-data; boundary=----...
```

**Console Frontend :**
```
[POST /api/biens/{id}/upload-photos/] files: ["photo1.jpg", "photo2.jpg"]
```

**Requête HTTP :**
```http
POST http://127.0.0.1:8000/api/biens/5/upload-photos/ HTTP/1.1
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="photos"; filename="photo1.jpg"
Content-Type: image/jpeg

[binary data...]
------WebKitFormBoundary...
Content-Disposition: form-data; name="photos"; filename="photo2.jpg"
Content-Type: image/jpeg

[binary data...]
------WebKitFormBoundary...--
```

**Terminal Django :**
```
[25/Mar/2026 12:00:01] "POST /api/biens/5/upload-photos/ HTTP/1.1" 201 Created
```

**Réponse Backend :**
```json
[
    {
        "id": 1,
        "image": "/media/biens/photo1_abc123.jpg",
        "date_creation": "2026-03-25T12:00:01Z"
    },
    {
        "id": 2,
        "image": "/media/biens/photo2_def456.jpg",
        "date_creation": "2026-03-25T12:00:01Z"
    }
]
```

### Phase 4 : Succès et affichage

**Console Frontend :**
```
Bien ajoute avec succes.
```

**Interface Utilisateur :**
```
✅ Message vert : "Bien ajoute avec succes."
Le formulaire se ferme
La liste des biens se réactualise
```

---

## 🔍 Détails techniques

### Headers importants

**Authentification :**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Content-Type (créer bien) :**
```http
Content-Type: application/json
```

**Content-Type (upload photos) :**
```http
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

### Clés importantes

| Élément | Clé | Format |
|---------|-----|--------|
| Identifiant du bien | `id` | number |
| Propriétaire | `proprietaire` | number (ID) |
| Catégorie | `categorie` | number (ID) |
| Type de bien | `type_bien` | number (ID) |
| Photos (métadonnées) | `photos` | array JSON |
| Photos (fichiers) | `photos_files` | relation Django |
| Équipements | `equipements` | array JSON |
| Statut | `statut` | string enum |

---

## 📦 Structure des réponses

### GET /api/biens/5/ (lecture)

```json
{
    "id": 5,
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 2,
    "adresse": "Lomé, Agoè",
    "description": "Belle maison avec jardin",
    "photos": [],
    "photos_files": [
        {
            "id": 1,
            "image": "http://127.0.0.1:8000/media/biens/photo1.jpg",
            "date_creation": "2026-03-25T12:00:01Z"
        },
        {
            "id": 2,
            "image": "http://127.0.0.1:8000/media/biens/photo2.jpg",
            "date_creation": "2026-03-25T12:00:01Z"
        }
    ],
    "equipements": ["Climatisation", "Wifi", "Parking"],
    "loyer_hc": "100000.00",
    "charges": "10000.00",
    "statut": "VACANT",
    "en_ligne": false,
    "date_creation": "2026-03-25T12:00:00Z",
    "date_modification": "2026-03-25T12:00:00Z"
}
```

---

## 🛠️ Gestion des erreurs

### Erreur : "Clé primaire « 1 » non valide"

**Symptôme :**
```
{proprietaire: ["Clé primaire « 1 » non valide - l'objet n'existe pas."]}
```

**Causes possibles :**
- Le propriétaire (ID 1) n'existe pas en base
- L'ID du propriétaire n'est pas correct
- L'utilisateur n'a pas de profil propriétaire

**Solution :**
```typescript
// Vérifier que le propriétaire existe
const proprietaires = await api.get('proprietaires/?utilisateur=' + userId);
console.log(proprietaires.data);  // Doit retourner au moins 1 item
```

### Erreur : "photos: La valeur doit être un JSON valide"

**Symptôme :**
```
{photos: ["La valeur doit être un JSON valide."]}
```

**Causes possibles :**
- Vous envoyez les photos dans le premier POST
- Format JSON incorrect

**Solution :**
```typescript
// ✅ Correct
photos: []  // Array JSON

// ❌ Incorrect
photos: ["file1.jpg"]  // Les fichiers ne vont pas en JSON
photos: new FormData()  // FormData n'est pas JSON
```

### Erreur : "Aucun fichier reçu"

**Symptôme :**
```
{detail: "Aucun fichier reçu"}
```

**Causes possibles :**
- Aucun fichier n'a été sélectionné
- La clé multipart n'est pas "photos"
- Le formulaire n'a pas été envoyé correctement

**Solution :**
```typescript
// ✅ Correct
formData.append("photos", file1);
formData.append("photos", file2);

// ❌ Incorrect
formData.append("image", file1);
formData.append("file", file2);
```

### Erreur : "Non autorisé"

**Symptôme :**
```
{detail: "Vous n'êtes pas autorisé à ajouter des photos à ce bien"}
```

**Causes possibles :**
- L'utilisateur n'est pas le propriétaire du bien
- Token d'authentification invalide ou expiré

**Solution :**
```typescript
// Vérifier que vous êtes connecté
const token = localStorage.getItem("auth_token");
console.log("Token:", token);

// Vérifier que vous êtes le propriétaire
// Dans le AddBienForm, proprietaireId doit correspondre au bien
```

---

## 💻 Test local complet

### 1. Préparer les données

```bash
# Terminal Django
python manage.py shell

# Vérifier un utilisateur existe
from utilisateurs.models import Utilisateur, Proprietaire
user = Utilisateur.objects.get(id=1)
print(f"Utilisateur: {user.username} ({user.role})")

# Créer un propriétaire s'il n'existe pas
proprio = Proprietaire.objects.get(utilisateur_id=1)
print(f"Propriétaire: {proprio.nom} {proprio.prenom}")
```

### 2. Tester l'API (cURL)

```bash
# Token JWT (si vous utilisez JWT)
TOKEN="votre_token_ici"

# Créer un bien
curl -X POST http://127.0.0.1:8000/api/biens/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 1,
    "adresse": "Test Address",
    "description": "Test",
    "photos": [],
    "equipements": [],
    "loyer_hc": 100000,
    "charges": 10000,
    "statut": "VACANT"
  }'

# Réponse attendue (notez l'ID)
# {"id": 5, ...}

# Uploader une photo (remplacer 5 par l'ID reçu)
curl -X POST http://127.0.0.1:8000/api/biens/5/upload-photos/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "photos=@photo1.jpg"
```

### 3. Tester depuis le Frontend

```typescript
// Dans la console du navigateur
import { login } from './services/auth';
import { createBien, uploadBienPhotos } from './services/biens';

// Se connecter
const user = await login("leo389176@gmail.com", "123456");
console.log("User:", user);

// Récupérer le propriétaire ID
const proprietaires = await fetch('http://127.0.0.1:8000/api/proprietaires/?utilisateur=' + user.id)
  .then(r => r.json());
const proprietaireId = proprietaires[0]?.id;

// Créer un bien
const bienResponse = await createBien({
    proprietaire: proprietaireId,
    categorie: 1,
    type_bien: 1,
    adresse: "Test",
    description: "Test",
    photos: [],
    equipements: [],
    loyer_hc: 100000,
    charges: 10000,
    statut: "VACANT"
});
const bienId = bienResponse.data.id;
console.log("Bien créé:", bienId);

// Uploader une photo
// Créer un input file temporaire
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = async (e) => {
    const file = e.target.files[0];
    const result = await uploadBienPhotos(bienId, [file]);
    console.log("Upload résultat:", result.data);
};
input.click();
```

---

## 📋 Checklist de vérification

- [ ] Le bien est créé avec ID correct
- [ ] L'ID du bien est extrait correctement
- [ ] Les photos sont uploadées avec la bonne clé "photos"
- [ ] Les fichiers sont bien envoyés en multipart
- [ ] La base de données a enregistré les photos
- [ ] Les photos apparaissent dans la réponse GET
- [ ] Les fichiers sont sauvegardés dans /media/biens/
- [ ] L'URL de la photo est correcte
- [ ] L'image s'affiche dans le navigateur

---

## 🎓 Apprentissage clé

1. **Séparation des requêtes** : Toujours créer l'entité avant d'uploader les fichiers
2. **Multipart** : Pour les fichiers, pas pour du JSON
3. **Authentification** : Token Bearer dans les headers
4. **Validation** : Frontend et Backend ensemble
5. **Logs** : Console importante pour le debugging


