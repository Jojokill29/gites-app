# Directive étape 10 — Export (sauvegarde des données)

Onglet Export = **sauvegarde complète des données**. Étape critique : c'est la seule protection contre une perte de données (si Supabase disparaît ou est mis en pause). Pas de migration BDD. `jszip` et l'accès Storage existent déjà.

Ordre validé : étape 10 **avant** l'étape 9 (Factures). Au moment de cette étape, l'onglet Factures n'existe pas encore et il n'y a **aucune facture** en base — le code d'export doit interroger la table/bucket `invoices` malgré tout et gérer le cas vide sans planter (rendra l'export complet dès que l'étape 9 sera livrée).

---

## 1. Sources de vérité

- `docs/04-plan-developpement.md` étape 10 — **attention** : la mention "CA calculé" y est **obsolète**. Le modèle Finances est manuel depuis la décision 49 : on exporte les 3 tables telles quelles, rien n'est recalculé.
- `docs/03-modele-donnees.md` (schéma des tables).
- `CLAUDE.md` à la racine (pièges frontend, pas de cache, parseISO, storage isolé).

---

## 2. Principes clés

- **Export = lecture seule.** Ne modifie aucune donnée, aucun composant, aucun autre onglet. Aucune écriture BDD/Storage.
- **Modèle Finances v3** : pas de CA calculé. On exporte `revenue_entries`, `tax_stays`, `misc_entries` telles quelles.
- **Tout accès Storage passe par `lib/storage.ts`** (décision 33). Ajouter un helper de download générique ici, jamais d'appel direct à `supabase.storage` dans `export.ts`.

---

## 3. Décisions tranchées

