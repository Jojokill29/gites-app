# Plan de developpement

Etapes ordonnees pour construire l'application. Chaque etape est independante et testable avant de passer a la suivante.

**Regle de travail** : a la fin de chaque etape, faire un commit Git avec un message clair. C'est la seule garantie de ne pas perdre le code.

---

## Etape 0 -- Preparation (0.5 jour)

**Avant de coder**, mettre en place les services externes :

- [ ] Creer un compte Supabase (supabase.com)
- [ ] Creer un nouveau projet Supabase (region : Frankfurt ou Paris pour la latence)
- [ ] Noter l'URL du projet et la cle `anon public` dans un gestionnaire de mots de passe
- [ ] Dans Supabase Auth Settings : **desactiver les inscriptions publiques** (toggle "Disable new sign-ups")
- [ ] Installer Supabase CLI en local : `npm install -g supabase`
- [ ] Creer un compte Vercel
- [ ] Creer un compte GitHub (ou GitLab)
- [ ] Creer un repository Git **prive** pour le projet
- [ ] (Optionnel) Acheter un nom de domaine -- peut etre fait apres

**Livrable** : services prets, credentials notes dans un endroit sur, signup desactive verifie.

---

## Etape 1 -- Initialisation du projet (1 jour)

Mise en place du socle technique.

- [ ] Creer le projet Vite + React + TypeScript :
  ```bash
  npm create vite@latest gites-app -- --template react-ts
  cd gites-app
  npm install
  ```
- [ ] Installer les dependances principales :
  ```bash
  npm install @supabase/supabase-js react-router-dom date-fns
  npm install react-hook-form zod @hookform/resolvers
  npm install jszip browser-image-compression
  npm install -D tailwindcss postcss autoprefixer
  ```
- [ ] Configurer Tailwind CSS (`npx tailwindcss init -p`)
- [ ] Creer la structure des dossiers (voir `02-architecture-technique.md`)
- [ ] Placer le `CLAUDE.md` a la racine du projet
- [ ] Configurer le client Supabase dans `src/lib/supabase.ts`
- [ ] Creer `.env.example` (template) et `.env.local` (avec les vraies cles)
- [ ] Verifier que `.env.local` est bien dans `.gitignore`
- [ ] Initialiser Supabase CLI : `npx supabase init`
- [ ] Lier le projet local a Supabase Cloud : `npx supabase link --project-ref XXX`
- [ ] Premier commit Git, premier push
- [ ] Connecter le repo a Vercel
- [ ] Configurer les variables d'environnement Supabase dans Vercel
- [ ] Verifier qu'une page "Hello world" se deploie correctement

**Livrable** : application vide deployee en ligne, accessible via une URL Vercel, repo Git en place.

---

## Etape 2 -- Base de donnees (0.5 a 1 jour)

Mise en place du schema, separe de l'auth pour faire des etapes plus courtes.

- [ ] Creer la migration initiale via le CLI : `npx supabase migration new initial_schema`
- [ ] Ecrire le contenu : tables `gites`, `reservations`, `tax_entries`, `misc_entries`, `invoices`, contraintes, trigger `updated_at`
- [ ] Creer la migration RLS : `npx supabase migration new rls_policies`
- [ ] Ecrire les policies pour les 5 tables
- [ ] Creer la migration Storage : `npx supabase migration new storage_setup`
- [ ] Creer les buckets `contracts` et `invoices` (via interface ou SQL `storage.create_bucket`)
- [ ] Ecrire les policies Storage pour les deux buckets (voir doc 03)
- [ ] Creer le seed `supabase/seed.sql` avec les 2 gites
- [ ] Pousser tout en prod : `npx supabase db push`
- [ ] Inserer le seed manuellement via le SQL Editor (ou via le CLI)
- [ ] Generer les types TypeScript : `npx supabase gen types typescript --linked > src/types/database.ts`

**Test manuel** :
- Verifier dans le dashboard que les tables et buckets existent
- Inserer manuellement 2 reservations qui se chevauchent : verifier que ca echoue
- Inserer une reservation qui commence le jour de fin d'une autre (rotation) : verifier que ca passe

