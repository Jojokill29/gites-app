# CLAUDE.md -- Gestion des gites

Ce fichier est lu automatiquement par Claude Code a chaque session. Il contient les instructions permanentes du projet. La doc complete est dans le dossier `docs/` du projet.

---

## Contexte

Application web de gestion de reservations pour deux gites (22 et 15 personnes). Deux utilisateurs : Johan (Djo) et Quentin (Coltan), memes droits. Djo utilise principalement son telephone, Coltan son ordinateur. L'application doit etre responsive, fiable, et ne necessitera pas de maintenance technique apres livraison. Operee en heure francaise (Europe/Paris).

---

## Instructions de collaboration

Comportement attendu pendant les sessions :

- **Avant de demarrer une etape majeure**, faire une courte synthese de ce que tu vas faire et demander validation
- **Avant de creer plus de 3 nouveaux fichiers d'un coup**, demander confirmation
- **Avant d'installer une nouvelle dependance npm**, demander confirmation et expliquer pourquoi elle est necessaire
- **Apres chaque etape du plan terminee**, proposer un commit Git avec un message clair (en anglais, format `feat:`, `fix:`, etc.)
- **Si tu detectes un probleme de design ou une contradiction dans la doc**, signale-le avant de coder
- **Si tu hesites entre plusieurs approches**, expose-les brievement et demande mon avis plutot que de choisir seul
- **Quand tu termines une tache**, fais un resume bref de ce qui a change et propose le test manuel a faire
- **Ne jamais lancer de commande destructrice** (`rm -rf`, `git reset --hard`, `DROP TABLE`) sans confirmation explicite

---

## Stack technique

- **Frontend** : React 18+ / TypeScript / Vite / Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Hebergement** : Vercel (frontend) + Supabase Cloud (backend)
- **Formulaires** : react-hook-form + zod
- **Dates** : date-fns
- **Routing** : React Router
- **ZIP** : JSZip
- **Compression d'images** : browser-image-compression

---

## Langue : decision structurante

**Tout en anglais en interne, francais uniquement pour l'utilisateur.**

- Code, variables, fonctions, types : anglais
- Tables et colonnes SQL : anglais (`reservations`, `client_name`, `total_amount`, `start_date`)
- Commentaires de code : anglais
- Logs console : anglais
- **Chaines affichees a l'utilisateur** : francais, centralisees dans `src/constants/labels.ts`
- **Messages d'erreur visibles** : francais
- **Messages de commit Git** : anglais

Aucune traduction nulle part dans le code. Si tu vois `client_name` dans la base, tu utilises `client_name` dans le code TypeScript (sauf transformation en `clientName` si tu prefers via les types generes -- a decider, mais reste coherent).

---

## Pieges Supabase a connaitre absolument

### Les erreurs ne sont PAS thrown

Le client Supabase retourne `{ data, error }`. Toujours verifier `error` avant d'utiliser `data` :

```typescript
const { data, error } = await supabase.from('reservations').select('*');
if (error) {
  console.error('Supabase error:', error);
  throw new Error('Impossible de charger les reservations');
}
```

Un `try/catch` seul ne suffit pas car le SDK ne leve pas d'exception.

### Les types se regenerent apres chaque migration

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

Ne jamais ecrire de types a la main pour les tables. Toujours s'appuyer sur les types generes.

### La contrainte d'exclusion peut bloquer un UPDATE

Modifier les dates d'une reservation existante peut declencher la contrainte EXCLUDE meme si la nouvelle plage ne chevauche aucune autre reservation. Toujours afficher un message clair en francais en cas d'erreur Postgres `23P01`.

### Les modifications de schema passent par des migrations

Jamais via le SQL Editor du dashboard Supabase. Toujours via `npx supabase migration new xxx` puis `npx supabase db push`. Cela garantit que tout est versionne dans Git.

---

## Structure du projet

```
src/
  pages/           -- une page par onglet (LoginPage, CalendarPage, FinancesPage, InvoicesPage, ExportPage)
  components/      -- composants reutilisables, organises par domaine (calendar/, reservation/, finances/, invoices/, layout/, ui/)
  hooks/           -- hooks React (useReservations, useFinances, useInvoices, useAuth, useGites)
  lib/             -- logique non-UI (supabase.ts, storage.ts, export.ts, imageCompression.ts)
  types/           -- types TypeScript (database.ts genere par Supabase, domain.ts pour types metier)
  utils/           -- fonctions utilitaires pures (dates.ts, currency.ts, status.ts, sanitize.ts)
  constants/       -- valeurs constantes (statuses.ts, labels.ts)
supabase/
  migrations/      -- scripts SQL versionnes
  seed.sql         -- donnees initiales (les 2 gites)
  config.toml      -- config Supabase CLI
```

---

## Conventions de code

### Nommage
- Composants React : PascalCase (CalendarGrid.tsx)
- Fichiers utilitaires : camelCase (dates.ts)
- Variables et fonctions : camelCase
- Types et interfaces : PascalCase (Reservation, GiteId)
- Constantes globales : UPPER_SNAKE_CASE (STATUSES, LABELS)
- Tables et colonnes SQL : snake_case anglais (reservations, client_name)

### Composants
- Un composant par fichier, max 200-300 lignes
- Logique de donnees dans des hooks, pas dans les composants
- Pas de logique metier dans les composants d'UI generiques (`ui/`)
- Pas de `any` en TypeScript -- utiliser `unknown` si necessaire

