# 🏠 API Gestion Immobilière (Django REST)

API complète pour la gestion de biens immobiliers, locataires, paiements, quittances et demandes.

---

# 🚀 Installation

```bash
git clone <repo>
cd projet
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

# ⚙️ Configuration importante

Dans `settings.py` :

```python
AUTH_USER_MODEL = 'utilisateurs.Utilisateur'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

---

# 📦 Technologies utilisées

* Django
* Django REST Framework
* ReportLab (PDF)
* SMTP / MailHog (email)

---

# 🌐 Base URL

```
http://127.0.0.1:8000/api/
```

---

# 📌 ENDPOINTS PRINCIPAUX

---

## 👤 Utilisateurs

### ➤ Créer un utilisateur
-----------------------------------
```
POST http://127.0.0.1:8000/api/utilisateurs/
```

```json
{
  "username": "leo",
  "password": "123456",
  "role": "ADMIN"
}
```
### ➤ Liste des utilisateurs
GET http://127.0.0.1:8000/api/utilisateurs/

### ➤ Modifier un utilisateur
PUT/ PATCH http://127.0.0.1:8000/api/utilisateurs/2/
---------------------------------------


## 👤 Locataires


### ➤ Créer un Locataire
POST http://127.0.0.1:8000/api/locataires/
{
  "utilisateur": 1,
  "nom": "Doe",
  "prenom": "John",
  "email": "john@email.com",
  "telephone": "90000000"
}

### ➤ Liste des locataires
GET http://127.0.0.1:8000/api/locataires/
```

### ➤ Modifier un locataire
PUT/ PATCH http://127.0.0.1:8000/api/locataires/2/
----------------------------------

## 🏢 Propriétaires


### ➤ Créer un Propriétaire
```
POST http://127.0.0.1:8000/api/proprietaires/
{
  "utilisateur": 1,
  "nom": "Doe",
  "prenom": "John",
  "email": "john@email.com",
  "telephone": "90000000"
}

### ➤ Liste des proprietaires
GET http://127.0.0.1:8000/api/proprietaires/
```

### ➤ Modifier un proprietaire
PUT/ PATCH http://127.0.0.1:8000/api/proprietaires/2/
---------------------------------------------------

## 🏠 Catégories

```
POST /api/categories/
{
    "nom": "Résidentiel",
    "description": "Biens pour habitation"
}


GET /api/categories/
```

----------------------------------------------------------

## 🏘️ Types de bien

```
POST http://127.0.0.1:8000/api/types-bien/
{
    "categorie": 1,
    "nom": "Appartement",
    "description": "Appartement moderne"
}


GET http://127.0.0.1:8000/api/types-bien/
```

-------------------------------------------------

## 🏡 Biens

### ➤ Créer un bien

```
POST http://127.0.0.1:8000/api/biens/
```

```json
{
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
}
```
### ➤ liste des biens
GET http://127.0.0.1:8000/api/biens/

----------------------------------------------------------------

### 🔥 Endpoints personnalisés (Biens)

#### Mettre en ligne

```
POST /api/biens/{id}/mettre_en_ligne/
```
---------------------------------------------------
#### Changer statut

```
POST /api/biens/{id}/changer_statut/
```

```json
{
  "statut": "LOUE"
}
```

#### Calculer loyer total

```
GET /api/biens/{id}/loyer_total/
```

------------------------------------------------------------------

## 📄 Baux

```
POST http://127.0.0.1:8000/api/baux/
{
    "bien": 1,
    "locataire": 1,
    "date_entree": "2026-03-20",
    "loyer_initial": 75000,
    "depot_garantie": 150000,
    "taux_revision": 5,
    "actif": true
}

GET http://127.0.0.1:8000/api/baux/
```

### 🔥 Actions

#### Résilier

```
POST /api/baux/{id}/resilier/
```
------------------------------------------------------

## 💰 Paiements

```
POST /api/paiements/
{
    "bail": 1,
    "montant": 50000,
    "date_paiement": "2026-03-20",
    "methode": "ESPECES",
    "statut": "VALIDE"
}


