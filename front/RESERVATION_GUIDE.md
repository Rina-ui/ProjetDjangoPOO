# 📋 Guide : Créer une Réservation dans Postman

## 🎯 Champs pour créer une réservation

### Champs obligatoires

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| **bien** | integer (ID) | ID du bien immobilier | 1 |
| **locataire** | integer (ID) | ID du locataire | 1 |
| **date_debut** | date (YYYY-MM-DD) | Date de début de réservation | "2026-03-25" |
| **date_fin** | date (YYYY-MM-DD) | Date de fin de réservation | "2026-04-25" |

### Champs optionnels

| Champ | Type | Description | Défaut | Exemple |
|-------|------|-------------|--------|---------|
| **message** | string | Message du locataire | (vide) | "Intéressé par ce bien" |
| **statut** | string (enum) | État de la réservation | "EN_ATTENTE" | "EN_ATTENTE" |

### Valeurs possibles pour statut

```
"EN_ATTENTE"    - En attente de confirmation
"CONFIRMEE"     - Confirmée par le propriétaire
"ANNULEE"       - Annulée
"TERMINEE"      - Terminée
```

### Champs auto-générés (ne pas inclure)

```
date_creation     - Généré automatiquement
date_modification - Généré automatiquement
id                - Généré automatiquement
```

---

## 📝 Payload JSON minimal

```json
{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25"
}
```

---

## 📝 Payload JSON complet

```json
{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Je suis intéressé par ce bien, peut-on discuter des conditions ?",
    "statut": "EN_ATTENTE"
}
```

---

## 🧪 Test Postman - Création basique

### Étape 1 : Configurer la requête

**Méthode :** `POST`

**URL :**
```
http://127.0.0.1:8000/api/reservations/
```

**Headers :**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Étape 2 : Body (raw - JSON)

```json
{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Test de réservation"
}
```

### Étape 3 : Send

**Réponse attendue (201 Created) :**

```json
{
    "id": 1,
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Test de réservation",
    "statut": "EN_ATTENTE",
    "date_creation": "2026-03-25T12:00:00Z",
    "date_modification": "2026-03-25T12:00:00Z"
}
```

---

## 🧪 Test Postman - Avec tous les champs

### Body

```json
{
    "bien": 2,
    "locataire": 3,
    "date_debut": "2026-04-01",
    "date_fin": "2026-05-01",
    "message": "Réservation complète avec tous les paramètres",
    "statut": "EN_ATTENTE"
}
```

---

## ⚠️ Validations du modèle

Le modèle applique automatiquement ces validations :

### 1️⃣ Date de fin ≥ Date de début

```
❌ Invalide
{
    "date_debut": "2026-04-25",
    "date_fin": "2026-03-25"
}

Erreur :
{
    "date_fin": ["La date de fin doit etre superieure ou egale a la date de debut."]
}
```

### 2️⃣ Bien ne doit pas être déjà loué

```
❌ Invalide si le bien a statut = "LOUE"
{
    "bien": 99,  // Ce bien est déjà loué
    ...
}

Erreur :
{
    "bien": ["Ce bien est deja loue et ne peut pas etre reserve."]
}
```

### 3️⃣ Pas de conflits de dates

```
❌ Invalide s'il y a déjà une réservation pour les mêmes dates
{
    "bien": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25"
}

(S'il existe déjà une réservation du 2026-03-20 au 2026-03-30)

Erreur :
{
    "non_field_errors": ["Une reservation existe deja sur cette periode pour ce bien."]
}
```

### 4️⃣ Bien et locataire doivent exister

```
❌ Invalide
{
    "bien": 99999,  // N'existe pas
    "locataire": 1
}

Erreur :
{
    "bien": ["Invalid pk \"99999\" - object does not exist."]
}
```

---

## 🧪 Scénarios de test complets

### Scénario 1 : Réservation valide simple

**Avant :** Vérifier que vous avez un bien et un locataire

```bash
# 1. Vérifier les biens
curl -X GET http://127.0.0.1:8000/api/biens/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Vérifier les locataires
curl -X GET http://127.0.0.1:8000/api/locataires/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Créer la réservation :**

```bash
curl -X POST http://127.0.0.1:8000/api/reservations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25"
  }'
```

### Scénario 2 : Réservation avec message

```bash
curl -X POST http://127.0.0.1:8000/api/reservations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-04-26",
    "date_fin": "2026-05-25",
    "message": "Très intéressé, peut-on visiter le bien ?"
  }'
```

### Scénario 3 : Réservation rejetée (dates inversées)

```bash
curl -X POST http://127.0.0.1:8000/api/reservations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-05-25",
    "date_fin": "2026-04-26"
  }'

# Réponse attendue : 400 Bad Request
# {
#     "date_fin": ["La date de fin doit etre superieure ou egale a la date de debut."]
# }
```

### Scénario 4 : Réservation avec statut

```bash
curl -X POST http://127.0.0.1:8000/api/reservations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-05-26",
    "date_fin": "2026-06-25",
    "statut": "EN_ATTENTE"
  }'
```

---

## 🔍 Vérifier les réservations créées

### Lister toutes les réservations

```bash
curl -X GET http://127.0.0.1:8000/api/reservations/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Récupérer une réservation spécifique