| Sujet | Décision |
|---|---|
| Export finances | **3 CSV séparés** : `revenues.csv`, `tax_stays.csv`, `misc_entries.csv` (colonnes réelles de chaque table). |
| Nombre de boutons | **3** : réservations (CSV), finances (ZIP des 3 CSV finances), export complet (ZIP). |
| Indicateur "Dernier export complet" | Oui, via **localStorage** (clé `gites:lastFullExport`). Mis à jour à la fin d'un export complet réussi. Pas de BDD. |
| Contenu du ZIP complet | `reservations.csv` + `revenues.csv` + `tax_stays.csv` + `misc_entries.csv` + dossier `contracts/` + dossier `invoices/`. |
| Séparateur CSV | Point-virgule `;` + **BOM UTF-8**, pour ouverture propre dans Excel FR (accents corrects). |
| Dates | Exportées brutes (`YYYY-MM-DD` telles qu'en base), aucune transformation, aucun `new Date`. |
| Statut réservation | Exporté en **libellé FR** (via les libellés de `constants/statuses.ts`). |
| Fichiers Storage manquants | Un contrat/facture référencé mais absent du bucket ne doit **pas** faire planter l'export : try/catch par fichier, on continue et on ignore le manquant. |

---

## 4. `lib/storage.ts` — ajout (pas de modif de l'existant)

Ajouter un helper générique de téléchargement (2 buckets : `contracts`, `invoices`) :

- `downloadFile(bucket, path): Promise<Blob>` — `supabase.storage.from(bucket).download(path)`, throw explicite si erreur.

Les fonctions existantes (`uploadContract`, `getContractSignedUrl`, `deleteContract`) restent **intactes**.

---

## 5. `lib/export.ts` (nouveau)

- `toCsv(rows, columns)` : helper générique. `columns = [{ key, header }]`. Échappe correctement (entoure de guillemets si la valeur contient `;`, `"` ou un saut de ligne ; double les guillemets internes). Préfixe le BOM UTF-8. Sépare par `;`.
- `getReservationsCsv()` : charge toutes les réservations + les gîtes (jointure `gite_id` → `gites.name`). Colonnes : gîte, client, date début, date fin, statut (FR), nb personnes, total, payé, reste (`total - paid`), draps doubles, draps simples, contrat (nom du fichier ou vide), notes, créée le.
- `getRevenuesCsv()`, `getTaxStaysCsv()`, `getMiscEntriesCsv()` : une fonction par table, toutes années confondues, colonnes = celles de la table (libellés d'en-tête FR).
- `buildFinancesZip(): Promise<Blob>` : ZIP des 3 CSV finances.
- `buildFullZip(onProgress?): Promise<Blob>` : JSZip. Ajoute les 4 CSV. Pour chaque réservation avec `contract_path` → `downloadFile('contracts', path)` → `contracts/`. Pour chaque `invoices.file_path` → `downloadFile('invoices', path)` → `invoices/`. Téléchargements **séquentiels** (ou petits lots) pour ne pas saturer. `onProgress(fait, total)` pour la barre de progression.
- `downloadBlob(blob, filename)` : déclenche le téléchargement navigateur (`URL.createObjectURL` + `<a download>` + révocation).

Noms de fichiers : `reservations-YYYY-MM-DD.csv`, `finances-YYYY-MM-DD.zip`, `export-gites-complet-YYYY-MM-DD.zip`.

---

## 6. `ExportPage.tsx` (remplace le placeholder)

- **Indicateur en haut** : "Dernier export complet : [date]" lu depuis localStorage. Si jamais fait : "Aucun export complet réalisé pour l'instant."
- **3 boutons** (réutiliser `ui/Button.tsx`), chacun avec état loading + spinner, désactivé pendant sa génération, message succès/erreur inline en FR :
  1. Exporter les réservations (CSV)
  2. Exporter les finances (ZIP)
  3. Export complet (ZIP)
- **Barre de progression** sur l'export complet (peut être long) : "Préparation… X / Y fichiers" via `onProgress`.
- À la fin d'un export complet réussi : écrire la date du jour dans localStorage et rafraîchir l'indicateur.
- **Recommandation** affichée : "Effectuez un export complet au moins une fois par mois et conservez-le ailleurs (Drive, disque dur externe)."

---

## 7. Libellés

Ajouter les textes FR (titres de boutons, messages succès/erreur, recommandation, indicateur) dans `constants/labels.ts`. Aucun texte en dur dans les composants.

---

## 8. Pièges et règles

- CSV : `;` + BOM UTF-8 (Excel FR + accents). Sans BOM, les accents cassent.
- Storage uniquement via `lib/storage.ts`.
- Aucun `new Date` sur les dates métier (dates brutes).
- Fichiers Storage manquants : try/catch par fichier, on continue.
- Voir `CLAUDE.md` (pas de cache, patterns Button/spinner existants).

---

## 9. Hors périmètre

- Import / restauration (export seul).
- Export planifié / automatique.
- Export PDF ou Excel natif (CSV uniquement).
- Filtres par période (on exporte tout).
- Toute modification d'un autre onglet ou de la BDD.

---

## 10. Découpage commits (4-6 indicatif)

1. `docs: add directive for step 10 (export)`
2. `feat(storage): add generic downloadFile helper`
3. `feat(export): lib/export.ts (toCsv + per-table CSV builders)`
4. `feat(export): full ZIP builder (contracts + invoices)`
5. `feat(export): ExportPage with 3 buttons, progress, last-export indicator`

Push à la fin sans pause de validation intermédiaire (décision 36). `npx tsc -b --noEmit` avant de clore la session (décision 57).

---

## 11. Tests Vercel (5-7 points)

1. Bouton réservations → télécharge un CSV, ouvrable dans Excel, accents OK, colonne gîte correcte, statut en FR.
2. Bouton finances → ZIP contenant `revenues.csv`, `tax_stays.csv`, `misc_entries.csv`, chacun ouvrable.
3. Export complet → ZIP avec les 4 CSV + dossier `contracts/` contenant les PDF/images des réservations qui en ont, ouvrables.
4. Aucune facture en base (étape 9 pas encore faite) → dossier `invoices/` vide ou absent, **pas de plantage**.
5. Indicateur "Dernier export complet" → passe à la date du jour après un export complet réussi et persiste au refresh.
6. Spinner / barre de progression visible pendant la génération, boutons désactivés.
7. Réservation dont le contrat a été supprimé du Storage → l'export ne plante pas, le fichier manquant est ignoré.

---

## Isolation entre onglets (règle transversale)

Cette étape **ne modifie** aucun composant ni donnée des onglets déjà livrés (Calendrier, Réservations, Finances, Factures). Elle ne fait que **lire**.

Fichiers touchés : `lib/export.ts` (nouveau), `pages/ExportPage.tsx` (remplace le placeholder), `lib/storage.ts` (**ajout** d'un helper, aucune modif de l'existant), `constants/labels.ts` (ajout de libellés). Rien d'autre.

---

## Note pour Claude Code

Ambiguïté majeure non couverte ici → **demande avant d'implémenter**. Pour les détails mineurs (ordre des colonnes CSV, libellés d'en-tête), aligne-toi sur les noms de champs de la BDD et les patterns des étapes 5-8.
