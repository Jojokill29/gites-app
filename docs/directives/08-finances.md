# Directive étape 8 — Finances

Cible : implémenter la page Finances décrite dans `docs/01-cahier-des-charges.md` §7, en s'appuyant sur les tables `reservations`, `tax_entries` et `misc_entries` déjà créées en étape 2.

À traiter **après** la mini-tâche `08-pre-indicateur-contrat-manquant.md` qui doit être livrée et poussée d'abord.

---

## 1. Contexte

### Source de vérité
- `docs/01-cahier-des-charges.md` §7 — périmètre fonctionnel.
- `docs/03-modele-donnees.md` — tables `tax_entries`, `misc_entries`, requête SQL CA trimestriel.
- `docs/maquettes-gites.html` — section `tab-finances` pour le rendu visuel.
- `docs/05-decisions-a-trancher.md` — décision 1 (règle CA trimestriel).

### Hypothèses de départ confirmées en session Cowork du 2026-06-03

| Sujet | Décision |
|---|---|
| Misc_entries dans l'UI | Colonne dédiée dans le tableau + 4e metric-card "Notes diverses" |
| Modèle d'édition | Clic sur une ligne trimestre = modale détail avec listes éditables |
| Bouton "+ Ajouter une entrée" de la maquette | **Supprimé** — l'ajout passe par la modale détail trimestre |
| Nombre de réservations | Compté par `start_date` dans l'année (cohérent règle CA) |
| Misc_entries dans le CA | **Non** — métrique distincte. CA reste "pur" (`paid_amount` uniquement) |
| Bornes navigation année | `[2020, current_year + 1]` |
| Suppression d'une entrée | ConfirmDialog comme réservations (décision 20) |

---

## 2. Objectif fonctionnel

Permettre à Johan et Quentin :

1. De consulter le **chiffre d'affaires** trimestriel et annuel, calculé automatiquement depuis les réservations.
2. De **saisir manuellement** les taxes de séjour trimestrielles (`tax_entries`).
3. De **saisir manuellement** des notes financières libres trimestrielles (`misc_entries`, corrections, remboursements, frais ponctuels).
4. De **naviguer entre années** facilement, avec mise en évidence du trimestre courant.

---

## 3. Architecture

### Page

- Route existante : `/finances` (placeholder actuel à remplacer).
- Composant page : `src/pages/FinancesPage.tsx` (réécriture complète).

### Hooks

Créer **un seul hook** qui charge tout pour une année donnée :

- `src/hooks/useFinances.ts` — `useFinances(year: number)`.
- Retourne un objet structuré :
  ```ts
  {
    revenuesByQuarter: Record<1|2|3|4, number>,       // SUM(paid_amount) par trimestre
    taxesByQuarter: Record<1|2|3|4, number>,          // SUM(amount) par trimestre depuis tax_entries
    miscByQuarter: Record<1|2|3|4, number>,           // SUM(amount) par trimestre depuis misc_entries
    reservationCount: number,                          // COUNT pour l'année
    taxEntriesByQuarter: Record<1|2|3|4, TaxEntry[]>, // liste détaillée
    miscEntriesByQuarter: Record<1|2|3|4, MiscEntry[]>,
    isLoading: boolean,
    error: string | null,
    refetch: () => void,
  }
  ```
- Pattern identique à `useReservations` : pas de cache (décision 16), refetch systématique sur changement d'année via `useEffect([year])`, mécanisme `refetch()` via compteur `fetchKey` pour permettre aux modales CRUD de relancer le chargement après mutation.
- 4 requêtes Supabase en parallèle (`Promise.all`) :
  1. `reservations` filtrées par `start_date >= '{year}-01-01' AND start_date <= '{year}-12-31'`, on récupère `paid_amount` et `start_date` (pour calcul trimestriel côté client) — *NE PAS utiliser `EXTRACT` côté SQL via l'API JS Supabase, calculer côté client à partir des dates récupérées. Voir aussi piège 6.1 ci-dessous*.
  2. `tax_entries` filtrées `year = X`, tous les champs.
  3. `misc_entries` filtrées `year = X`, tous les champs.
  4. Aucun appel séparé pour `reservationCount` : c'est le `.length` du résultat #1.

### Composants à créer

