# Directive étape 8 — Finances (révisée 2026-06-03)

Refonte après doléance utilisateur du 2026-06-03 : Johan saisit les taxes de séjour **par réservation** (pas globalement par trimestre). Ajout d'un 3ème gîte "Annexe". Page Finances avec accordion trimestriel.

À traiter après que la mini-tâche `08-pre-indicateur-contrat-manquant.md` soit livrée et poussée.

---

## 1. Sources de vérité

- `docs/01-cahier-des-charges.md` §7 (Onglet Finances, mis à jour).
- `docs/03-modele-donnees.md` (mis à jour : colonnes `adult_count` et `tax_amount` sur `reservations`, table `tax_entries` supprimée, 3ème gîte annexe).
- `docs/maquette-finances-v2.html` (référence visuelle).
- `CLAUDE.md` à la racine (pièges frontend, règles de session).

---

## 2. Décisions tranchées

| Sujet | Décision |
|---|---|
| Saisie des taxes de séjour | Par réservation, plus par trimestre. Colonne `tax_amount` sur `reservations`. |
| Nombre d'adultes | Nouveau champ `adult_count` distinct de `guest_count`. |
| Nombre de nuits | Dérivé (`end_date - start_date`), pas de colonne. |
| `tax_entries` (table) | Supprimée (DROP TABLE). Vide en production, aucune perte de données. |
| `misc_entries` | Conservée. Section dédiée dans l'accordion trimestre. |
| 3ème gîte "Annexe" | Ajouté comme entrée dans `gites` (3ème ligne, capacité **à confirmer avec Johan avant lancement** — placeholder dans la migration). |
| CA trimestriel | Inchangé : `SUM(paid_amount)` des réservations dont `start_date` est dans le trimestre. |
| Édition des taxes/adultes | Inline depuis l'accordion (au clic sur le champ → input éditable, auto-save sur blur). |
| Bornes navigation année | `[2020, currentYear + 1]`. |

---

## 3. Migration BDD

Une seule migration timestampée (`supabase/migrations/YYYYMMDDHHMMSS_finances_refactor.sql`) :

1. `ALTER TABLE reservations ADD COLUMN adult_count INTEGER NULL CHECK (adult_count IS NULL OR adult_count >= 0);`
2. `ALTER TABLE reservations ADD COLUMN tax_amount NUMERIC(10,2) NULL CHECK (tax_amount IS NULL OR tax_amount >= 0);`
3. `DROP TABLE tax_entries;`
4. `INSERT INTO gites (name, capacity, display_order) VALUES ('Annexe', <CAPACITE>, 3);` — capacité à compléter par Adrien avant le commit, à demander à Johan.
5. Régénérer les types TS via `npm run generate:types` (script décision 12).

---

## 4. Formulaire réservation (étape 6 à amender)

Ajouter dans `ReservationForm.tsx` :

- Champ **"Nombre d'adultes"** — input number, optionnel, ≥ 0. Préprocesseur zod NaN→undefined (cf. CLAUDE.md piège zod NaN).
- Champ **"Montant taxe de séjour"** — input number, optionnel, ≥ 0. Format EUR FR.

Placement : à proximité des champs Nombre de personnes et Sets de draps (groupe "détails séjour"). Pas de réorganisation majeure.

### Règles de validation (cross-field, zod)

Le nombre de personnes d'une réservation peut être strictement inférieur à la capacité du gîte (ex : Grand gîte capacité 22, réservation pour 12 personnes uniquement). Mais il ne peut pas la dépasser.

- `guest_count` (si renseigné) **doit être ≤ `gites.capacity` du gîte sélectionné**. Message FR : "Le nombre de personnes dépasse la capacité du gîte (X max)."
- `adult_count` (si renseigné) **doit être ≤ `guest_count`** (les adultes sont un sous-ensemble des occupants). Si `guest_count` est NULL, on accepte n'importe quel `adult_count` ≥ 0. Message FR : "Le nombre d'adultes ne peut pas dépasser le nombre de personnes."

Afficher la capacité du gîte sous le champ "Nombre de personnes" comme indicateur (ex : "Capacité max : 22").

La validation est côté front uniquement (zod). Aucune contrainte BDD ajoutée — la cohérence métier est portée par le formulaire.

---

## 5. Page Finances

Route `/finances` (placeholder actuel à remplacer).

### Layout (référence : `docs/maquette-finances-v2.html`)

1. **Navigation année** : `<` / label année (Fraunces) / `>` + bouton "Année courante" (visible si `year !== currentYear`). Bornes désactivées aux limites.
2. **4 metric-cards annuelles** : CA, Taxes de séjour, Notes diverses (rouge si négatif), Réservations. Grille 4 colonnes desktop, 2×2 mobile.
3. **Tableau trimestriel** : 4 colonnes (Trimestre / CA / Taxes / Notes diverses), 4 lignes (T1-T4). Trimestre courant en surbrillance bleue. Chaque ligne est cliquable et ouvre/ferme un accordion inline.
4. **Accordion trimestre** (visible quand une ligne est dépliée) :
   - **Section "Séjours du trimestre"** : tableau lecture (Arrivée + nom client / Gîte avec pill couleur / Nuits / Adultes / CA / Taxe). Champs Adultes et Taxe éditables inline. Lien `↗` à droite ouvre la fiche réservation complète (modale étape 6).
   - **Section "Notes diverses"** : liste des `misc_entries` du trimestre avec édition/suppression + lien "Ajouter une note".

