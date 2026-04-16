# Gestion des gites -- Documentation projet

Application web de gestion des reservations pour deux gites (22 et 15 personnes).

Utilisateurs : Johan (Djo) et Quentin (Coltan), avec droits identiques.

---

## Documents du projet

| Fichier | Contenu |
|---|---|
| [01-cahier-des-charges.md](./01-cahier-des-charges.md) | Fonctionnalites et perimetre de l'application |
| [02-architecture-technique.md](./02-architecture-technique.md) | Stack, structure du code, conventions |
| [03-modele-donnees.md](./03-modele-donnees.md) | Schema de la base de donnees |
| [04-plan-developpement.md](./04-plan-developpement.md) | Etapes de developpement |
| [05-decisions-a-trancher.md](./05-decisions-a-trancher.md) | Decisions finales, contenus FR, messages d'erreur, reference maquettes |
| [maquettes-gites.html](./maquettes-gites.html) | Maquettes HTML des 4 vues principales |
| [CLAUDE.md](../CLAUDE.md) | Instructions pour Claude Code (a la racine du projet) |

---

## Decisions structurantes

Deux choix qui impactent toute l'application et qu'il faut connaitre des le depart :

### Langue : anglais en interne, francais en surface
- Code source, noms de variables, noms de tables, noms de colonnes : tout en anglais (`reservations`, `client_name`, `total_amount`)
- Seules les chaines affichees a l'utilisateur (labels, messages, erreurs) sont en francais
- Raison : zero traduction entre la base et le code, types Supabase utilisables tels quels, code lisible par n'importe quel dev

### Finances : hybride (calcul automatique + saisie manuelle)
- **Chiffre d'affaires** : calcule automatiquement a partir de la somme des `paid_amount` des reservations dont au moins une nuit tombe dans le trimestre. Pas de double saisie.
- **Taxes de sejour** : saisies manuellement par Johan apres versement effectif a la commune (les taxes dependent de regles locales que l'app ne peut pas connaitre)
- **Notes financieres libres** : possibilite d'ajouter des entrees manuelles (corrections, frais exceptionnels)

---

## Resume rapide

### Stack
- **Frontend** : React + TypeScript + Vite + Tailwind
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Hebergement** : Vercel (frontend) + Supabase Cloud (backend)

### Fonctionnalites principales
- Authentification par login/mot de passe (signup desactive)
- 2 calendriers (un par gite) avec reservations colorees par statut
- Gestion des reservations avec upload de contrats PDF
- Onglet finances : CA calcule + taxes de sejour saisies par trimestre
- Onglet factures : upload + export ZIP trimestriel pour le comptable
- Export complet des donnees (sauvegarde long terme)

### Contraintes cles
- Responsive (mobile + desktop)
- Pas de maintenance technique prevue apres livraison
- Stack simple pour minimiser la dette technique
- Exports frequents pour garantir la resilience des donnees

---

## Pour demarrer

1. Lire le cahier des charges (01)
2. Lire l'architecture technique (02)
3. Suivre le plan de developpement etape par etape (04)
4. Se referer au modele de donnees (03) pendant l'implementation
5. Placer le CLAUDE.md a la racine du repo Git pour que Claude Code l'utilise automatiquement

---

## Evolutions futures (hors v1)

Si besoin, ces fonctionnalites pourront etre ajoutees dans une v2 :
- Generation automatique de contrats
- Envoi d'emails automatiques aux clients
- Integration Airbnb / Booking
- Systeme de reservation cote client (externe)
- Paiements en ligne
- Statistiques et rapports analytiques

Le code est structure pour faciliter ces ajouts sans refactoring majeur.
