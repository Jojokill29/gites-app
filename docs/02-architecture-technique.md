# Architecture technique

Ce document decrit les choix techniques et la structure du code. L'objectif est que n'importe qui reprenant le projet (y compris toi dans 6 mois) puisse comprendre rapidement comment tout s'articule.

---

## Principes directeurs

L'application doit rester **simple a modifier** dans la duree. Cela implique :

1. **Separation claire des responsabilites** -- chaque fichier a un role unique
2. **Pas d'abstractions prematurees** -- on reste proche de la logique metier, sans couche intermediaire inutile
3. **Typage strict** -- TypeScript utilise sans `any`, pour que les erreurs soient detectees a la compilation
4. **Donnees en un seul endroit** -- la base de donnees Supabase est la source de verite
5. **Code lisible avant d'etre optimise** -- les performances ne sont pas un enjeu critique (2 utilisateurs)
6. **Une seule langue dans le code** -- tout en anglais (voir section Langue ci-dessous)

---

## Langue

**Decision structurante.** Le code utilise l'anglais de bout en bout :

- Noms de variables, fonctions, types, composants
- Noms de tables et de colonnes en base
- Commentaires de code
- Messages dans la console (logs techniques)

L'anglais est utilise dans la base de donnees egalement (`reservations`, `client_name`, `total_amount`, `paid_amount`, `start_date`, `end_date`). Cela permet d'utiliser directement les types generes par Supabase sans aucune couche de traduction.

**Seules sont en francais :** les chaines affichees a l'utilisateur (labels d'interface, textes, messages d'erreur visibles). Ces chaines sont centralisees dans `src/constants/labels.ts` pour faciliter une eventuelle traduction future.

---

## Stack technique

### Frontend

- **React 18+** : bibliotheque UI (composants)
- **TypeScript** : typage statique
- **Vite** : outil de build et serveur de dev (rapide, simple)
- **React Router** : navigation entre onglets
- **Tailwind CSS** : styling utilitaire (evite les fichiers CSS eparpilles)
- **date-fns** : manipulation de dates
- **react-hook-form** + **zod** : gestion des formulaires avec validation typee
- **JSZip** : generation des archives ZIP (factures trimestrielles, export complet)
- **browser-image-compression** : compression des images de factures avant upload

### Backend (via Supabase)

- **PostgreSQL** : base de donnees relationnelle
- **Supabase Auth** : gestion des comptes et sessions (signup public desactive)
- **Supabase Storage** : stockage des fichiers (PDF, images)
- **Row Level Security (RLS)** : regles d'acces aux donnees au niveau de la base

### Hebergement

- **Vercel** : hebergement du frontend, deploiement automatique depuis Git
  - Production deploye depuis la branche `main`
  - Preview deployments automatiques sur les branches feature (utile pour tester avant merge)
- **Supabase Cloud** : backend manage (base + auth + storage)

---

## Pieges Supabase a connaitre

Specificites du SDK Supabase qui evitent des bugs frequents :

### Les erreurs ne sont pas thrown, elles sont retournees

Le client Supabase ne leve pas d'exception en cas d'erreur. Il retourne un objet `{ data, error }`. Il faut **toujours** verifier `error` avant d'utiliser `data` :

```typescript
const { data, error } = await supabase.from('reservations').select('*');
if (error) {
  console.error('Erreur Supabase:', error);
  throw new Error('Impossible de charger les reservations');
}
// Ici data est garanti non-null
```

Un `try/catch` autour ne suffit PAS, car aucune exception n'est levee par le SDK lui-meme.

### Les types generes sont la verite

Apres chaque migration, regenerer les types :

```bash
npx supabase gen types typescript --project-id XXX > src/types/database.ts
```

Ne jamais ecrire de types a la main pour les tables -- toujours s'appuyer sur les types generes pour rester aligne avec le schema reel.

### La contrainte d'exclusion peut bloquer les UPDATE

Modifier les dates d'une reservation existante peut declencher la contrainte EXCLUDE meme si la nouvelle plage ne chevauche aucune autre reservation reelle. Solution : si on rencontre cette erreur lors d'un UPDATE, afficher un message clair a l'utilisateur ("Les nouvelles dates entrent en conflit avec une autre reservation").

