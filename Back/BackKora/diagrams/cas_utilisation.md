# Diagramme de Cas d'Utilisation - Location & Vente Immobilier

## Diagramme Global

```mermaid
---
config:
  look: handDrawn
---
graph LR
    %% ===== ACTEURS HUMAINS A GAUCHE (stickman) =====
    ADMIN@{ shape: person, label: "Administrateur" }
    PROPRIO@{ shape: person, label: "Proprietaire" }
    LOCATAIRE@{ shape: person, label: "Locataire" }

    %% ===== SYSTEME AU CENTRE =====
    subgraph SYSTEME["Systeme Location et Vente Immobilier"]
        direction TB

        subgraph AUTH["Authentification"]
            UC1(["Se connecter"])
            UC2(["Se deconnecter"])
            UC3(["Modifier son profil"])
        end

        subgraph GPROP["Gestion des Proprietaires"]
            UC4(["Ajouter un proprietaire"])
            UC5(["Modifier un proprietaire"])
            UC6(["Supprimer un proprietaire"])
            UC7(["Lister les proprietaires"])
        end

        subgraph GBIEN["Gestion du Patrimoine"]
            UC8(["Ajouter un bien"])
            UC9(["Modifier un bien"])
            UC10(["Supprimer un bien"])
            UC11(["Lister les biens"])
            UC12(["Mettre en ligne un bien"])
            UC13(["Gerer les categories"])
            UC14(["Gerer les types de bien"])
        end

        subgraph GLOC["Gestion Locataires et Baux"]
            UC15(["Ajouter un locataire"])
            UC16(["Modifier un locataire"])
            UC17(["Supprimer un locataire"])
            UC18(["Lister les locataires"])
            UC19(["Creer un bail"])
            UC20(["Modifier un bail"])
            UC21(["Resilier un bail"])
        end

        subgraph COMPTA["Comptabilite"]
            UC22(["Enregistrer un paiement"])
            UC23(["Suivre les paiements"])
            UC24(["Enregistrer une depense"])
            UC25(["Consulter la balance comptable"])
            UC26(["Exporter les donnees fiscales"])
        end

        subgraph DEMANDE["Demandes et Contact"]
            UC27(["Envoyer demande de mise en ligne"])
            UC28(["Traiter une demande"])
        end

        subgraph STATS["Statistiques"]
            UC29(["Consulter stats globales"])
            UC30(["Consulter stats de ses biens"])
        end

        subgraph NOTIF["Documents et Notifications"]
            UC31(["Generer quittance PDF"])
            UC32(["Envoyer quittance par email"])
            UC33(["Alerter loyer impaye"])
            UC34(["Alerter fin de bail proche"])
            UC35(["Alerter revision de loyer"])
        end

        subgraph PAIE["Paiement en Ligne"]
            UC36(["Payer son loyer en ligne"])
            UC37(["Consulter historique paiements"])
            UC38(["Traiter le paiement"])
        end

        subgraph AUDIT["Audit et Securite"]
            UC39(["Consulter les audit logs"])
        end
    end

    %% ===== ACTEURS EXTERNES A DROITE =====
    FEDAPAY(("FedaPay"))
    MAIL(("Serveur Mail"))

    %% ===== LIENS ADMIN - Authentification =====
    ADMIN --> UC1
    ADMIN --> UC2
    ADMIN --> UC3

    %% ===== LIENS ADMIN - Proprietaires =====
    ADMIN --> UC4
    ADMIN --> UC5
    ADMIN --> UC6
    ADMIN --> UC7

    %% ===== LIENS ADMIN - Patrimoine =====
    ADMIN --> UC8
    ADMIN --> UC9
    ADMIN --> UC10
    ADMIN --> UC11
    ADMIN --> UC12
    ADMIN --> UC13
    ADMIN --> UC14

    %% ===== LIENS ADMIN - Locataires et Baux =====
    ADMIN --> UC15
    ADMIN --> UC16
    ADMIN --> UC17
    ADMIN --> UC18
    ADMIN --> UC19
    ADMIN --> UC20
    ADMIN --> UC21

    %% ===== LIENS ADMIN - Comptabilite =====
    ADMIN --> UC22
    ADMIN --> UC23
    ADMIN --> UC24
    ADMIN --> UC25
    ADMIN --> UC26

    %% ===== LIENS ADMIN - Autres =====
    ADMIN --> UC28
    ADMIN --> UC29
    ADMIN --> UC31
    ADMIN --> UC33
    ADMIN --> UC34
    ADMIN --> UC35
    ADMIN --> UC39

    %% ===== LIENS PROPRIETAIRE =====
    PROPRIO --> UC1
    PROPRIO --> UC2
    PROPRIO --> UC3
    PROPRIO --> UC27
    PROPRIO --> UC30

    %% ===== LIENS LOCATAIRE =====
    LOCATAIRE --> UC1
    LOCATAIRE --> UC2
    LOCATAIRE --> UC36
    LOCATAIRE --> UC37

    %% ===== LIENS ACTEURS EXTERNES A DROITE =====
    UC38 --> FEDAPAY
    UC32 --> MAIL
    UC33 --> MAIL
    UC34 --> MAIL
    UC35 --> MAIL

    %% ===== INCLUDE =====
    UC22 -. "include" .-> UC31
    UC31 -. "include" .-> UC32
    UC36 -. "include" .-> UC38

    %% ===== EXTEND =====
    UC23 -. "extend" .-> UC33
    UC20 -. "extend" .-> UC35
    UC12 -. "extend" .-> UC28
```

## Légende

| Symbole | Signification |
|---------|---------------|
| → (flèche pleine) | L'acteur utilise le cas d'utilisation |
| -.-> «include» | Inclusion obligatoire (toujours exécuté) |
| -.-> «extend» | Extension conditionnelle (exécuté si condition remplie) |

## Résumé par Acteur

| Acteur | Cas d'utilisation |
|--------|-------------------|
| **Administrateur** | Gère tout : propriétaires, biens, catégories, locataires, baux, comptabilité, quittances, alertes, audit logs |
| **Propriétaire** | Se connecter, envoyer demande de mise en ligne, consulter ses statistiques |c 
| **Locataire** | Se connecter, payer son loyer en ligne, consulter son historique de paiements |
| **FedaPay** | Traiter les paiements en ligne |
| **Serveur Mail** | Envoyer quittances et alertes par email |