- `src/pages/FinancesPage.tsx` — page principale (nav année, metric-cards, tableau).
- `src/components/finances/FinanceMetricCard.tsx` — petite carte réutilisable (label + value formatée EUR).
- `src/components/finances/FinanceTable.tsx` — tableau 4 lignes (T1-T4), 4 colonnes (Trimestre / CA / Taxes / Notes). Clic sur une ligne ouvre la modale.
- `src/components/finances/QuarterDetailModal.tsx` — modale détail d'un trimestre, montre 2 sections (Taxes / Notes) avec listes éditables + boutons "Ajouter".
- `src/components/finances/TaxEntryForm.tsx` — formulaire création/édition d'une `tax_entry`.
- `src/components/finances/MiscEntryForm.tsx` — formulaire création/édition d'une `misc_entry`.

### Types

Ajouter dans `src/types/domain.ts` :

```ts
export type TaxEntry = {
  id: string;
  amount: number;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  notes: string | null;
  created_at: string;
};

export type MiscEntry = {
  id: string;
  label: string;
  amount: number;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  notes: string | null;
  created_at: string;
};

export type Quarter = 1 | 2 | 3 | 4;
```

Aligner sur les types générés Supabase (`src/types/database.ts`) si déjà disponibles ; sinon regénérer via `npm run generate:types` (décision 12).

---

## 4. Détail des écrans

### 4.1 Page Finances (`FinancesPage.tsx`)

#### Layout vertical (du haut vers le bas)

1. **Barre de navigation année**
   - Bouton `<` (année - 1).
   - Label année en font Fraunces, taille `--month-label` (réutilise la classe existante ou pattern équivalent du calendrier).
   - Bouton `>` (année + 1).
   - Bouton "Année courante" à droite (visible uniquement si `year !== currentYear`).
   - Boutons `<` / `>` désactivés aux bornes `[2020, currentYear + 1]`.

