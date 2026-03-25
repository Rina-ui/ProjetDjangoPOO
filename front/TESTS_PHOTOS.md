# Tests : Système d'upload de photos

## 🧪 Tests unitaires (Frontend)

### Test 1 : Validation des fichiers

```typescript
describe('AddBienForm - Photo Validation', () => {
    it('devrait rejeter les fichiers non-image', () => {
        const form = render(<AddBienForm {...props} />);
        const input = form.getByDisplayValue(/Photos depuis votre PC/);
        
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        fireEvent.change(input, { target: { files: [file] } });
        
        expect(form.getByText(/Formats autorises/)).toBeInTheDocument();
    });

    it('devrait rejeter les fichiers > 5 Mo', () => {
        const form = render(<AddBienForm {...props} />);
        const input = form.getByDisplayValue(/Photos depuis votre PC/);
        
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        fireEvent.change(input, { target: { files: [largeFile] } });
        
        expect(form.getByText(/Une photo depasse 5 Mo/)).toBeInTheDocument();
    });

    it('devrait limiter à 10 photos', () => {
        const form = render(<AddBienForm {...props} />);
        const input = form.getByDisplayValue(/Photos depuis votre PC/);
        
        const files = Array(11).fill(null).map((_, i) => 
            new File(['x'], `photo${i}.jpg`, { type: 'image/jpeg' })
        );
        fireEvent.change(input, { target: { files } });
        
        expect(form.getByText(/Maximum 10 photos/)).toBeInTheDocument();
    });
});
```

### Test 2 : Flux de création et upload

```typescript
describe('AddBienForm - Create and Upload Flow', () => {
    it('devrait créer le bien puis uploader les photos', async () => {
        const mockCreateBien = jest.fn();
        const mockUploadPhotos = jest.fn();
        
        jest.mock('../services/biens', () => ({
            createBien: mockCreateBien,
            uploadBienPhotos: mockUploadPhotos,
            extractCreatedBienId: (data) => data?.id
        }));

        const form = render(<AddBienForm {...props} />);
        
        // Remplir le formulaire
        fireEvent.change(form.getByLabelText(/Adresse/), {
            target: { value: 'Lomé, Agoè' }
        });
        
        // Ajouter une photo
        const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
        const input = form.getByDisplayValue(/Photos depuis votre PC/);
        fireEvent.change(input, { target: { files: [file] } });
        
        // Soumettre
        fireEvent.click(form.getByText(/Enregistrer le bien/));
        
        // Vérifier les appels
        await waitFor(() => {
            expect(mockCreateBien).toHaveBeenCalledWith(
                expect.objectContaining({
                    adresse: 'Lomé, Agoè',
                    photos: []  // Photos vides lors de la création
                })
            );
        });

        await waitFor(() => {
            expect(mockUploadPhotos).toHaveBeenCalledWith(5, [file]);
        });
    });
});
```

---

## 🔗 Tests d'intégration

### Test 1 : Créer un bien et uploader une photo

```bash
#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:8000/api"
TOKEN="your_bearer_token"
PHOTO_PATH="test_photo.jpg"

# 1. Créer un bien
echo "🔹 Créer un bien..."
BIEN_RESPONSE=$(curl -s -X POST "$API_URL/biens/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proprietaire": 1,
    "categorie": 1,
    "type_bien": 1,
    "adresse": "Test",
    "description": "Test Property",
    "photos": [],
    "equipements": ["Test"],
    "loyer_hc": 100000,
    "charges": 10000,
    "statut": "VACANT"
  }')

BIEN_ID=$(echo $BIEN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Bien créé avec ID: $BIEN_ID"

# 2. Uploader une photo
echo "🔹 Uploader une photo..."
UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/biens/$BIEN_ID/upload-photos/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photos=@$PHOTO_PATH")

PHOTO_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Photo uploadée avec ID: $PHOTO_ID"

# 3. Vérifier que la photo est bien liée
echo "🔹 Vérifier le bien..."
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/biens/$BIEN_ID/" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Vérification:"
echo $VERIFY_RESPONSE | jq '.photos_files'
```

### Test 2 : Filtrer les biens d'un propriétaire

```bash
#!/bin/bash

TOKEN="your_bearer_token"
PROPRIETAIRE_ID=1

# Récupérer les biens du propriétaire
curl -s -X GET "http://127.0.0.1:8000/api/biens/?proprietaire=$PROPRIETAIRE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## ✅ Tests manuels (Frontend)

### Test 1 : Ajouter un bien avec une photo

**Étapes :**
1. Naviguer vers ProprioDashboard
2. Cliquer sur "Ajouter un bien"
3. Remplir le formulaire :
   - Catégorie: Résidentiel
   - Type: Appartements
   - Adresse: Lomé, Agoè
   - Description: Belle maison
   - Équipements: Climatisation, Wifi
   - Loyer: 100000
   - Charges: 10000
4. Sélectionner une photo (JPG, PNG, WEBP, < 5 Mo)
5. Cliquer "Enregistrer le bien"

**Résultats attendus :**
- ✅ Message "Bien ajoute avec succes."
- ✅ Le formulaire se ferme
- ✅ La liste des biens se réactualise
- ✅ Le bien apparaît dans la liste
- ✅ La photo s'affiche à côté du bien

**Logs console attendus :**
```
[POST /api/biens/] payload: {...}
[POST /api/biens/] response: {id: 5, ...}
[POST /api/biens/] created id: 5
[POST /api/biens/{id}/upload-photos/] files: ["photo.jpg"]
```

### Test 2 : Rejeter un fichier invalide

**Étapes :**
1. Cliquer sur le champ photos
2. Sélectionner un fichier PDF

**Résultats attendus :**
- ✅ Message d'erreur : "Formats autorises: JPG, PNG, WEBP."
- ✅ Le fichier n'est pas ajouté à la liste

### Test 3 : Ajouter plusieurs photos

**Étapes :**
1. Sélectionner 3 photos (photo1.jpg, photo2.jpg, photo3.jpg)
2. Vérifier qu'elles apparaissent dans la liste
3. Supprimer photo2 en cliquant sur le "x"
4. Soumettre le formulaire

**Résultats attendus :**
- ✅ Initialement 3 photos affichées
- ✅ Après suppression, 2 photos affichées
- ✅ Seules 2 photos sont uploadées

### Test 4 : Afficher les photos dans la liste

**Étapes :**
1. Créer un bien avec une photo
2. Retourner à la liste des biens
3. Vérifier que la photo s'affiche

**Résultats attendus :**
- ✅ Photo visible dans la liste
- ✅ Image s'affiche correctement
- ✅ Clickable et fullscreen (optionnel)

---

## 🔍 Tests de debugging

### Activer les logs détaillés

**Dans la console navigateur :**

```typescript
// Remplacer le service API pour logger toutes les requêtes
import api from './services/api';