---

## Structure des dossiers

```
gites-app/
|-- public/                    # Assets statiques (favicon, etc.)
|-- src/
|   |-- main.tsx              # Point d'entree
|   |-- App.tsx               # Composant racine + routing
|   |
|   |-- pages/                # Une page par onglet
|   |   |-- LoginPage.tsx
|   |   |-- CalendarPage.tsx
|   |   |-- FinancesPage.tsx
|   |   |-- InvoicesPage.tsx
|   |   |-- ExportPage.tsx
|   |
|   |-- components/           # Composants reutilisables
|   |   |-- layout/
|   |   |   |-- TopBar.tsx
|   |   |   |-- TabBar.tsx
|   |   |   |-- ProtectedRoute.tsx
|   |   |-- calendar/
|   |   |   |-- CalendarGrid.tsx
|   |   |   |-- CalendarDay.tsx
|   |   |   |-- CalendarEvent.tsx
|   |   |   |-- CalendarLegend.tsx
|   |   |-- reservation/
|   |   |   |-- ReservationModal.tsx
|   |   |   |-- ReservationForm.tsx
|   |   |   |-- ContractField.tsx
|   |   |-- finances/
|   |   |   |-- QuarterTable.tsx
|   |   |   |-- TaxEntryForm.tsx
|   |   |-- invoices/
|   |   |   |-- InvoiceCard.tsx
|   |   |   |-- InvoiceUpload.tsx
|   |   |-- ui/               # Boutons, inputs, modals generiques
|   |       |-- Button.tsx
|   |       |-- Input.tsx
|   |       |-- Modal.tsx
|   |       |-- ConfirmDialog.tsx
|   |
|   |-- lib/                  # Logique non-UI
|   |   |-- supabase.ts       # Client Supabase configure
|   |   |-- storage.ts        # Upload / download / delete de fichiers
|   |   |-- export.ts         # Generation des exports CSV et ZIP
|   |   |-- imageCompression.ts  # Compression des images avant upload
|   |
|   |-- hooks/                # Hooks React reutilisables
|   |   |-- useReservations.ts
|   |   |-- useFinances.ts
|   |   |-- useInvoices.ts
|   |   |-- useAuth.ts
|   |   |-- useGites.ts
|   |
|   |-- types/                # Definitions TypeScript
|   |   |-- database.ts       # GENERE par Supabase CLI -- ne pas editer
|   |   |-- domain.ts         # Types metier derives + enums
|   |
|   |-- utils/                # Fonctions utilitaires pures
|   |   |-- dates.ts          # Helpers date-fns (format, parse, quarter)
|   |   |-- currency.ts       # Format EUR, parse
|   |   |-- status.ts         # Mapping statut -> couleurs
|   |   |-- sanitize.ts       # Nettoyage des noms de fichiers
|   |
|   |-- constants/            # Valeurs constantes
|       |-- statuses.ts       # Liste des statuts et leurs couleurs
|       |-- labels.ts         # Textes affiches a l'utilisateur (FR)
|
|-- supabase/
|   |-- migrations/           # Scripts SQL versionnes
|   |   |-- 001_initial_schema.sql
|   |   |-- 002_rls_policies.sql
|   |   |-- 003_storage_setup.sql
|   |-- seed.sql              # Donnees initiales (les 2 gites)
|   |-- config.toml           # Config Supabase CLI
|
|-- .env.example              # Template des variables d'environnement
|-- .env.local                # Variables locales (NON versionne, dans .gitignore)
|-- .gitignore
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- tailwind.config.js
|-- README.md
|-- CLAUDE.md                 # Instructions pour Claude Code
```

---

## Conventions de code

### Nommage

- **Fichiers de composants** : PascalCase (`CalendarGrid.tsx`)
- **Fichiers utilitaires** : camelCase (`dates.ts`)
- **Variables et fonctions** : camelCase (`fetchReservations`, `clientName`)
- **Types et interfaces** : PascalCase (`Reservation`, `GiteId`)
- **Constantes globales** : UPPER_SNAKE_CASE (`STATUSES`, `LABELS`)
- **Tables et colonnes SQL** : snake_case anglais (`reservations`, `client_name`, `total_amount`)
- **Enums TypeScript** : PascalCase (`ReservationStatus.PendingContract`)

