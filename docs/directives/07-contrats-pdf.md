# Directive Claude Code — Étape 7 : Contrats (PDF + images)

Cette directive complète `gites/docs/04-plan-developpement.md` (étape 7) et `gites/docs/03-modele-donnees.md` (bucket `contracts`). En cas de contradiction, cette directive fait foi pour l'étape 7 ; je mettrai à jour la doc 03 en parallèle.

---

## Objectif

Permettre à Johan et Quentin d'attacher un contrat scanné à chaque réservation, de le consulter (aperçu dans une lightbox interne), de le remplacer ou de le retirer, depuis la fiche réservation. Stockage privé, accès via URL signée temporaire uniquement.

---

## Préalable bugfix (ajouté 2026-06-03)

**Avant toute autre chose**, l'état du repo local d'Adrien est incohérent suite à un incident : deux instances Claude Code ont édité en parallèle les fichiers de la fiche réservation, l'une a planté en cours d'écriture. Trois fichiers sont tronqués au milieu d'une ligne dans le working tree (non commités) :

- `src/components/reservation/ReservationForm.tsx`
- `src/components/reservation/ReservationModal.tsx`
- `src/constants/labels.ts`

Les versions tronquées sont sauvegardées dans `.bugfix-recovery/` (à la racine du projet, dans `.gitignore`) avec un patch `bugfix-attempt.patch` pour référence. Tu peux les consulter pour comprendre l'intention, mais **ne les utilise pas comme base de travail** — elles sont cassées.

### Étape 1 — Restaurer les 3 fichiers depuis HEAD

```bash
git checkout HEAD -- src/components/reservation/ReservationForm.tsx \
                     src/components/reservation/ReservationModal.tsx \
                     src/constants/labels.ts
```

Cela remet l'état du dernier commit `061d086 feat(reservations): integrate contract upload into reservation modal`.

### Étape 2 — Refaire le bugfix sur le formulaire

Bugfix `src/components/reservation/ReservationForm.tsx` : les champs **Nombre de personnes**, **Sets de draps (lits simples)** et **Sets de draps (lits doubles)** sont marqués "optionnel" dans le placeholder mais déclenchent l'erreur zod `Invalid input: expected number, received NaN` quand on les laisse vides.

Cause : `<input type="number">` vide renvoie `NaN` au lieu de `undefined`, et le schéma zod refuse `NaN`.

Correctif attendu :
- Sur ces 3 champs uniquement, passer le schéma à `z.preprocess(v => (v === "" || v === null || Number.isNaN(v)) ? undefined : v, z.coerce.number().int().positive().optional())` (avec `.nonnegative()` au lieu de `.positive()` pour les sets de draps, conformément à la doc 03 qui autorise 0).
- Côté INSERT/UPDATE Supabase : envoyer `null` quand la valeur est `undefined` (pas `0`, pas `""`), pour respecter les colonnes nullable.
- Ne rien changer aux autres champs (dates, total, déjà payé, statut, nom du client restent obligatoires comme avant).

Test manuel à passer sur Vercel : créer une réservation avec ces 3 champs vides → enregistrement OK, valeurs `NULL` en base. Éditer ensuite cette réservation et resaisir une valeur → enregistrement OK. Éditer une réservation qui avait déjà des valeurs et les effacer → enregistrement OK, passage à `NULL`.

### Étape 3 — Commit le bugfix

```
fix(reservation-form): accept empty optional number fields without zod NaN error
```

Ce commit doit être atomique (uniquement le bugfix, pas la lightbox).

### Étape 4 — Enchaîner sur la lightbox

Une fois le bugfix commité, appliquer les ajouts décrits plus bas (sections `ContractPreviewModal.tsx`, mise à jour de `ContractField.tsx`, nouveaux libellés). Voir le plan de commits mis à jour en bas de directive.

---

## Périmètre