### URL

- `?year=2026` via `useSearchParams`. Bookmarkable. Pas de mise à jour de l'URL au mount tant que pas de navigation.

---

## 6. Architecture (composants à créer)

- `src/hooks/useFinances.ts` — charge pour une année : `reservations` (avec tous les champs) + `misc_entries`. Calcul des agrégats trimestriels côté client à partir de `start_date`. Pattern `useReservations` (pas de cache, refetch via compteur).
- `src/pages/FinancesPage.tsx` — page principale.
- `src/components/finances/FinanceMetricCard.tsx`
- `src/components/finances/FinanceTable.tsx` — gère l'accordion ouvert/fermé via état local ou `?quarter=` dans l'URL (au choix de l'implémentation).
- `src/components/finances/StaysTable.tsx` — tableau séjours d'un trimestre avec édition inline.
- `src/components/finances/InlineNumberInput.tsx` — petit input éditable réutilisable (auto-save sur blur, restore en cas d'erreur).
- `src/components/finances/MiscEntriesList.tsx` — liste + actions CRUD.
- `src/components/finances/MiscEntryForm.tsx` — formulaire ajout/édition d'une `misc_entry` (modale légère ou inline expand, au choix).

Types domain à ajouter (`src/types/domain.ts`) : `MiscEntry`, `Quarter` (union littérale `1|2|3|4`). Pas de `TaxEntry`.

---

## 7. Édition inline (point d'attention)

C'est un pattern nouveau dans l'app. Comportement attendu :

- Clic sur la valeur affichée → bascule en mode input (focus automatique).
- Blur ou Entrée → `UPDATE reservations SET adult_count = ? / tax_amount = ?`, optimistic update, état loading discret.
- Échap → restaure la valeur précédente sans appel BDD.
- En cas d'erreur Supabase → restaure la valeur précédente + message inline rouge sous l'input.
- Vide accepté = NULL en BDD.

Centraliser dans `InlineNumberInput.tsx` pour réutilisation.

---

## 8. Règles métier

- **CA trimestriel** : `SUM(paid_amount)` des réservations dont `start_date` est dans le trimestre (décision 1, inchangé).
- **Taxes trimestrielles** : `SUM(tax_amount)` des réservations dont `start_date` est dans le trimestre (même règle d'attribution que le CA).
- **Notes diverses trimestrielles** : `SUM(amount)` de `misc_entries` filtrées sur `year` + `quarter`.
- **Nuits par séjour** : `differenceInDays(parseISO(end_date), parseISO(start_date))` (date-fns).
- **Trimestre courant** mis en évidence uniquement si `year === currentYear`.

---

## 9. Pièges et règles

Voir `CLAUDE.md` à la racine — section "Pieges frontend" (parseISO obligatoire, zod NaN préprocesseur, design tokens, strict mode, pas de cache, Button/Modal/ConfirmDialog existants).

---

## 10. Hors périmètre

- Calcul automatique du montant taxe (tarif commune × nuits × adultes) — Johan saisit lui-même.
- Export CSV / Excel (étape 10).
- Graphiques.
- Filtrage par gîte dans le tableau Finances (consolidé sur les 3 gîtes).

---

## 11. Découpage commits (indicatif, 5-7 commits)

À toi de juger le découpage final. Suggestion :

1. `docs: add directive for step 8 (revised after user feedback)`
2. `db: migration finances refactor (adult_count, tax_amount, drop tax_entries, seed annexe)`
3. `feat(reservation): add adult_count and tax_amount fields to form`
4. `feat(finances): page with year nav, metric cards, quarterly table`
5. `feat(finances): expandable accordion with stays and misc entries`
6. `feat(finances): inline edit for adult_count and tax_amount`

Commits poussés à la fin sans pause de validation intermédiaire (décision 36).

---

## 12. Tests Vercel (5-7 points)

1. Créer une réservation avec adultes + taxe renseignés → bien persistés, visibles dans la fiche.
2. Ouvrir `/finances` année courante → metric-cards et tableau cohérents avec les données réelles.
3. Cliquer sur T3 → accordion s'ouvre, séjours et notes visibles, mise en évidence correcte.
4. Éditer une taxe inline → enregistré, total de la ligne T3 et metric-card annuelle mis à jour.
5. 3ème onglet "Annexe" présent dans la TabBar, calendrier accessible, réservation possible.
6. Mobile 375px : tableau séjours lisible (probablement empilé), accordion utilisable.

---

## 13. Avant de lancer Claude Code

**Adrien doit confirmer la capacité de l'Annexe** auprès de Johan et la renseigner dans la migration (étape 3 §3). Sans ça, le seed est incomplet.

---

## Note pour Claude Code

Si tu rencontres une ambiguïté majeure non couverte par cette directive ou la doc 03, **demande avant d'implémenter**.

Pour les ambiguïtés mineures (nommage, ordre des champs), aligne-toi sur les patterns des étapes 5/6/7.