GET /api/paiements/
```

---------------------------------------------------------------

## 📊 Dépenses

```
POST /api/depenses/
{
    "bien": 1,
    "type_depense": "TRAVAUX",
    "montant": 20000,
    "date_depense": "2026-03-20",
    "description": "Réparation plomberie"
}


GET /api/depenses/
```

--------------------------------------------------------------------

## 🧾 Quittances

### ➤ Créer

```
POST /api/quittances/
```

```json
{
  "paiement": 1
}
```

-----------------------------------------------------------------

### 🔥 Endpoints personnalisés

#### Générer PDF

```
POST /api/quittances/{id}/generer_pdf/
```

#### Envoyer par email

```
POST /api/quittances/{id}/envoyer/
```

---------------------------------------------------------------------

## 📩 Demandes

### ➤ Créer

```
POST /api/demandes/
```
{
    "proprietaire": 1,
    "sujet": "Mise en ligne bien",
    "message": "Je veux publier mon bien",
    "type_demande": "MISE_EN_LIGNE"
}

-------------------------------------------------------

### 🔥 Actions

#### Traiter

```
POST /api/demandes/{id}/traiter/
```

```json
{
  "reponse": "Validée"
}
```
------------------------------------------
#### Rejeter

```
POST /api/demandes/{id}/rejeter/
```

```json
{
  "raison": "Dossier incomplet"
}
```
----------------------------------------------------


#### Creer une conversation en tant que locataire

```
http://127.0.0.1:8000/api/conversations/
```

```json
{
  "property_id": 1,
  "owner_id": 2
}
```

----------------------------------------------------

#### Creer une conversation en tant que Proprio

```
http://127.0.0.1:8000/api/conversations/
```

```json
{
  "property_id": 1,
  "locataire_id": 2
}
```
-----------------------------------------------------------------

#### Creer une message en tant que loc

```
http://127.0.0.1:8000/api/conversations/2/messages/
```

```json
{
  "text": "est disponible"
}
```
----------------------------------------------------
#### Creer une message en tant que proprio

```
http://127.0.0.1:8000/api/conversations/2/messages/
```

```json
{
  "text": "oui c disponible"
}
```
----------------------------------------------------
#### mettre  une conversation comme lu

```
http://127.0.0.1:8000/api/conversations/2/read/```

```json
{
  "text": "oui c disponible"
}
```
----------------------------------------------------
---



👉 Accès : http://localhost:8025

---

## Option  (Production) - Gmail

```python
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'email@gmail.com'
EMAIL_HOST_PASSWORD = 'mot_de_passe_application'
```

---

# 📄 Génération PDF

Les quittances sont générées avec ReportLab :

```
media/quittances/
```

---

# ⚠️ Pièges à éviter

* ❌ Un seul paiement = une seule quittance (OneToOne)
* ❌ Ne pas envoyer email sans PDF
* ❌ Vérifier les ForeignKey (ID existants)
* ❌ Respecter les choix (statut, rôle, etc.)
* ❌ Vérifier format date (YYYY-MM-DD)
* ❌ JSONField doit être une liste

---

# 🔒 Sécurité (à améliorer)

* Ajouter authentification (JWT)
* Restreindre accès (admin/propriétaire)
* Valider les données côté serializer

---

# 🔥 Bonus

* Génération automatique quittance après paiement
* Logs avec AuditLog
* Envoi email automatique

---

# 📬 Test avec Postman

1. Créer utilisateur
2. Créer propriétaire
3. Créer bien
4. Créer locataire
5. Créer bail
6. Créer paiement
7. Créer quittance
8. Générer PDF
9. Envoyer email

---

# 🎯 Auteur

Projet Django REST API - Gestion Immobilière