```bash
curl -X GET http://127.0.0.1:8000/api/reservations/1/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Réponse attendue

```json
{
    "id": 1,
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Test de réservation",
    "statut": "EN_ATTENTE",
    "date_creation": "2026-03-25T12:00:00Z",
    "date_modification": "2026-03-25T12:00:00Z"
}
```

---

## 🧪 Collection Postman (prête à importer)

### URL de base

```
{{base_url}}/api/reservations/
```

### Variables Postman

```
base_url: http://127.0.0.1:8000
token: YOUR_BEARER_TOKEN
bien_id: 1
locataire_id: 1
```

### Requête 1 : Créer une réservation

**Méthode :** POST
**URL :** `{{base_url}}/api/reservations/`
**Auth :** Bearer `{{token}}`
**Body :**
```json
{
    "bien": {{bien_id}},
    "locataire": {{locataire_id}},
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Test depuis Postman"
}
```

### Requête 2 : Lister les réservations

**Méthode :** GET
**URL :** `{{base_url}}/api/reservations/`
**Auth :** Bearer `{{token}}`

### Requête 3 : Récupérer une réservation

**Méthode :** GET
**URL :** `{{base_url}}/api/reservations/1/`
**Auth :** Bearer `{{token}}`

### Requête 4 : Modifier une réservation

**Méthode :** PATCH
**URL :** `{{base_url}}/api/reservations/1/`
**Auth :** Bearer `{{token}}`
**Body :**
```json
{
    "statut": "CONFIRMEE",
    "message": "Réservation confirmée"
}
```

### Requête 5 : Supprimer une réservation

**Méthode :** DELETE
**URL :** `{{base_url}}/api/reservations/1/`
**Auth :** Bearer `{{token}}`

---

## ✅ Checklist avant de tester

- [ ] Django backend en local (`python manage.py runserver`)
- [ ] Un bien existe en base (ID connu)
- [ ] Un locataire existe en base (ID connu)
- [ ] Token d'authentification valide
- [ ] Postman installé et configuré
- [ ] Dates de réservation valides (fin ≥ début)

---

## 🐛 Erreurs courantes

### Erreur 1 : 401 Unauthorized

```
{
    "detail": "Authentication credentials were not provided."
}
```

**Solution :**
- Ajouter le header `Authorization: Bearer YOUR_TOKEN`
- Vérifier que le token est valide

### Erreur 2 : 404 Not Found - Bien invalide

```
{
    "bien": ["Invalid pk \"99\" - object does not exist."]
}
```

**Solution :**
- Vérifier que le bien existe : `GET /api/biens/`
- Utiliser un ID valide

### Erreur 3 : 404 Not Found - Locataire invalide

```
{
    "locataire": ["Invalid pk \"99\" - object does not exist."]
}
```

**Solution :**
- Vérifier que le locataire existe : `GET /api/locataires/`
- Utiliser un ID valide

### Erreur 4 : 400 Bad Request - Dates inversées

```
{
    "date_fin": ["La date de fin doit etre superieure ou egale a la date de debut."]
}
```

**Solution :**
- Vérifier que `date_fin` ≥ `date_debut`
- Format : `YYYY-MM-DD`

### Erreur 5 : 400 Bad Request - Bien déjà loué

```
{
    "bien": ["Ce bien est deja loue et ne peut pas etre reserve."]
}
```

**Solution :**
- Choisir un bien avec statut ≠ "LOUE"
- Vérifier le statut du bien

### Erreur 6 : 400 Bad Request - Conflit de dates

```
{
    "non_field_errors": ["Une reservation existe deja sur cette periode pour ce bien."]
}
```

**Solution :**
- Choisir une autre période
- Ou confirmer/annuler la réservation existante

---

## 📊 Exemple de réservation complète

### Création

```json
POST /api/reservations/

{
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Je souhaite réserver ce bien pour une durée d'un mois."
}
```

### Réponse (201 Created)

```json
{
    "id": 1,
    "bien": 1,
    "locataire": 1,
    "date_debut": "2026-03-25",
    "date_fin": "2026-04-25",
    "message": "Je souhaite réserver ce bien pour une durée d'un mois.",
    "statut": "EN_ATTENTE",
    "date_creation": "2026-03-25T12:00:00.123456Z",
    "date_modification": "2026-03-25T12:00:00.123456Z"
}
```

---

## 🔄 Cycle de vie d'une réservation

```
1. Créer → statut = "EN_ATTENTE"
          ↓
2. Propriétaire confirme → statut = "CONFIRMEE"
          ↓
3. Locataire confirme occupance → statut = "TERMINEE"
          
OU

2. Annuler à tout moment → statut = "ANNULEE"
```

---

## 📈 Résumé

| Action | Méthode | Endpoint | Body |
|--------|---------|----------|------|
| Créer | POST | `/api/reservations/` | JSON avec bien, locataire, dates |
| Lister | GET | `/api/reservations/` | - |
| Détail | GET | `/api/reservations/1/` | - |
| Modifier | PATCH | `/api/reservations/1/` | JSON partiel |
| Supprimer | DELETE | `/api/reservations/1/` | - |

---

## 🎯 À retenir

✅ **Champs obligatoires :** bien, locataire, date_debut, date_fin
✅ **Format des dates :** YYYY-MM-DD
✅ **Statut par défaut :** EN_ATTENTE
✅ **Validations :** dates cohérentes, pas de conflits
✅ **Authentification :** Bearer token requis

Bon testing ! 🚀