**Livrable** : base de donnees complete, types generes, seed en place.

---

## Etape 3 -- Authentification (0.5 a 1 jour)

- [ ] Creer les 2 comptes utilisateurs via le dashboard Supabase Auth (Johan, Quentin)
- [ ] Configurer Site URL et Redirect URLs dans Supabase Auth
- [ ] Creer le hook `useAuth.ts`
- [ ] Creer la page `LoginPage.tsx` avec formulaire email + mot de passe + zod
- [ ] Creer le composant `ProtectedRoute.tsx` qui redirige vers `/login` si pas connecte
- [ ] Mettre en place React Router avec route `/login` non protegee, le reste protege
- [ ] Tester le login depuis 2 appareils differents

**Livrable** : les deux utilisateurs peuvent se connecter et arriver sur une page d'accueil vide.

---

## Etape 4 -- Layout et navigation (1 jour)

Mise en place de la structure visuelle qui sera reutilisee partout.

- [ ] Creer `TopBar.tsx` (titre, avatar, nom utilisateur, bouton deconnexion)
- [ ] Creer `TabBar.tsx` avec 5 onglets dynamiques :
  - Un onglet par gite (charges depuis la table `gites`)
  - Onglets fixes : Finances, Factures, Export
- [ ] Routes React Router :
  - `/calendar/:giteId`
  - `/finances`
  - `/invoices`
  - `/export`
- [ ] Creer les pages vides (`CalendarPage`, `FinancesPage`, `InvoicesPage`, `ExportPage`)
- [ ] Styliser avec Tailwind selon les maquettes
- [ ] Centraliser les textes FR dans `constants/labels.ts`
- [ ] Centraliser les statuts et couleurs dans `constants/statuses.ts`
- [ ] Verifier le rendu mobile et desktop

**Livrable** : navigation fluide entre les onglets, chacun affichant une page vide mais correctement stylisee.

---

## Etape 5 -- Calendrier (3 a 5 jours)

Le coeur de l'application. C'est l'etape la plus complexe.

- [ ] Creer le hook `useReservations.ts` : charge les reservations d'un gite pour un mois
- [ ] Creer le hook `useGites.ts` : charge la liste des gites
- [ ] Creer `CalendarGrid.tsx` : grille 7 colonnes x N semaines (semaine commence lundi)
- [ ] Creer `CalendarDay.tsx` : une case du calendrier
- [ ] Creer `CalendarEvent.tsx` : une barre de reservation (couleur selon statut, mapping dans `utils/status.ts`)
- [ ] Gerer l'affichage multi-jours d'une reservation (start / middle / end)
- [ ] Gerer l'affichage des jours de rotation (depart + arrivee empiles)
- [ ] Navigation mois precedent / mois suivant + bouton "Aujourd'hui"
- [ ] `CalendarLegend.tsx` : legende des couleurs
- [ ] Bouton "+ Nouvelle reservation"
- [ ] Mettre en place la page `CalendarPage` qui prend l'ID du gite en parametre d'URL
- [ ] Tester sur mobile (scroll, taille des cases, lisibilite)

**Livrable** : deux calendriers fonctionnels affichant les reservations reelles de la base.

**Test manuel** :
- Inserer manuellement des reservations en base, verifier l'affichage
- Tester sur mobile
- Tester un cas de rotation (1 au 7, puis 7 au 14)

---

## Etape 6 -- Fiche reservation (2 a 3 jours)

Creation / consultation / edition / suppression.