### Principes de composants

- Un composant = un fichier
- Composants courts (moins de 200 lignes ideal, 300 max)
- Logique de donnees dans des hooks, pas dans les composants
- Pas de logique metier dans les composants d'UI generiques (`ui/`)

### Commentaires

- Commenter le **pourquoi**, pas le **comment**
- Les noms de variables doivent etre auto-explicatifs
- Documenter les parties non evidentes (regles metier, contraintes, pieges Supabase)

### Gestion des erreurs

- Toute operation asynchrone (appel Supabase, upload, parsing) doit etre encadree :
  - Verifier explicitement `error` retourne par Supabase
  - Lever une erreur typee si necessaire
  - Capter avec `try/catch` au niveau du hook ou du composant
  - Afficher un message en francais a l'utilisateur (pas de stack trace)
  - Logger les details techniques dans `console.error` pour le debug

### Gestion du temps

- Toutes les dates de calendrier (`start_date`, `end_date`) sont stockees en `DATE` (sans heure ni timezone)
- Les `created_at` / `updated_at` sont en `TIMESTAMPTZ`, affiches en heure locale (Europe/Paris)
- Utiliser `date-fns` partout, jamais `Date.now()` brut

---

## Workflow Git

- Une branche `main` qui represente la production (deployee automatiquement par Vercel)
- Une branche par fonctionnalite : `feat/calendar`, `feat/invoices-export`, etc.
- Commits frequents (au moins un par fonctionnalite terminee)
- Messages de commit en anglais, format conventionnel : `feat:`, `fix:`, `docs:`, `refactor:`
- Les Preview Deployments Vercel permettent de tester chaque branche avant merge

---

## Workflow Supabase CLI

Toutes les modifications de schema passent par le CLI Supabase, pas par le SQL Editor de l'interface web :

```bash
# Creer une nouvelle migration
npx supabase migration new add_some_field

# Appliquer les migrations en local (si setup local)
npx supabase db reset

# Pousser vers la prod
npx supabase db push
```

Cela garantit que toutes les modifications sont versionnees dans Git.

---

## Points d'extension prevus

Anticipation des evolutions probables :

### Ajouter un nouveau gite

- Ajouter une entree dans la table `gites` (via migration SQL)
- Ajouter un nouvel onglet dans `TabBar.tsx`
- Le code du calendrier est generique : il s'adapte automatiquement au gite passe en prop

### Ajouter un nouveau statut

- Ajouter la valeur dans `constants/statuses.ts` (couleur, label FR)
- Migration SQL pour mettre a jour la contrainte CHECK sur la colonne `status`
- Regenerer les types

### Ajouter un champ a la fiche reservation

- Migration SQL pour ajouter la colonne
- Regenerer les types TypeScript
- Ajouter le champ dans le schema zod et dans `ReservationForm.tsx`

### Changer l'aspect visuel

- Les couleurs sont centralisees dans `tailwind.config.js` et `constants/statuses.ts`
- La typographie dans `tailwind.config.js`
- Les textes FR dans `constants/labels.ts`

---

## Ce qu'il faut eviter

Pour garder le code maintenable :

- **Pas de state management global complexe** (Redux, Zustand, etc.) -- les hooks React suffisent
- **Pas de librairie de composants UI prefabriquee** (Material UI, Ant Design) -- difficile a customiser, lourd
- **Pas de framework lourd** (Next.js) -- Vite + React suffit pour ce besoin
- **Pas de tests automatises extensifs** -- 2 utilisateurs, usage quotidien suffira a detecter les regressions
- **Pas de CI/CD complexe** -- le deploiement auto de Vercel suffit
- **Pas de modifications du schema via le SQL Editor de Supabase** -- toujours via une migration versionnee
- **Pas de `any` en TypeScript** -- typer explicitement, utiliser `unknown` si vraiment inconnu
