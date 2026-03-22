# Diagramme de Classes UML - Location & Vente Immobilier

## Diagramme de Classes Global

```mermaid
classDiagram
    direction TB

    class Utilisateur {
        +int id
        +String username
        +String email
        +String password
        +String role
        +boolean is_active
        +DateTime date_creation
        +se_connecter()
        +se_deconnecter()
        +modifier_profil()
    }

    class Proprietaire {
        +int id
        +String nom
        +String prenom
        +String email
        +String telephone
        +String adresse
        +boolean actif
        +DateTime date_inscription
        +consulter_stats()
        +demander_mise_en_ligne()
    }

    class Locataire {
        +int id
        +String nom
        +String prenom
        +String email
        +String telephone
        +Date date_naissance
        +String profession
        +String piece_identite
        +String garant_nom
        +String garant_prenom
        +String garant_telephone
        +boolean actif
        +DateTime date_inscription
        +payer_loyer()
        +consulter_historique()
    }

    class Categorie {
        +int id
        +String nom
        +String description
        +DateTime date_creation
    }

    class TypeBien {
        +int id
        +String nom
        +String description
        +DateTime date_creation
    }

    class Bien {
        +int id
        +String adresse
        +String description
        +String photos
        +String equipements
        +Decimal loyer_hc
        +Decimal charges
        +Decimal latitude
        +Decimal longitude
        +String statut
        +boolean en_ligne
        +DateTime date_creation
        +DateTime date_modification
        +mettre_en_ligne()
        +changer_statut()
        +calculer_loyer_total()
    }

    class Bail {
        +int id
        +Date date_entree
        +Date date_sortie
        +Decimal loyer_initial
        +Decimal depot_garantie
        +Decimal taux_revision
        +boolean actif
        +DateTime date_creation
        +resilier()
        +reviser_loyer()
        +est_expire()
    }

    class Paiement {
        +int id
        +Decimal montant
        +Date date_paiement
        +String methode
        +String reference_fedapay
        +String statut
        +DateTime date_creation
        +valider()
        +annuler()
    }

    class Quittance {
        +int id
        +String fichier_pdf
        +DateTime date_generation
        +boolean envoyee
        +generer_pdf()
        +envoyer_par_email()
    }

    class Depense {
        +int id
        +String type_depense
        +Decimal montant
        +Date date_depense
        +String description
        +String facture
        +DateTime date_creation
    }

    class DemandeContact {
        +int id
        +String sujet
        +String message
        +String type_demande
        +String statut
        +String reponse_admin
        +DateTime date_creation
        +DateTime date_traitement
        +traiter()
        +rejeter()
    }

    class AuditLog {
        +int id
        +String action
        +String modele
        +String ancien_valeur
        +String nouvelle_valeur
        +DateTime date_action
    }

    class BalanceComptable {
        +calculer_revenus(bien, periode)
        +calculer_depenses(bien, periode)
        +calculer_benefice_net(bien, periode)
        +exporter_donnees_fiscales(periode)
    }

    %% ===== RELATIONS =====

    Utilisateur "1" -- "0..1" Proprietaire : possede un profil
    Utilisateur "1" -- "0..1" Locataire : possede un profil
    Utilisateur "1" -- "*" AuditLog : genere

    Proprietaire "1" -- "*" Bien : possede
    Proprietaire "1" -- "*" DemandeContact : envoie

    Categorie "1" -- "*" TypeBien : contient
    Categorie "1" -- "*" Bien : classifie
    TypeBien "1" -- "*" Bien : precise

    Bien "1" -- "*" Bail : concerne
    Bien "1" -- "*" Depense : engendre

    Locataire "1" -- "*" Bail : signe

    Bail "1" -- "*" Paiement : recoit
    Paiement "1" -- "0..1" Quittance : genere
```

## Detail des Relations

| Relation | Cardinalite | Description |
|----------|-------------|-------------|
| Utilisateur - Proprietaire | 1 --- 0..1 | Un utilisateur peut avoir un profil proprietaire |
| Utilisateur - Locataire | 1 --- 0..1 | Un utilisateur peut avoir un profil locataire |
| Utilisateur - AuditLog | 1 --- * | Un utilisateur genere plusieurs logs |
| Proprietaire - Bien | 1 --- * | Un proprietaire possede plusieurs biens |
| Proprietaire - DemandeContact | 1 --- * | Un proprietaire peut envoyer plusieurs demandes |
| Categorie - TypeBien | 1 --- * | Une categorie contient plusieurs types |
| Categorie - Bien | 1 --- * | Une categorie classifie plusieurs biens |
| TypeBien - Bien | 1 --- * | Un type precise plusieurs biens |
| Bien - Bail | 1 --- * | Un bien peut avoir plusieurs baux dans le temps |
| Bien - Depense | 1 --- * | Un bien peut avoir plusieurs depenses |
| Locataire - Bail | 1 --- * | Un locataire peut signer plusieurs baux |
| Bail - Paiement | 1 --- * | Un bail recoit plusieurs paiements mensuels |
| Paiement - Quittance | 1 --- 0..1 | Un paiement genere une quittance |

## Enumeration des Statuts

```mermaid
classDiagram
    direction LR

    class StatutBien {
        <<enumeration>>
        LOUE
        VACANT
        EN_TRAVAUX
        EN_VENTE
    }

    class RoleUtilisateur {
        <<enumeration>>
        ADMIN
        PROPRIETAIRE
        LOCATAIRE
    }

    class StatutPaiement {
        <<enumeration>>
        EN_ATTENTE
        VALIDE
        REFUSE
        ANNULE
    }

    class TypeDepense {
        <<enumeration>>
        TRAVAUX
        TAXES
        FRAIS_AGENCE
        COPROPRIETE
        AUTRE
    }

    class StatutDemande {
        <<enumeration>>
        EN_ATTENTE
        TRAITEE
        REJETEE
    }

    class MethodePaiement {
        <<enumeration>>
        ESPECES
        VIREMENT
        FEDAPAY
        CHEQUE
    }
```
