# Directive étape 8 — Finances (révisée 2026-06-04 v3)

Onglet Finances = **journal de saisie manuelle pure**, totalement indépendant des réservations. Deux types d'opérations (CA, Taxes de séjour) + notes financières libres. Date saisie en texte libre, trimestre déterminé par le contexte de saisie (clic dans T1/T2/T3/T4), tri par ordre de saisie.

À traiter après la mini-tâche `08-pre-indicateur-contrat-manquant.md`.

---

## 1. Sources de vérité

- `docs/01-cahier-des-charges.md` §7 (mis à jour).
- `docs/03-modele-donnees.md` (mis à jour : 2 nouvelles tables `revenue_entries` et `tax_stays`, `tax_entries` supprimée, swap display_order, `reservations` INCHANGÉE).
- `docs/maquette-finances-v2.html` (référence visuelle générale ; ignorer l'édition inline et la ligne annexe mélangée aux séjours — non valables dans cette version).
- `CLAUDE.md` à la racine.

---

## 2. Principes clés

- **Indépendance totale** entre la fiche réservation (étape 6) et l'onglet Finances. Une réservation ne crée pas d'opération Finances et inversement. Les valeurs saisies dans l'un ne se reflètent pas dans l'autre.
- **L'étape 6 n'est pas modifiée** par cette directive : pas d'ajout de `adult_count` ou `tax_amount` sur `reservations`. La fiche réservation reste exactement comme livrée.
- **Saisie pure** : Johan enregistre chaque opération à la main pour avoir un suivi. Pas de calcul auto à partir des réservations.

---

## 3. Décisions tranchées

| Sujet | Décision |
|---|---|
| Indépendance Finances ↔ Réservations | Totale. Pas de FK, pas de double saisie. |
| Date des opérations | Texte libre (`TEXT`), juste indicatif. Pas de date picker. |
| Trimestre | Saisi par le contexte du clic (Johan clique sur T2 → l'opération est rattachée à T2). Stocké explicitement dans la table. |
| Année | Définie par la navigation année en cours, stockée explicitement dans la table. |
| Tri | Par `created_at` ASC (ordre d'enregistrement, plus ancienne en haut). |
| Gîte | Dropdown à 3 valeurs : "Petit gîte", "Grand gîte", "Annexe". Stocké en `TEXT`. |
| Montant taxe (opération taxe) | Optionnel. Si renseigné, comptabilisé dans le total annuel/trimestriel. |
| Pas d'édition inline | Toute édition passe par une modale dédiée (`RevenueEntryModal`, `TaxStayModal`, `MiscEntryModal`). |
| Inversion display_order | Petit gîte → 1, Grand gîte → 2. |
| `tax_entries` (ancienne) | DROP TABLE. |
| `misc_entries` | Conservée. |
| Bornes année | `[2020, currentYear + 1]`. |

---

## 4. Migration BDD

Une seule migration (`supabase/migrations/YYYYMMDDHHMMSS_finances_setup.sql`) :

1. `DROP TABLE tax_entries;`
2. `UPDATE gites SET display_order = 1 WHERE name = 'Petit gite';` puis `UPDATE gites SET display_order = 2 WHERE name = 'Grand gite';`
3. `CREATE TABLE revenue_entries` (CA, schéma ci-dessous).
4. `CREATE TABLE tax_stays` (Taxes de séjour, schéma ci-dessous).
5. RLS "authenticated full access" sur les 2 nouvelles tables, comme les autres tables.
6. Régénérer les types TS via `npm run generate:types`.

### Schéma `revenue_entries`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() |
| `gite_label` | TEXT | NOT NULL CHECK IN ('Petit gite', 'Grand gite', 'Annexe') |
| `amount` | NUMERIC(10,2) | NOT NULL CHECK >= 0 |
| `entry_date` | TEXT | nullable (saisie libre par Johan) |
| `year` | INTEGER | NOT NULL CHECK BETWEEN 2020 AND 2100 |
| `quarter` | INTEGER | NOT NULL CHECK BETWEEN 1 AND 4 |
| `notes` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

### Schéma `tax_stays`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() |
| `gite_label` | TEXT | NOT NULL CHECK IN ('Petit gite', 'Grand gite', 'Annexe') |
| `stay_dates` | TEXT | nullable (saisie libre, ex: "14 au 21 juillet") |
| `nights_count` | INTEGER | NOT NULL CHECK > 0 |
| `adult_count` | INTEGER | NOT NULL CHECK > 0 |
| `amount` | NUMERIC(10,2) | nullable CHECK (amount IS NULL OR amount >= 0) |
| `year` | INTEGER | NOT NULL CHECK BETWEEN 2020 AND 2100 |
| `quarter` | INTEGER | NOT NULL CHECK BETWEEN 1 AND 4 |
| `notes` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

---

## 5. Page Finances

Route `/finances` (placeholder à remplacer). Référence visuelle générale : `docs/maquette-finances-v2.html`.

### Layout

1. **Navigation année** : `<` / label année / `>` + bouton "Année courante". Bornes désactivées.
2. **4 metric-cards** annuelles : Total CA / Total Taxes (seulement amount NOT NULL) / Total Notes diverses / Nombre d'opérations (somme revenue + tax + misc).
3. **Tableau trimestriel** : 4 colonnes (Trimestre / CA / Taxes / Notes diverses), 4 lignes T1-T4. Trimestre courant en surbrillance bleue (uniquement année courante). Une seule ligne ouverte à la fois.
4. **Accordion trimestre** (3 sections, chacune autonome) :
   - **Section "Chiffre d'affaires"** : liste des `revenue_entries` du trimestre (triées par `created_at` ASC). Chaque ligne : gîte (pill couleur) / date (texte) / montant / notes / boutons modifier + supprimer. Bouton "+ Ajouter une opération CA" en bas.
   - **Section "Taxes de séjour"** : liste des `tax_stays` du trimestre. Chaque ligne : gîte / dates (texte) / nuits / adultes / montant (si renseigné) / notes / boutons modifier + supprimer. Bouton "+ Ajouter une opération Taxe".
   - **Section "Notes diverses"** : liste des `misc_entries` du trimestre, CRUD complet.

### URL

- `?year=2026` via `useSearchParams`. Bookmarkable.

---

## 6. Architecture (composants à créer)

- `src/hooks/useFinances.ts` — charge pour une année : `revenue_entries`, `tax_stays`, `misc_entries`. Pattern `useReservations` : pas de cache, refetch via compteur.
- `src/pages/FinancesPage.tsx`
- `src/components/finances/FinanceMetricCard.tsx`
- `src/components/finances/FinanceTable.tsx` (tableau trimestriel + état accordion local).
- `src/components/finances/RevenueEntryForm.tsx` + `RevenueEntryModal.tsx`
- `src/components/finances/TaxStayForm.tsx` + `TaxStayModal.tsx`
- `src/components/finances/MiscEntryForm.tsx` + `MiscEntryModal.tsx`

Types domain à ajouter (`src/types/domain.ts`) : `RevenueEntry`, `TaxStay`, `MiscEntry`, `Quarter` (`1|2|3|4`), `GiteLabel` (`'Petit gite' | 'Grand gite' | 'Annexe'`).

---

## 7. Formulaires

### RevenueEntryForm

- Gîte (select obligatoire, 3 options)
- Montant (number obligatoire ≥ 0)
- Date (text optionnel, libre)
- Notes (textarea optionnel)
- Year et quarter passés en props (contexte de la modale), pas dans le form.

### TaxStayForm

- Gîte (select obligatoire)
- Dates (text optionnel, libre)
- Nuits (number obligatoire > 0)
- Adultes (number obligatoire > 0)
- Montant (number optionnel ≥ 0)
- Notes (textarea optionnel)
- Year et quarter en props.

### MiscEntryForm

- Label (text obligatoire)
- Montant (number obligatoire, peut être négatif et non-zéro)
- Notes (textarea optionnel)
- Year et quarter en props.

Validation zod standard + préprocesseur NaN→undefined sur les champs number optionnels (cf. CLAUDE.md piège zod NaN).

---

## 8. Règles métier

- **Total CA annuel** = `SUM(revenue_entries.amount) WHERE year = X`.
- **Total Taxes annuel** = `SUM(tax_stays.amount) WHERE year = X AND amount IS NOT NULL`.
- **Total Notes diverses annuel** = `SUM(misc_entries.amount) WHERE year = X` (peut être négatif).
- **Nombre d'opérations annuel** = COUNT total des 3 tables pour l'année.
- **Totaux trimestriels** : mêmes SUM filtrées par `quarter`.
- **Trimestre courant** mis en évidence uniquement si année affichée = année courante.

---

## 9. Pièges et règles

Voir `CLAUDE.md` à la racine (Pieges frontend, design tokens, parseISO si jamais on parse, zod NaN, pas de cache, Button/Modal/ConfirmDialog existants).

---

## 10. Hors périmètre

- Calcul auto du montant taxe (Johan saisit).
- Export CSV / Excel (étape 10).
- Graphiques.
- Édition inline (toutes les modifs via modales).
- Lien entre Finances et fiche réservation.
- Modification de la fiche réservation (étape 6 reste intacte).

---

## 11. Découpage commits (5-7 indicatif)

1. `docs: add directive for step 8 (v3 - manual finance journal)`
2. `db: migration finances (drop tax_entries, swap display_order, create revenue_entries + tax_stays)`
3. `feat(finances): page with year nav, metric cards, quarterly table`
4. `feat(finances): expandable accordion with 3 sections`
5. `feat(finances): RevenueEntry CRUD`
6. `feat(finances): TaxStay CRUD`
7. `feat(finances): MiscEntry CRUD`

Push à la fin sans pause de validation intermédiaire (décision 36).

---

## 12. Tests Vercel (6 points)

1. Ouvrir `/finances` année courante → 4 metric-cards et tableau cohérents (vides au départ).
2. Cliquer sur T3 → accordion s'ouvre, 3 sections vides, 3 boutons "+ Ajouter".
3. Ajouter une opération CA (gîte + montant + date texte) → apparaît dans la liste T3, total CA T3 et annuel mis à jour.
4. Ajouter une opération Taxe (gîte + dates texte + nuits + adultes + montant optionnel) → apparaît, total Taxes mis à jour. Tester avec et sans montant.
5. Modifier et supprimer une entrée de chaque type via les modales. ConfirmDialog avant suppression.
6. TabBar : Petit gîte (15p) en premier, Grand gîte (22p) en second.

---

## Note pour Claude Code

Si tu rencontres une ambiguïté majeure non couverte ici, **demande avant d'implémenter**.

Pour les ambiguïtés mineures (libellés des pills, ordre des champs), aligne-toi sur la maquette et les patterns des étapes 5/6/7.
