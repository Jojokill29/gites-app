# Directive étape 8 — Finances (révisée 2026-06-04)

Page Finances. Saisie des taxes par séjour, accordion trimestriel, annexe en opérations isolées (pas de calendrier propre), inversion display_order Petit/Grand gîte.

À traiter après que la mini-tâche `08-pre-indicateur-contrat-manquant.md` soit livrée et poussée.

---

## 1. Sources de vérité

- `docs/01-cahier-des-charges.md` §7 (mis à jour).
- `docs/03-modele-donnees.md` (mis à jour : `adult_count` + `tax_amount` sur `reservations`, nouvelle table `annex_stays`, `tax_entries` supprimée, swap display_order).
- `docs/maquette-finances-v2.html` (référence visuelle ; lignes éditables en pointillés à ignorer — l'édition se fait depuis la fiche réservation, pas inline).
- `CLAUDE.md` à la racine (pièges frontend, règles de session).

---

## 2. Décisions tranchées

| Sujet | Décision |
|---|---|
| Saisie taxes de séjour (réservations) | Par réservation : colonne `tax_amount` sur `reservations`. |
| Nombre d'adultes (réservations) | Nouveau champ `adult_count` sur `reservations`, distinct de `guest_count`. |
| Annexe | Pas un 3ème gîte, pas de calendrier propre. Nouvelle table `annex_stays` (séjours annexe isolés saisis manuellement depuis Finances). |
| `tax_entries` | Supprimée (DROP TABLE). |
| `misc_entries` | Conservée. Notes financières libres (corrections, remboursements). |
| Inversion display_order | Petit gîte (15p) → display_order 1, Grand gîte (22p) → display_order 2. Petit gîte apparaît en premier dans la TabBar. |
| Édition depuis Finances | **Lecture seule**. Pour modifier un séjour : ouvrir la fiche réservation (lien `↗`). Pour modifier une opération annexe : modale dédiée. |
| Validation guest_count/capacity | Cross-field zod : `guest_count ≤ gites.capacity` et `adult_count ≤ guest_count`. Capacité du gîte affichée sous le champ. |
| CA et taxes annexe | Comptabilisés dans le total annuel et trimestriel (CA + taxes) au même titre que les réservations. |
| Bornes navigation année | `[2020, currentYear + 1]`. |

---

## 3. Migration BDD

Une seule migration (`supabase/migrations/YYYYMMDDHHMMSS_finances_refactor.sql`) :

1. `ALTER TABLE reservations ADD COLUMN adult_count INTEGER NULL CHECK (adult_count IS NULL OR adult_count >= 0);`
2. `ALTER TABLE reservations ADD COLUMN tax_amount NUMERIC(10,2) NULL CHECK (tax_amount IS NULL OR tax_amount >= 0);`
3. `DROP TABLE tax_entries;`
4. `UPDATE gites SET display_order = 1 WHERE name = 'Petit gite';`
   `UPDATE gites SET display_order = 2 WHERE name = 'Grand gite';`
5. `CREATE TABLE annex_stays` avec les colonnes ci-dessous, RLS "authenticated full access" comme les autres tables.
6. Régénérer les types TS via `npm run generate:types` (décision 12).

### Schéma `annex_stays`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() |
| `client_name` | TEXT | NOT NULL |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | NOT NULL CHECK (end_date >= start_date) |
| `guest_count` | INTEGER | NULL CHECK (guest_count IS NULL OR guest_count > 0) |
| `adult_count` | INTEGER | NULL CHECK (adult_count IS NULL OR adult_count >= 0) |
| `paid_amount` | NUMERIC(10,2) | NOT NULL DEFAULT 0 CHECK (paid_amount >= 0) |
| `tax_amount` | NUMERIC(10,2) | NULL CHECK (tax_amount IS NULL OR tax_amount >= 0) |
| `notes` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Pas de contrainte d'exclusion (l'annexe n'a pas de calendrier ni de risque de chevauchement métier ici — c'est de la compta).

---

## 4. Formulaire réservation (étape 6 à amender)

Ajouter dans `ReservationForm.tsx` :

- Champ **"Nombre d'adultes"** — input number, optionnel, ≥ 0.
- Champ **"Montant taxe de séjour"** — input number, optionnel, ≥ 0. Format EUR FR.
- Indicateur sous "Nombre de personnes" : `Capacité max : {gite.capacity}`.

Validation zod cross-field :
- `guest_count ≤ gites.capacity` du gîte sélectionné. Message : "Le nombre de personnes dépasse la capacité du gîte ({capacity} max)."
- `adult_count ≤ guest_count` quand les deux sont définis. Message : "Le nombre d'adultes ne peut pas dépasser le nombre de personnes."
- Préprocesseur zod NaN→undefined sur les champs optionnels (cf. CLAUDE.md).

Aucune contrainte BDD ajoutée, validation côté front uniquement.

---

## 5. Page Finances

Route `/finances` (placeholder actuel à remplacer). Référence visuelle : `docs/maquette-finances-v2.html`.

### Layout