2. **Metric-cards (grille de 4)**
   - "CA annuel" : somme des 4 `revenuesByQuarter`.
   - "Taxes de séjour" : somme des 4 `taxesByQuarter`.
   - "Notes diverses" : somme des 4 `miscByQuarter` (peut être négatif, afficher avec signe le cas échéant).
   - "Réservations" : `reservationCount` (entier, pas d'EUR).
   - Sur mobile : grille 2×2. Sur desktop : 4 colonnes.

3. **Tableau trimestriel** (`FinanceTable.tsx`)
   - 1 ligne d'en-tête : Trimestre / Chiffre d'affaires / Taxes de séjour / Notes diverses.
   - 4 lignes de données : T1, T2, T3, T4.
   - Format des libellés : "T1 — jan à mars", "T2 — avr à juin", "T3 — juil à sept", "T4 — oct à déc" (cf. maquette).
   - Trimestre courant (calculé depuis la date du jour, uniquement si `year === currentYear`) : background `var(--blue-bg)` + texte légèrement plus dense (font-weight 500).
   - Chaque ligne est cliquable (`cursor-pointer`, hover discret) → ouvre `QuarterDetailModal` pour ce trimestre.
   - Si `isLoading`, opacity réduite sur le tableau (stale-while-revalidate, comme calendrier).

#### URL

- `?year=2026` via `useSearchParams`, cohérent avec décision 15 (étape 5 — paramétrage mois dans l'URL).
- Au mount, si pas de `year` dans l'URL : utiliser l'année courante, **ne pas** mettre à jour l'URL (URL reste propre tant que l'utilisateur n'a pas navigué).
- Au clic sur `<` / `>` / "Année courante" : mettre à jour `searchParams`.
- L'URL est bookmarkable et survit au refresh.

### 4.2 Modale détail trimestre (`QuarterDetailModal.tsx`)

Réutilise `Modal.tsx` existant (décisions 19-20).

#### En-tête

- Titre : "T{n} {YYYY} — détail" (ex: "T3 2026 — détail").
- Sous-titre discret : période textuelle ("juil à sept").

#### Corps

Deux sections clairement séparées par un titre :

##### Section 1 : Taxes de séjour

- Liste des `tax_entries` du trimestre, chaque ligne : montant en EUR FR + notes (si présentes, sinon en italique "Pas de notes") + 2 boutons icône à droite : "Modifier" / "Supprimer".
- Si liste vide : message en italique "Aucune taxe de séjour enregistrée pour ce trimestre."
- Bouton "+ Ajouter une taxe" en bas de la section → ouvre `TaxEntryForm` en mode création (inline ou en sous-modal au choix de l'implémentation ; recommandation : inline dans la modale détail pour éviter le double overlay).

##### Section 2 : Notes diverses

- Liste des `misc_entries` du trimestre, chaque ligne : libellé + montant en EUR FR (afficher le signe pour les valeurs négatives, ex: "-150,00 EUR") + notes optionnelles + 2 boutons icône "Modifier" / "Supprimer".
- Si liste vide : "Aucune note financière pour ce trimestre."
- Bouton "+ Ajouter une note" en bas de la section.

#### Pied

- Bouton "Fermer" — ferme la modale. Pas de "Enregistrer" au niveau de la modale détail : chaque entrée est sauvegardée individuellement via son propre formulaire.

#### Comportement

- Échap, clic extérieur : ferme la modale sans confirmation (cohérent décision 20).
- À la fermeture : appeler `refetch()` du `useFinances` pour rafraîchir les totaux.

### 4.3 Formulaires d'entrée

#### `TaxEntryForm.tsx`

Création OU édition (mode déterminé par la prop `entry?: TaxEntry`). React-hook-form + zod.

Champs :

- **Montant** (obligatoire) — input numérique. Format français : virgule ou point acceptés en saisie, formatage en EUR FR à l'affichage. Validation : `> 0`.
- **Notes** (optionnel) — textarea, max 500 caractères.
- Pas de champ "Trimestre" ni "Année" — ils sont passés en prop (la modale détail connaît son contexte).

Validation zod :

```ts
const taxEntrySchema = z.object({
  amount: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(',', '.') : v),
    z.coerce.number().positive('Le montant doit être positif')
  ),
  notes: z.string().max(500).optional().or(z.literal('')),
});
```

Boutons : "Enregistrer" + "Annuler". Désactivés pendant un appel Supabase (décision 20). Labels "Enregistrement..." en cours.

#### `MiscEntryForm.tsx`

Identique à `TaxEntryForm` avec en plus :

- **Libellé** (obligatoire) — input text, max 200 caractères, ex: "Remboursement client M. Dupont".
- **Montant** (obligatoire) — peut être négatif (sortie). Validation : `z.coerce.number().refine(v => v !== 0, 'Le montant ne peut pas être zéro')`. Pas de borne signe.
- **Notes** (optionnel) — comme tax_entry.

---

## 5. Règles métier

### 5.1 Calcul du CA trimestriel

Conforme à la **décision 1** (`docs/05-decisions-a-trancher.md`) :

> Le CA d'un trimestre est la somme des `paid_amount` des réservations dont le `start_date` tombe dans le trimestre. Une réservation à cheval sur deux trimestres est entièrement comptée dans le trimestre de son `start_date`.

Côté front (cf. piège 6.1) :

```ts
const month = parseISO(reservation.start_date).getMonth(); // 0-11
const quarter = Math.floor(month / 3) + 1; // 1-4
```

### 5.2 Agrégations taxes et notes

- `taxesByQuarter[q]` = `SUM(amount) WHERE tax_entries.year = year AND tax_entries.quarter = q`.
- `miscByQuarter[q]` = `SUM(amount) WHERE misc_entries.year = year AND misc_entries.quarter = q` (peut être négatif).

Plusieurs entrées par trimestre sont possibles (pas de UNIQUE constraint, cf. doc 03). On somme.

### 5.3 Trimestre courant

```ts
const today = new Date();
const currentYear = today.getFullYear();
const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
```

Mise en évidence visuelle dans le tableau uniquement si `year === currentYear`.

### 5.4 Format des montants

- `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.
- Cohérent avec la fiche réservation étape 6 (champ "Reste à payer").
- Centraliser dans un helper `src/utils/money.ts` si pas déjà fait — créer si nécessaire.

---

## 6. Pièges à éviter (rappels)

### 6.1 Aucun `new Date(string)` (décision 14, incident étape 6)

Pour parser une date string ISO (`start_date` au format `"YYYY-MM-DD"`), utiliser **`parseISO` de `date-fns`** systématiquement. `new Date("2026-04-01")` interprète en UTC et décale d'un jour en heure d'été FR. Ce bug a coûté du temps à l'étape 6.

### 6.2 `<input type="number">` vide → `NaN` (étape 7, commit 4b5ef52)

Pour les champs nombre optionnels, appliquer le préprocesseur :

```ts
z.preprocess(
  (v) => (Number.isNaN(v) || v === '' ? undefined : v),
  z.coerce.number().optional()
)
```

Pour les champs obligatoires (`amount`), pas de préprocesseur — la validation `coerce.number().positive()` rejette `NaN` proprement avec le bon message FR.

Détails dans le `CLAUDE.md` du projet, section "Pieges frontend".

### 6.3 Pas de cache (décision 16)

Pas de React Query, pas de SWR. `useEffect([year])` + `refetch()` via compteur.

### 6.4 Design tokens uniquement (décision 25)

Pas de couleurs Tailwind brutes (`bg-gray-100`, `text-blue-600`). Utiliser `var(--surface)`, `var(--blue-bg)`, `var(--text-secondary)`, etc.

### 6.5 Boutons via `ui/Button.tsx` (décision 23)

Variantes `primary`, `secondary`, `danger` déjà disponibles. Ne pas restyler.

### 6.6 Modal et ConfirmDialog déjà existants

Réutiliser `src/components/ui/Modal.tsx` et `src/components/ui/ConfirmDialog.tsx`. Pattern d'erreur inline en haut de modale (décision 19) à reproduire dans `QuarterDetailModal`.

### 6.7 RLS Supabase

Les tables `tax_entries` et `misc_entries` ont déjà des policies "authenticated full access" (étape 2). Aucun changement à apporter.

### 6.8 Types stricts (décision 21)

`tsconfig.app.json` est en `strict: true`. Pas de `any`. Type `Quarter` union littérale `1 | 2 | 3 | 4` (cf. décision 24 sur le typage strict des énumérations).

---

## 7. Découpage en commits

Adrien ne valide plus entre lots (décision 36) ; les commits sont poussés à la fin de l'étape, mais l'historique reste découpé en commits atomiques pour la lisibilité.

Ordre recommandé :

1. `docs: add directive for step 8` — copier la directive (ce fichier) dans le repo et la committer en premier (décision 26).
2. `feat(types): add TaxEntry, MiscEntry, Quarter domain types` — ajout dans `domain.ts`.
3. `feat(finances): add useFinances hook` — création du hook seul, sans branchement UI.
4. `feat(finances): add FinanceMetricCard + FinanceTable (read-only)` — affichage en lecture seule (sans modale).
5. `feat(finances): wire FinancesPage with year navigation` — page complète en lecture, URL `?year=`, bornes, mise en évidence trimestre courant.
6. `feat(finances): add QuarterDetailModal (read-only)` — modale détail qui liste les entrées, encore sans CRUD.
7. `feat(finances): add TaxEntryForm with create/edit/delete` — formulaire taxes + branchement CRUD complet.
8. `feat(finances): add MiscEntryForm with create/edit/delete` — idem pour les notes.
9. `chore(finances): add money formatting helper if not exists` (à insérer plus tôt si extrait d'emblée).

Push final unique sur la branche principale après que tous les commits soient prêts. Pas de pause de validation intermédiaire entre commits (décision 36).

**Si un commit casse le typage** (`tsc --noEmit` échoue) : ne pas commit, fixer d'abord. Les commits doivent toujours pouvoir builder.

---

## 8. Tests à valider sur Vercel

Après le push, Adrien teste **uniquement sur Vercel** (décision 36).

### Tests fonctionnels

1. Naviguer vers `/finances` depuis la TabBar — page se charge sans erreur.
2. Année courante affichée par défaut, sans paramètre URL.
3. Navigation `<` / `>` : URL met à jour `?year=`, données rechargent.
4. Bouton "Année courante" : revient à l'année courante, disparaît quand on y est.
5. Bornes : impossible d'aller en-dessous de 2020 ou au-dessus de `currentYear + 1` (boutons désactivés).
6. Refresh sur `/finances?year=2024` : reste sur 2024 après refresh (URL persistante).
7. Tableau : 4 lignes T1-T4 toujours présentes, même si trimestres vides (montrent 0,00 EUR).
8. Trimestre courant mis en évidence uniquement pour l'année courante.
9. Clic sur une ligne trimestre : modale s'ouvre.
10. Modale : sections Taxes et Notes affichées même si vides (avec leur message respectif).
11. Ajouter une taxe → liste se met à jour dans la modale, total dans le tableau se met à jour à la fermeture.
12. Modifier une taxe → idem, montant change.
13. Supprimer une taxe → ConfirmDialog, puis suppression.
14. Idem pour les notes (avec montants négatifs autorisés).
15. CA annuel cohérent : créer une réservation avec `paid_amount = 1000`, `start_date` dans T2 2026 → CA T2 = 1000, CA annuel = 1000.
16. Réservation à cheval sur 2 trimestres : comptée dans le trimestre de `start_date` uniquement (cf. décision 1).
17. Nombre de réservations correct (count des `start_date` dans l'année).
18. Échap et clic extérieur ferment la modale.
19. Mobile 375px : layout responsive, metric-cards en 2×2, tableau lisible.

### Tests techniques

- `npm run generate:types` exécuté ? (Si la directive n'introduit pas de schéma BDD nouveau, non requis.)
- `npm run build` passe sans erreur TypeScript.
- Pas d'erreur dans la console Vercel sur les écrans testés.
- Pas d'erreur réseau Supabase (vérifier l'onglet réseau pour les 4 requêtes parallèles).

---

## 9. Hors périmètre étape 8

À ne **pas** implémenter dans cette étape, même si tentant :

- Export CSV / Excel des finances (étape 10 / Export).
- Graphiques (camembert, barres). Strictement tableau + cartes.
- Comparaison année N vs N-1.
- Filtrage du tableau par gîte (le CA est consolidé sur les 2 gîtes, pas de séparation demandée).
- Notification automatique de trimestre clos.
- Historique des modifications d'une `tax_entry` ou `misc_entry`.

Si Claude Code identifie une amélioration tentante hors périmètre, la noter dans un commit `chore` séparé ou en commentaire de PR, mais ne pas l'implémenter.

---

## 10. Estimation et points d'attention

### Complexité

Étape moyenne-grosse : ~9 commits, 6 fichiers nouveaux, 0 migration BDD. Plus longue que l'étape 7 (contrats) mais sans interaction Storage. Tout est BDD + UI.

### Points de vigilance

- **Calcul trimestre** : `Math.floor(month / 3) + 1` est correct si `month` est 0-indexé (sortie de `getMonth()`). À vérifier dans les tests (réservation `start_date = "2026-04-01"` → mois 3 → trimestre 2 OK).
- **Format des montants** : `Intl.NumberFormat` français produit `1 234,56 EUR` avec un espace insécable. Vérifier visuellement la cohérence.
- **Année min/max dynamique vs statique** : on a choisi statique `[2020, currentYear + 1]`. Si Adrien crée une réservation en 2030 par erreur, on ne la verra pas dans les finances. Comportement accepté.
- **Misc_entries à montant zéro** : interdit par validation (cf. `MiscEntryForm`). Si une entrée à 0 existe en BDD (créée à la main), l'afficher quand même en lecture.

---

## 11. Mise à jour de la doc après l'étape

Une fois l'étape actée :

- Ajouter une entrée "Étape 8 — Finances : TERMINÉE (2026-XX-XX)" dans `SESSION_MEMORY.md`.
- Si des décisions structurantes ont émergé pendant l'implémentation (ex: choix de UI imprévu, pattern réutilisable), les ajouter à la section "Décisions structurantes" du `SESSION_MEMORY.md`.
- Mettre à jour `docs/README.md` si la directive doit y être référencée.
- `CLAUDE.md` à mettre à jour si un nouveau piège front a été découvert (ex: format `Intl.NumberFormat` espace insécable et tests).

---

## Fin de directive

Si Claude Code rencontre une ambiguïté majeure non couverte ici, **demander à Adrien avant d'implémenter** (cohérent CLAUDE.md global "Poser des questions avant de faire des tâches majeures ou en cas de doutes quant aux attentes").

Pour les ambiguïtés mineures (nommage de variable, ordre de champs dans un formulaire) : trancher en s'alignant sur les patterns des étapes 5/6/7.