### Style
- Tailwind CSS uniquement, pas de fichiers CSS separes sauf cas exceptionnel
- Pas de librairie de composants UI prefabriquee (pas de Material UI, Ant Design, shadcn, etc.)

### Gestion des erreurs
- Verifier explicitement `error` retourne par Supabase
- Toute operation async encadree par try/catch au niveau du hook ou composant
- Messages utilisateur en francais (via `labels.ts`), pas de stack trace
- Logs techniques dans `console.error` en anglais

### Commentaires
- Commenter le pourquoi, pas le comment
- Documenter les regles metier et les contraintes non evidentes

### Dates
- Toujours utiliser `date-fns`, jamais `Date.now()` brut
- `start_date` / `end_date` en `DATE` (sans heure)
- Affichage en heure locale Europe/Paris
- Format affichage : `dd/MM/yyyy` ou `d MMMM yyyy` selon contexte

---

## Regles metier

### Reservations
- Un gite ne peut pas avoir deux reservations qui se chevauchent sur plusieurs nuits
- Un jour de rotation est autorise : le jour de depart d'une reservation peut etre le jour d'arrivee de la suivante
- Gere par contrainte d'exclusion PostgreSQL avec `daterange(start_date, end_date, '[)')` (borne droite exclusive)
- Pas de colonne `remaining_amount` -- calcule cote client : `total_amount - paid_amount`

### Statuts de reservation (3 valeurs uniquement)
- `pending_contract` -> rouge (#E24B4A, texte #791F1F, fond #FCEBEB) -- "Contrat en attente"
- `pending_deposit` -> orange (#EF9F27, texte #854F0B, fond #FAEEDA) -- "Acompte en attente"
- `deposit_paid` -> vert (#5DCAA5, texte #085041, fond #E1F5EE) -- "Acompte paye"
- Mapping centralise dans `constants/statuses.ts` et `utils/status.ts`

### Contrats PDF
- Stockes dans le bucket Supabase Storage `contracts` sous `contracts/{uuid}.pdf` (UUID genere a l'upload, pas le nom utilisateur)
- Path complet stocke dans `reservations.contract_path`
- Acces via URLs signees (duree 10 min), jamais d'URL publique
- Un seul contrat par reservation, remplacement supprime l'ancien fichier
- Suppression d'une reservation = suppression du contrat dans Storage (gere cote code, pas de cascade)

### Factures
- Stockees dans le bucket `invoices` sous `invoices/{uuid}.{ext}`
- Formats acceptes : JPEG, PNG, PDF
- JPEG/PNG compresses cote client avant upload (qualite 0.8, max 2000px sur le grand cote)
- Regroupees par trimestre dans l'interface
- Export ZIP trimestriel pour le comptable (via JSZip)

### Finances : approche hybride
- **Chiffre d'affaires : calcule automatiquement** a partir de la somme des `paid_amount` des reservations dont le `start_date` tombe dans le trimestre. Pas de saisie manuelle.
- **Taxes de sejour : saisie manuelle** par Johan apres versement effectif (table `tax_entries`)
- **Notes financieres libres : saisie manuelle** pour corrections, frais exceptionnels (table `misc_entries`)
- Tous les totaux sont calcules cote client a partir de ces 3 sources

---

## Base de donnees (recap)

### Tables (toutes en anglais)
- `gites` (id, name, capacity, display_order)
- `reservations` (id, gite_id, client_name, start_date, end_date, guest_count, linen_sets, total_amount, paid_amount, status, notes, contract_path)
- `tax_entries` (id, amount, year, quarter, notes)
- `misc_entries` (id, label, amount, year, quarter, notes)
- `invoices` (id, name, file_path, invoice_date, notes)

### Securite
- RLS activee sur toutes les tables (policy : `authenticated` a acces complet)
- Policies Storage explicites pour les buckets `contracts` et `invoices`
- Inscription publique desactivee dans Supabase Auth

### Migrations
- Versionnees dans `supabase/migrations/` (timestamps generes par le CLI)
- Ne jamais modifier une migration deja appliquee, toujours en creer une nouvelle
- Toujours via `npx supabase migration new xxx`, jamais via le SQL Editor

---

## Ce qu'il faut eviter

- Pas de state management global (Redux, Zustand) -- les hooks suffisent
- Pas de framework lourd (Next.js) -- Vite + React suffit
- Pas de librairie UI prefabriquee -- on style avec Tailwind
- Pas de tests automatises extensifs -- 2 utilisateurs, le test manuel suffit
- Pas de CI/CD complexe -- le deploiement auto de Vercel suffit
- Pas d'abstractions prematurees -- rester simple et direct
- Pas de modifications du schema via le SQL Editor -- toujours via une migration
- Pas de `any` en TypeScript

---

## Points d'extension prevus

- **Ajouter un gite** : INSERT dans `gites` (via migration ou SQL direct), un onglet apparait automatiquement dans `TabBar.tsx` si la liste est chargee dynamiquement
- **Ajouter un statut** : ajouter dans `constants/statuses.ts` + migration SQL pour la contrainte CHECK
- **Ajouter un champ a la reservation** : migration SQL + regenerer les types + ajouter dans le schema zod et dans `ReservationForm.tsx`
- **Changer les couleurs** : modifier `constants/statuses.ts` et/ou `tailwind.config.js`
- **Changer les textes FR** : modifier `constants/labels.ts`