### Inclus
- Upload d'un fichier (PDF, JPG ou PNG) dans le bucket `contracts`
- Consultation via URL signée (10 minutes), affichée dans une lightbox interne à l'app (PDF dans un iframe, images dans une balise `<img>`)
- Remplacement (le précédent fichier est supprimé du Storage)
- Retrait (sans supprimer la réservation : `contract_path` repasse à NULL et le fichier est supprimé)
- Suppression automatique du fichier quand la réservation est supprimée
- Compression côté client des images JPG/PNG avant upload (qualité 0.8, max 2000px), comme déjà prévu pour l'étape 9

### Exclu
- Génération automatique de contrats (v2)
- Drag-and-drop sur desktop (l'input file natif suffit, cohérent avec le focus mobile-first)

---

## Décisions tranchées avec Adrien (2026-06-03)

1. **Taille maximum** : 10 Mo avant compression. Refus côté front si dépassé, avec message FR clair.
2. **Types acceptés** : `application/pdf`, `image/jpeg`, `image/png`. Tout autre type → refus côté front.
3. **Moment de l'upload** : **immédiat dès le choix du fichier**, avant l'enregistrement de la réservation. Gestion des orphelins ci-dessous.
4. **Retrait du contrat** sans suppression de la réservation : oui, bouton dédié.
5. **Chemin de stockage** : `contracts/{uuid}.{ext}` où `ext ∈ {pdf, jpg, png}`. **Modifie le chemin prévu en doc 03** (`{uuid}.pdf` uniquement). À mettre à jour dans la doc.
6. **Aperçu lightbox plein écran** (ajouté 2026-06-03, revient sur l'exclusion initiale "Aperçu inline du PDF") : le bouton "Voir" ouvre une modale superposée qui affiche le contrat en grand, sans quitter l'app. Iframe pour les PDF, balise `<img>` pour les images. Repli "Ouvrir dans un nouvel onglet" toujours présent en bas de la lightbox, au cas où l'iframe ne s'affiche pas correctement (notamment iPhone Safari). Même comportement sur mobile et desktop.

---

## Architecture des fichiers

### Nouveaux fichiers

```
src/lib/storage.ts              # 4 fonctions de manipulation du bucket
src/utils/contractFile.ts       # validation type/taille + compression image
src/components/contracts/ContractField.tsx
```

### Fichiers modifiés

```
src/components/reservations/ReservationForm.tsx   # intègre ContractField
src/components/reservations/ReservationModal.tsx  # orchestre cleanup des orphelins
src/constants/labels.ts                           # nouveaux libellés FR
src/types/database.ts                             # rien à modifier (contract_path existe déjà)
```

### Dépendance npm à installer

`browser-image-compression` est listé dans la doc 04 étape 1 — vérifier qu'elle est bien installée. Si non : `npm install browser-image-compression`.

---

## `src/lib/storage.ts`

Module isolé pour toute interaction avec le bucket `contracts`. Aucune importation directe de `supabase.storage` ailleurs dans le code.

### Signatures attendues

```typescript
// Uploade un fichier déjà validé. Retourne le path stocké en base.
// Génère l'UUID en interne via crypto.randomUUID().
export async function uploadContract(file: File): Promise<string>

// Génère une URL signée valide 10 minutes. Jamais d'URL publique.
export async function getContractSignedUrl(path: string): Promise<string>

// Supprime le fichier du Storage. Idempotent (ne lève pas si déjà absent).
export async function deleteContract(path: string): Promise<void>
```

Pas de fonction `replaceContract` séparée : la logique de remplacement (upload nouveau + suppression ancien) est gérée au niveau du composant `ReservationModal` pour bien séquencer les opérations avec la mutation BDD.

### Règles de gestion

- L'extension est dérivée du type MIME, pas du nom de fichier original (évite les `.PDF` en majuscules, les noms exotiques, etc.). Mapping : `application/pdf` → `pdf`, `image/jpeg` → `jpg`, `image/png` → `png`.
- En cas d'échec de `deleteContract`, on log mais on ne re-throw pas : un orphelin dans Storage est acceptable, une exception remontée jusqu'à l'UI ne l'est pas.
- En cas d'échec de `uploadContract`, on throw une erreur dont le message sera capté par le composant pour afficher le bandeau inline.

---

## `src/utils/contractFile.ts`

Validation et préparation du fichier avant upload.

```typescript
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export type ContractFileError =
  | 'invalid_type'
  | 'file_too_large';

// Vérifie type MIME et taille. Retourne null si OK, sinon le code d'erreur.
export function validateContractFile(file: File): ContractFileError | null

// Si le fichier est une image, retourne une version compressée.
// Si c'est un PDF, retourne le fichier tel quel.
// Compression : qualité 0.8, dimension max 2000px (cohérent avec étape 9).
export async function prepareContractFile(file: File): Promise<File>
```

Les messages d'erreur français correspondants sont définis dans `labels.ts` (voir plus bas).

---

## `src/components/contracts/ContractField.tsx`

Composant intégré dans `ReservationForm`. Il n'utilise pas `react-hook-form` directement pour le fichier (un `File` ne se prête pas bien à `register`). Il gère son propre état local et expose au parent une API simple.

### Props

```typescript
interface ContractFieldProps {
  // Path déjà persisté en base (mode édition), ou null (mode création / pas encore de contrat).
  currentPath: string | null;

  // Path nouvellement uploadé pendant la session courante (pas encore persisté).
  // Permet au composant de gérer l'affichage et au parent de nettoyer si besoin.
  pendingPath: string | null;

  // Indique au parent qu'un nouveau fichier a été uploadé.
  // Le parent décide quoi en faire à l'enregistrement.
  onUploaded: (newPath: string) => void;

  // Indique au parent que l'utilisateur veut retirer le contrat existant.
  onRemoveRequested: () => void;
}
```

### Comportement par état

**État "aucun contrat" (currentPath null + pendingPath null)** :
- Bouton "Téléverser un contrat"
- Texte d'aide : "PDF, JPG ou PNG, 10 Mo maximum"
- Au clic : ouvre le sélecteur de fichier natif (input `accept="application/pdf,image/jpeg,image/png"`)
- Au choix d'un fichier : validation → compression si image → upload → `onUploaded(path)`
- Pendant l'upload : spinner + bouton désactivé + texte "Téléversement en cours…"
- Si validation échoue : bandeau d'erreur inline dans le composant (sous le bouton)
- Si upload échoue : bandeau d'erreur inline

**État "contrat existant" (currentPath non null, pendingPath null)** :
- Texte "Contrat attaché"
- Bouton "Voir" : ouvre `<ContractPreviewModal path={currentPath} onClose={...} />` (voir section dédiée plus bas). Le composant gère lui-même la génération de l'URL signée. Plus de `window.open` direct depuis `ContractField`.
- Bouton "Remplacer" : ouvre le sélecteur de fichier, même flow que ci-dessus, `onUploaded` est appelé avec le nouveau path
- Bouton "Retirer" : appelle `onRemoveRequested()`. Pas de confirmation supplémentaire ici (la suppression effective ne se produit qu'à l'enregistrement de la réservation)

**État "remplacement en cours" (currentPath non null, pendingPath non null)** :
- Texte "Nouveau contrat prêt à enregistrer. L'ancien sera supprimé après enregistrement."
- Bouton "Annuler le remplacement" qui rend `pendingPath` à null côté parent (le parent gère le cleanup du fichier orphelin)

**État "retrait en attente"** : géré au niveau du parent via un flag séparé (`pendingRemoval`), pas dans `ContractField`.

### Note d'accessibilité

- Le bouton "Voir" doit avoir `aria-label="Afficher le contrat"`.
- L'input file natif est masqué visuellement mais accessible au clavier (déclenché via un `<label>` ou un click programmatique sur ref).

---

## `src/components/contracts/ContractPreviewModal.tsx`

Composant dédié à l'affichage du contrat dans une lightbox interne. Réutilise le `Modal.tsx` existant (créé à l'étape 6, qui gère déjà overlay sombre, Échap, clic extérieur, focus management, scroll bloqué sur le body).

### Props

```typescript
interface ContractPreviewModalProps {
  // Path du contrat à afficher (jamais null — le parent n'ouvre la lightbox que s'il y a un path).
  path: string;

  // Fermeture demandée par l'utilisateur (clic extérieur, Échap, bouton "Fermer").
  onClose: () => void;
}
```

### Comportement

1. À l'ouverture (montage du composant) : appeler `getContractSignedUrl(path)` une seule fois. Pendant l'attente, afficher le libellé `previewLoading` ("Chargement du contrat…") + spinner.
2. Si l'appel réussit : déterminer le type d'affichage à partir de l'extension du `path` (`.pdf` → iframe, `.jpg` ou `.png` → balise `<img>`). Stocker l'URL signée et la rendre.
3. Si l'appel échoue : afficher le libellé `previewErrorLoad` ("Impossible d'afficher le contrat. Essayez de l'ouvrir dans un nouvel onglet."). Le lien de repli reste cliquable.
4. En bas de la lightbox, **toujours** afficher un lien discret `previewOpenInNewTab` ("Ouvrir dans un nouvel onglet") qui ouvre l'URL signée via `window.open(url, '_blank', 'noopener,noreferrer')`. C'est le repli iOS Safari (certains PDF ne s'affichent pas dans un iframe sur iPhone).

### Layout

- Largeur : `90vw` max sur desktop, `100vw` sur mobile. Hauteur : `90vh` max sur desktop, `100vh` sur mobile.
- Pour les PDF : `<iframe src={signedUrl} style={{ width: '100%', height: '100%', border: 0 }} title="Aperçu du contrat" />`.
- Pour les images : `<img src={signedUrl} alt="Aperçu du contrat" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />` centrée dans le conteneur.
- Pas de toolbar custom au-dessus (les contrôles natifs du PDF dans l'iframe suffisent : zoom, téléchargement, recherche).
- Bouton "Fermer" en haut à droite (croix) + le lien repli en bas. Cohérent décision 19 (pas de confirmation à la fermeture).

### Sécurité

- L'URL signée n'est **jamais loggée**, ni stockée dans `localStorage`, ni passée dans l'URL de navigation. Elle reste en mémoire dans le state du composant et est invalide automatiquement après 10 minutes (durée définie dans `getContractSignedUrl`).
- **Pas de `sandbox` sur l'iframe**. Décision prise après tests (2026-06-03) : `sandbox="allow-same-origin"` bloquait l'affichage des PDF dans Chrome avec le message "Cette page a été bloquée par Chrome", parce que le contenu vient de Supabase Storage (cross-origin par rapport à Vercel) et que ce sandbox exige le same-origin. Les contrats étant uploadés par les utilisateurs eux-mêmes dans leur propre bucket privé (signed URL), le risque d'embedded JS malveillant est nul. Le sandbox gênait plus qu'il ne protégeait.

### Accessibilité

- Titre lisible par screen reader : `aria-labelledby` sur la modale pointant vers un `<h2>` avec le libellé `previewTitle` ("Contrat"). Le `<h2>` peut être visuellement masqué (`sr-only`) si la lightbox n'a pas de titre visible.
- Le bouton "Fermer" : `aria-label="Fermer l'aperçu du contrat"`.

---

## `ReservationModal` — orchestration

C'est le composant qui gère la cohérence Storage ↔ BDD. Il tient un état local pour le contrat :

```typescript
const [pendingContractPath, setPendingContractPath] = useState<string | null>(null);
const [pendingRemoval, setPendingRemoval] = useState(false);
```

### À l'enregistrement (Submit)

Logique séquentielle (pas de Promise.all, on a besoin du résultat de la mutation BDD avant de toucher au Storage) :

1. Construire le `contract_path` final :
   - Si `pendingContractPath` non null → c'est lui
   - Sinon si `pendingRemoval` → null
   - Sinon → `currentPath` (inchangé)
2. INSERT ou UPDATE de la réservation avec ce `contract_path`.
3. Si la mutation BDD réussit :
   - Si remplacement (ancien + nouveau) : `deleteContract(oldPath)`
   - Si retrait (ancien + null) : `deleteContract(oldPath)`
4. Fermer la modale.
5. Si la mutation BDD échoue :
   - Si on avait uploadé un nouveau fichier (`pendingContractPath` non null), on le supprime du Storage pour ne pas laisser d'orphelin.
   - On affiche le bandeau d'erreur, on **ne ferme pas** la modale.

### À l'annulation (Échap, clic extérieur, bouton "Annuler")

- Si `pendingContractPath` non null : `deleteContract(pendingContractPath)` (orphelin créé pendant cette session).
- L'ancien `currentPath` n'est jamais touché (la réservation reste en l'état).
- Pas de confirmation des modifications non enregistrées (cohérent décision 20).

### À la suppression de la réservation (bouton "Supprimer")

1. DELETE de la réservation en BDD.
2. Si succès et `currentPath` non null : `deleteContract(currentPath)`.
3. Si on a aussi un `pendingContractPath` en cours (cas peu probable mais possible) : `deleteContract(pendingContractPath)`.
4. Fermer la modale.

L'ordre BDD-puis-Storage garantit qu'on ne perd pas le fichier d'une réservation qui existe encore si le DELETE échoue.

---

## Libellés à ajouter dans `src/constants/labels.ts`

```typescript
contracts: {
  fieldTitle: 'Contrat',
  upload: 'Téléverser un contrat',
  view: 'Voir',
  replace: 'Remplacer',
  remove: 'Retirer',
  cancelReplacement: 'Annuler le remplacement',
  uploading: 'Téléversement en cours…',
  attached: 'Contrat attaché',
  helperText: 'PDF, JPG ou PNG, 10 Mo maximum',
  replacementPending: 'Nouveau contrat prêt à enregistrer. L\'ancien sera supprimé après enregistrement.',
  removalPending: 'Le contrat sera retiré à l\'enregistrement.',
  previewTitle: 'Contrat',
  previewLoading: 'Chargement du contrat…',
  previewClose: 'Fermer',
  previewOpenInNewTab: 'Ouvrir dans un nouvel onglet',
  previewErrorLoad: 'Impossible d\'afficher le contrat. Essayez de l\'ouvrir dans un nouvel onglet.',
  errors: {
    invalidType: 'Format de fichier non accepté. Utilisez un PDF, un JPG ou un PNG.',
    fileTooLarge: 'Le fichier dépasse 10 Mo. Réduisez sa taille avant de réessayer.',
    uploadFailed: 'Le téléversement a échoué. Vérifiez votre connexion et réessayez.',
    signedUrlFailed: 'Impossible de générer le lien d\'accès au contrat. Réessayez dans quelques instants.',
  },
}
```

---

## Conventions à respecter (rappels)

- **Strict TypeScript** : `tsc --noEmit` doit passer sans warning. Pas de `any`.
- **Design tokens** : utiliser `bg-surface`, `bg-bg`, `text-text`, `font-heading`, `font-body`. Pas de couleurs Tailwind brutes.
- **Composant Button** : utiliser `src/components/ui/Button.tsx` avec les variantes `primary` / `secondary` / `danger`. "Téléverser", "Remplacer", "Voir" → `secondary`. "Retirer" → `danger`.
- **`parseISO`** systématique pour toute date côté front. Aucun `new Date("string")`.
- **Pattern modale étape 6** : bandeau d'erreur inline en haut, boutons désactivés pendant l'opération, fermeture sans confirmation.

---

## Plan de commits suggéré

1. `feat(storage): add storage lib for contracts bucket`  
   `src/lib/storage.ts` + `src/utils/contractFile.ts`. Pas encore branché à l'UI. **(Livré : `f24714a`)**
2. `feat(contracts): add ContractField component`  
   `src/components/contracts/ContractField.tsx` + labels FR. **(Livré : `2b4d41e`)**
3. `feat(reservations): integrate contract upload into reservation modal`  
   Modifs `ReservationForm` et `ReservationModal`, orchestration du cleanup orphelins. **(Livré : `061d086`)**
4. `fix(reservation-form): accept empty optional number fields without zod NaN error`  
   **Ajouté 2026-06-03.** Voir section "Préalable bugfix" en début de directive. Doit être commité **avant** la lightbox.
5. `feat(contracts): add ContractPreviewModal lightbox`  
   **Ajouté 2026-06-03.** Nouveau composant `src/components/contracts/ContractPreviewModal.tsx` + intégration dans `ContractField` (bouton "Voir" → lightbox au lieu de `window.open`). Nouveaux libellés FR pour l'aperçu.
6. `feat(reservations): delete contract on reservation deletion`  
   Branchement dans la logique de suppression.
7. `style(contracts): polish field layout and mobile spacing`  
   Ajustements visuels après tests.

**Ne pas pousser sur GitHub avant validation d'Adrien** (cf. décision 27 SESSION_MEMORY : commits locaux groupés, push après revue).

---

## Tests manuels obligatoires (à passer sur Vercel, pas seulement en local)

| Cas | Attendu |
|---|---|
| Création réservation sans contrat | OK, `contract_path` reste NULL |
| Création réservation avec PDF | PDF visible dans bucket via dashboard, `contract_path` rempli |
| Création réservation avec JPG | JPG compressé (< taille originale) visible dans bucket |
| Création + annulation après upload | Pas de fichier orphelin dans bucket |
| Édition + ajout PDF | OK |
| Édition + remplacement | Ancien fichier disparu du bucket, nouveau présent |
| Édition + remplacement + annulation | Ancien fichier toujours présent, nouveau supprimé |
| Édition + retrait | `contract_path` NULL, fichier disparu du bucket |
| Édition + retrait + annulation | Aucun changement, fichier toujours présent |
| Suppression réservation avec contrat | Réservation et fichier disparus tous les deux |
| Upload fichier 12 Mo | Refus côté front, message FR clair |
| Upload fichier .docx | Refus côté front, message FR clair |
| Clic "Voir" sur un PDF | Lightbox s'ouvre, PDF affiché dans l'iframe avec contrôles natifs (zoom, recherche, téléchargement) |
| Clic "Voir" sur un JPG ou PNG | Lightbox s'ouvre, image affichée centrée, non déformée |
| Fermeture de la lightbox (Échap, clic extérieur, croix) | Retour à la fiche réservation, état préservé |
| Clic "Ouvrir dans un nouvel onglet" depuis la lightbox | Contrat ouvert dans un nouvel onglet du navigateur |
| Test lightbox sur iPhone (Safari iOS) | PDF affiché dans l'iframe si possible, sinon repli "Ouvrir dans un nouvel onglet" disponible |
| Création réservation avec champs optionnels vides (Nombre de personnes, Sets de draps) | Enregistrement OK, valeurs `NULL` en base (cf. bugfix Étape 7-préalable) |
| Édition réservation existante : effacer un champ optionnel rempli | Enregistrement OK, passage à `NULL` en base |
| Tentative d'accès à l'URL signée 11 minutes après génération | Erreur 403 attendue (validation manuelle, copier l'URL puis attendre) |
| Mobile 375px | Boutons accessibles, pas de débordement, lightbox utilisable |

Cocher tous les cas avant de déclarer l'étape terminée. Sur le pattern récurrent identifié dans `SESSION_MEMORY.md` : ne pas annoncer l'étape comme finie tant que ces tests n'ont pas tous été faits **sur Vercel** (pas seulement `localhost:5173`).

---

## Question ouverte pour Cowork après livraison

- Faudra-t-il afficher un indicateur visuel "Contrat manquant" sur la barre du calendrier (étape 5) quand `contract_path` est NULL et statut `pending_contract` ? Décision à prendre quand on aura vu la fiche en pratique. À ajouter à `SESSION_MEMORY.md` comme nice-to-have éventuel.