- [ ] Creer `ReservationModal.tsx` : modal d'affichage/edition
- [ ] Creer `ReservationForm.tsx` avec react-hook-form + zod
- [ ] Definir le schema zod pour la validation (dates, montants, status enum)
- [ ] Mode "creation" : champs vides, sauvegarde = INSERT
- [ ] Mode "edition" : champs pre-remplis, sauvegarde = UPDATE
- [ ] Calcul dynamique du "reste a payer" (total_amount - paid_amount), affiche en rouge si > 0
- [ ] Selecteur de statut avec les 3 options (en francais via `labels.ts`)
- [ ] Bouton "Supprimer" avec dialog de confirmation explicite
- [ ] Gestion des erreurs Supabase :
  - Detecter `code: "23P01"` (violation de contrainte d'exclusion)
  - Afficher message clair : "Ces dates entrent en conflit avec une autre reservation."
- [ ] Verifier le bon comportement lors de la modification de dates d'une reservation existante

**Livrable** : creation, modification, suppression de reservations fonctionnelles.

**Test manuel** :
- Creer une reservation
- La modifier (changer les dates, le statut)
- La supprimer
- Tenter un chevauchement : verifier le message d'erreur en francais
- Tester le cas de rotation : verifier que c'est autorise

---

## Etape 7 -- Contrats PDF (1 a 2 jours)

Upload et consultation des contrats.

- [ ] Creer `lib/storage.ts` avec les fonctions :
  - `uploadContract(file, reservationId)` : genere un UUID, uploade dans `contracts/{uuid}.pdf`, retourne le path
  - `getContractSignedUrl(path)` : URL signee 10 minutes
  - `deleteContract(path)` : suppression du fichier
  - `replaceContract(file, oldPath)` : upload du nouveau, suppression de l'ancien
- [ ] Creer `utils/sanitize.ts` (au cas ou on veut afficher le nom original ailleurs)
- [ ] Composant `ContractField.tsx` integre dans `ReservationForm`
- [ ] Afficher le statut "PDF uploade" si `contract_path` non NULL
- [ ] Bouton "Voir le contrat" qui genere une URL signee et ouvre dans un nouvel onglet
- [ ] Quand on supprime une reservation : supprimer aussi le PDF du Storage

**Livrable** : contrats uploadables et consultables de maniere securisee.

**Test manuel** :
- Uploader un contrat
- Le consulter
- Le remplacer (verifier que l'ancien est bien supprime du Storage via le dashboard)
- Supprimer la reservation (verifier que le PDF disparait du Storage)
- Verifier qu'on ne peut pas acceder au PDF sans etre connecte

---

## Etape 8 -- Onglet Finances (2 a 3 jours)

Saisie des taxes et notes libres, calcul automatique du CA.

- [ ] Creer le hook `useFinances.ts` qui retourne, pour une annee donnee :
  - Le CA par trimestre (calcule via la requete SQL d'agregation)
  - Les taxes par trimestre (depuis `tax_entries`)
  - Les entrees libres par trimestre (depuis `misc_entries`)
- [ ] Page `FinancesPage.tsx` avec navigation annee
- [ ] Afficher les metriques annuelles (CA total, taxes totales, nombre de reservations)
- [ ] Tableau detail par trimestre :
  - Ligne CA (lecture seule, calcule)
  - Ligne Taxes (saisie manuelle, edit/delete)
  - Lignes notes libres (saisie manuelle, edit/delete)
- [ ] Mettre en evidence le trimestre en cours
- [ ] Boutons :
  - "+ Saisir une taxe de sejour" (modal `TaxEntryForm`)
  - "+ Ajouter une note" (modal pour `misc_entries`)
- [ ] Edition et suppression d'une entree (taxe ou note)

**Livrable** : onglet finances complet et fonctionnel, CA toujours coherent avec les reservations.

---

## Etape 9 -- Onglet Factures (2 a 3 jours)

Upload de factures et export ZIP trimestriel.

- [ ] Creer le hook `useInvoices.ts` (filtrage par trimestre)
- [ ] Page `InvoicesPage.tsx` avec navigation trimestre
- [ ] Composant `InvoiceCard.tsx` : vignette + nom + date
- [ ] Composant `InvoiceUpload.tsx` :
  - Upload (fichier + date + nom + notes)
  - Si JPEG/PNG : compression via `browser-image-compression` avant upload (qualite 0.8, max 2000px)
  - Si PDF : upload direct
- [ ] Affichage plein ecran d'une facture au clic (URL signee)
- [ ] Suppression d'une facture (avec confirmation, delete fichier + ligne BDD)
- [ ] Generation ZIP trimestriel via JSZip :
  - Telecharger chaque fichier via URL signee
  - Renommer `nom_facture.ext` dans le ZIP
  - Trigger download
- [ ] Bouton "Telecharger ZIP trimestre" avec spinner pendant la generation

**Livrable** : factures gerees, export trimestriel fonctionnel.

---

## Etape 10 -- Onglet Export (1 jour)

Sauvegarde complete des donnees. **Etape critique a ne jamais sauter.**

- [ ] Creer `lib/export.ts` avec les fonctions d'export
- [ ] Helper `toCsv(rows, headers)` qui genere un CSV propre (escape des virgules, quotes)
- [ ] Export CSV des reservations (avec gite associe par jointure)
- [ ] Export CSV des finances (CA calcule + taxes + notes libres, par trimestre et par annee)
- [ ] Export complet ZIP via JSZip :
  - `reservations.csv`
  - `finances.csv`
  - dossier `contracts/` avec tous les PDF
  - dossier `invoices/` avec toutes les factures
- [ ] Page `ExportPage.tsx` avec les 3 boutons d'export
- [ ] Spinner / progress pendant la generation (peut etre long sur 4 Go)
- [ ] Recommandation affichee : "Effectuer un export complet au moins une fois par mois"

**Livrable** : les 3 exports fonctionnels.

**Test manuel** :
- Telecharger l'archive complete
- Verifier son contenu : CSVs ouvrables dans Excel, PDF et factures presents et ouvrables

---

## Etape 11 -- Polish et tests (2 a 3 jours)

Finitions avant utilisation reelle.

- [ ] Tester l'ensemble sur mobile (iPhone Safari et Android Chrome si possible)
- [ ] Tester sur desktop (Chrome, Firefox, Safari)
- [ ] Ajuster les espacements et tailles de police
- [ ] Verifier les messages d'erreur utilisateur (tous en francais, pas de stack trace)
- [ ] Ajouter des loaders sur toutes les operations asynchrones
- [ ] Verifier que toutes les confirmations de suppression sont presentes et explicites
- [ ] Tester les cas limites :
  - Reservation a cheval sur deux mois
  - Reservation a cheval sur deux annees
  - Tres longues reservations (1 mois+)
  - Annee sans aucune reservation (page Finances ne plante pas)
  - Trimestre sans factures (export ZIP vide)
  - Connexion lente (loaders visibles)
- [ ] Mettre en place le nom de domaine custom sur Vercel (si achete)
- [ ] Activer le renouvellement automatique du domaine
- [ ] Documenter les identifiants de connexion pour Johan et Quentin (gestionnaire de mots de passe)
- [ ] Faire un export complet et le sauvegarder ailleurs (Drive, disque dur)

**Livrable** : application prete pour utilisation reelle.

---

## Recapitulatif des estimations

| Etape | Duree |
|---|---|
| 0 -- Preparation | 0.5 jour |
| 1 -- Initialisation | 1 jour |
| 2 -- Base de donnees | 0.5 a 1 jour |
| 3 -- Authentification | 0.5 a 1 jour |
| 4 -- Layout | 1 jour |
| 5 -- Calendrier | 3 a 5 jours |
| 6 -- Fiche reservation | 2 a 3 jours |
| 7 -- Contrats PDF | 1 a 2 jours |
| 8 -- Finances | 2 a 3 jours |
| 9 -- Factures | 2 a 3 jours |
| 10 -- Export | 1 jour |
| 11 -- Polish | 2 a 3 jours |
| **Total** | **16.5 a 26.5 jours** |

Estimations pour un developpeur experimente sur React/TypeScript. Doubler pour un debutant. Avec Claude Code en assistance, comptez plutot dans la fourchette basse.

---

## Ordre de priorite si le temps manque

Si pour une raison quelconque il faut livrer une version minimale rapidement, l'ordre de priorite est :

1. **Indispensable** : etapes 0 a 7 (auth + calendrier + reservations + contrats) -- l'app est deja utilisable
2. **Important** : etape 8 (finances)
3. **Utile** : etape 9 (factures)
4. **Securite long terme** : etape 10 (export) -- a ne JAMAIS sauter
5. **Confort** : etape 11 (polish)

L'etape 10 ne doit jamais etre negligee : c'est la garantie que les donnees ne seront jamais perdues, meme si Supabase disparait.