const originalRequest = api.interceptors.request.use;
api.interceptors.request.use((config) => {
    console.log('🔵 REQUEST:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
        data: config.data ? JSON.parse(JSON.stringify(config.data)) : null
    });
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log('🟢 RESPONSE:', {
            status: response.status,
            url: response.config.url,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('🔴 ERROR:', {
            status: error.response?.status,
            url: error.config?.url,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);
```

### Vérifier les fichiers uploadés

**Terminal Django :**

```bash
# Voir les fichiers uploadés
ls -lh media/biens/

# Sortie attendue
# -rw-r--r-- 1 user group 256K Mar 25 12:00 photo1_abc123.jpg
# -rw-r--r-- 1 user group 128K Mar 25 12:00 photo2_def456.jpg
```

### Vérifier la base de données

**Terminal Django :**

```bash
python manage.py shell

# Vérifier les photos
from patrimoine.models import PhotoBien, Bien
photos = PhotoBien.objects.filter(bien_id=5)
for photo in photos:
    print(f"ID: {photo.id}, File: {photo.image.name}, URL: {photo.image.url}")
```

---

## 📊 Performance

### Test de performance : Upload 10 photos

**Scénario :**
- 10 photos de 1 Mo chacune
- Connexion réseau : 10 Mbps

**Résultats attendus :**
- ✅ Création du bien : < 1 seconde
- ✅ Upload photos : 10-15 secondes (10 Mo ÷ 10 Mbps)
- ✅ Total : < 20 secondes

**Vérification :**

```typescript
// Mesurer le temps
console.time('Total');

console.time('Create Bien');
const createResponse = await createBien(payload);
console.timeEnd('Create Bien');

console.time('Upload Photos');
await uploadBienPhotos(bienId, files);
console.timeEnd('Upload Photos');

console.timeEnd('Total');
```

---

## 🐛 Debugging des erreurs

### Erreur : 400 Bad Request

```bash
# 1. Vérifier la requête
curl -v -X POST http://127.0.0.1:8000/api/biens/5/upload-photos/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "photos=@photo.jpg" 2>&1 | grep -A20 "< HTTP"

# 2. Vérifier les logs Django
tail -f logs/django.log | grep "400\|ERROR"

# 3. Vérifier la console
# Chercher les logs dans le navigateur
```

### Erreur : 401 Unauthorized

```typescript
// 1. Vérifier le token
const token = localStorage.getItem("auth_token");
console.log("Token exists:", !!token);
console.log("Token:", token);

// 2. Vérifier que le token est envoyé
// (Voir les headers dans Network tab)

// 3. Vérifier que le token est valide
// Décoder le JWT
import jwt_decode from 'jwt-decode';
try {
    const decoded = jwt_decode(token);
    console.log("Token decoded:", decoded);
} catch (e) {
    console.error("Token invalide:", e);
}
```

### Erreur : 403 Forbidden

```bash
# 1. Vérifier l'ownership
curl -s -X POST http://127.0.0.1:8000/api/biens/5/upload-photos/ \
  -H "Authorization: Bearer $WRONG_USER_TOKEN" \
  -F "photos=@photo.jpg"

# 2. S'assurer que vous êtes le propriétaire du bien
python manage.py shell
from patrimoine.models import Bien
from utilisateurs.models import Utilisateur
bien = Bien.objects.get(id=5)
print(f"Bien property owner: {bien.proprietaire.utilisateur.id}")
print(f"Your user ID: {YOUR_USER_ID}")
```

---

## 📋 Checklist finale

Avant de considérer le système comme prêt :

### Backend
- [ ] Modèle PhotoBien créé
- [ ] Serializer PhotoBien créé
- [ ] BienSerializer inclut photos_files
- [ ] Action upload-photos dans BienViewSet
- [ ] Permissions vérifiées
- [ ] MEDIA_URL et MEDIA_ROOT configurés
- [ ] Migrations appliquées
- [ ] Tests passent

### Frontend
- [ ] Service createBien() fonctionne
- [ ] Service uploadBienPhotos() fonctionne
- [ ] Formulaire valide les fichiers
- [ ] Flux créer → upload marche
- [ ] Erreurs gérées et affichées
- [ ] Logs consoledétaillés
- [ ] Tests passent

### Intégration
- [ ] Créer un bien via Frontend ✅
- [ ] Photos uploadées ✅
- [ ] Photos visibles en GET ✅
- [ ] Photos affichées dans la liste ✅
- [ ] Performance acceptable ✅
- [ ] Erreurs gérées ✅