1. **Navigation année** : `<` / label année / `>` + bouton "Année courante" (visible si année ≠ courante). Bornes désactivées.
2. **4 metric-cards** annuelles : CA / Taxes de séjour / Notes diverses / Réservations. Grille 4 colonnes desktop, 2×2 mobile.
3. **Tableau trimestriel** : 4 colonnes (Trimestre / CA / Taxes / Notes diverses), 4 lignes T1-T4. Trimestre courant en surbrillance bleue (uniquement année courante). Chaque ligne cliquable → accordion inline.
4. **Accordion trimestre** (visible une à la fois, l'ouvrir referme les autres) :
   - **Section "Séjours du trimestre"** : tableau **lecture seule**. Colonnes : Arrivée + client / Lieu (pill couleur Petit gîte / Grand gîte / Annexe) / Nuits / Adultes / CA / Taxe / lien `↗`. Sont listées **les réservations ET les opérations annexe** du trimestre (`start_date` dans le trimestre), triées par date d'arrivée. Bouton "+ Ajouter une opération annexe" en bas de la section.
   - **Section "Notes diverses"** : liste `misc_entries` du trimestre, CRUD complet (ajout / édition / suppression).

### Lien `↗` (icône au bout de chaque ligne séjour)

- Pour une **réservation** : ouvre la fiche réservation existante (modale étape 6).
- Pour une **opération annexe** : ouvre `AnnexStayModal` (création / édition / suppression).

### URL

- `?year=2026` via `useSearchParams`. Bookmarkable. Pas de mise à jour au mount.

---

## 6. Architecture (composants à créer)

- `src/hooks/useFinances.ts` — charge pour une année : `reservations`, `annex_stays`, `misc_entries`. Calcule les agrégats trimestriels côté client (via `start_date`). Pattern `useReservations` : pas de cache, refetch via compteur.
- `src/pages/FinancesPage.tsx`
- `src/components/finances/FinanceMetricCard.tsx`
- `src/components/finances/FinanceTable.tsx` — tableau + accordion (état "trimestre ouvert" en local state).
- `src/components/finances/StaysTable.tsx` — tableau lecture seule (réservations + annex_stays mélangés, triés par date).
- `src/components/finances/AnnexStayForm.tsx` + `AnnexStayModal.tsx` — CRUD annex_stays. Pattern identique à `ReservationModal`.
- `src/components/finances/MiscEntriesList.tsx` + `MiscEntryForm.tsx` + `MiscEntryModal.tsx` — CRUD `misc_entries`.

Types domain à ajouter (`src/types/domain.ts`) : `AnnexStay`, `MiscEntry`, `Quarter` (`1|2|3|4`).

---

## 7. Règles métier

- **CA trimestriel** : `SUM(paid_amount)` des `reservations` + `SUM(paid_amount)` des `annex_stays` dont `start_date` est dans le trimestre.
- **Taxes trimestrielles** : `SUM(tax_amount)` des `reservations` + `SUM(tax_amount)` des `annex_stays` dont `start_date` est dans le trimestre.
- **Notes diverses trimestrielles** : `SUM(amount)` des `misc_entries` filtrées sur `year` + `quarter`.
- **Nuits par séjour** : `differenceInDays(parseISO(end_date), parseISO(start_date))`.
- **Nombre de réservations annuel** : COUNT des `reservations` (pas des `annex_stays`) dont `start_date` est dans l'année.
- **Trimestre courant** mis en évidence uniquement si année affichée = année courante.

---

## 8. Pièges et règles

Voir `CLAUDE.md` à la racine (Pieges frontend, design tokens, parseISO obligatoire, zod NaN, pas de cache, Button/Modal/ConfirmDialog existants).

---

## 9. Hors périmètre

- Calcul automatique du montant taxe (tarif × nuits × adultes) — Johan saisit.
- Export CSV / Excel (étape 10).
- Graphiques.
- Édition inline des champs depuis Finances (volontairement écartée — passage par la fiche pour traçabilité).

---

## 10. Découpage commits (5-7 indicatif)

1. `docs: add directive for step 8 (revised after user feedback)`
2. `db: migration finances refactor (adult_count, tax_amount, drop tax_entries, swap display_order, annex_stays table)`
3. `feat(reservation): add adult_count and tax_amount fields with cross-field validation`
4. `feat(finances): page with year nav, metric cards, quarterly table`
5. `feat(finances): expandable accordion with stays (reservations + annex_stays) and misc entries`
6. `feat(annex): annex stay form, modal, CRUD operations`

Commits poussés à la fin sans pause de validation intermédiaire (décision 36).

---

## 11. Tests Vercel (6 points)

1. Créer une réservation avec adultes + taxe → bien persistés. Test cross-field : guest_count > capacity rejeté, adult_count > guest_count rejeté.
2. Ouvrir `/finances` année courante → 4 metric-cards et tableau cohérents.
3. Cliquer sur T3 → accordion s'ouvre, séjours et notes visibles.
4. Ajouter une opération annexe via le bouton → enregistrée, apparaît dans la liste, totaux mis à jour.
5. Modifier puis supprimer une `annex_stay` et une `misc_entry` depuis l'accordion.
6. TabBar : Petit gîte (15p) en premier, Grand gîte (22p) en second. Réservations existantes inchangées.

---

## Note pour Claude Code

Si tu rencontres une ambiguïté majeure non couverte ici ou dans la doc 03, **demande avant d'implémenter**.

Pour les ambiguïtés mineures (nommage, ordre des champs, libellés des pills), aligne-toi sur les patterns des étapes 5/6/7 et sur la maquette.
