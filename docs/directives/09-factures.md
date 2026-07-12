# Directive étape 9 — Factures (upload + ZIP trimestriel)

Onglet Factures = **classeur de justificatifs** (charges : EDF, plombier, assurance, entretien…) à transmettre au comptable. Ce ne sont PAS des documents de réservation et ils ne sont **rattachés à aucun gîte**. Upload de photos/scans, regroupement par trimestre, plein écran + suppression, et export ZIP par trimestre.

**Aucune migration BDD.** La table `invoices` **et** le bucket `invoices` existent déjà (créés à l'étape 2, avec leurs policies RLS). Cette étape est purement du code front qui lit/écrit dans l'existant. Vérifier au démarrage (SELECT + tentative d'upload de test) que table et bucket répondent ; ne rien recréer.

---

## 1. Sources de vérité

- `docs/01-cahier-des-charges.md` §8 (périmètre Factures).
- `docs/03-modele-donnees.md` — table `invoices` (`id`, `name`, `file_path`, `invoice_date` DATE, `notes`, `created_at`) et bucket `invoices` (`invoices/{uuid}.{ext}`, ext ∈ jpg/png/pdf).
- `docs/maquettes-gites.html` section `tab-factures` (référence visuelle : nav trimestre, grille de vignettes, carte « Ajouter », bouton ZIP, texte d'aide).
- `CLAUDE.md` racine (pièges frontend, parseISO, storage isolé, pas de cache).
- Patterns à réutiliser : étape 7 (contrats) et étape 10 (export).

---

## 2. Principes clés

- **Isolation** : ne touche à aucun autre onglet ni à leurs données (Calendrier, Réservations, Finances, Export). Voir section dédiée.
- **Storage isolé** (décision 33) : tout accès au bucket `invoices` passe par `lib/storage.ts`. Le helper générique `downloadFile(bucket, path)` a été ajouté à l'étape 10 : le réutiliser.
- **Réutilisation** : s'appuyer sur les composants existants (`Modal`, `ConfirmDialog`, `ui/Button`, `ContractPreviewModal` comme modèle, `DateMaskedInput`, `JSZip`/`downloadBlob` de `lib/export.ts`). Ne pas réécrire ce qui existe.
- **Pas de rattachement gîte** : la table `invoices` n'a pas de `gite_label`, ne pas en inventer.

---

## 3. Décisions tranchées

| Sujet | Décision |
|---|---|
| Métadonnées d'une facture | `name`, `invoice_date`, `notes` (optionnel). Renseignées **à l'upload uniquement**. |
| Édition après upload | **Non**. Consultation plein écran + suppression seulement. Pour corriger, supprimer et ré-uploader. |
| Nom | Prérempli avec le nom du fichier original, modifiable dans la modale d'ajout. |
| Date | **Date réelle** (champ jj/mm/aaaa, obligatoire). Le **trimestre de classement est calculé** depuis `invoice_date` (`getYear`/`getQuarter` sur `parseISO`). Aucune colonne year/quarter, aucune migration. |
| Regroupement / navigation | Par trimestre (`T{n} {année}`), boutons trimestre précédent / suivant, trimestre courant par défaut. |
| Types acceptés | PDF, JPEG, PNG. Compression client des images (qualité 0.8, max 2000px), pas de compression PDF. Taille max 10 Mo avant compression. |
| Bouton ZIP | « Télécharger ZIP trimestre » → `factures-{année}-T{n}.zip`. À côté : compteur + taille, ex « 5 factures — 12 Mo ». Désactivé si 0 facture. |
| Fichier Storage manquant | Un `file_path` référencé mais absent du bucket ne doit pas faire planter la grille ni le ZIP (try/catch par fichier). |

---

## 4. `lib/storage.ts` — ajouts (aucune modif de l'existant)

Ajouter, sur le modèle des fonctions `contracts` déjà présentes, sans y toucher :

- `uploadInvoice(file): Promise<string>` — génère un UUID, dérive l'extension du type MIME, upload dans `invoices/`, renvoie le `file_path`.
- `deleteInvoice(path): Promise<void>`.
- `getInvoiceSignedUrl(path): Promise<string>` — URL signée (durée courte, comme les contrats).
- `getInvoicesTotalSize(paths): Promise<number>` — somme des tailles via `supabase.storage.from('invoices').list()` (métadonnée `size`), pour le compteur. Si indisponible, renvoyer `null` et n'afficher que le nombre.

Validation MIME/taille + compression : créer `utils/invoiceFile.ts` en miroir de `utils/contractFile.ts` (mêmes règles), **sans modifier** `contractFile.ts` (utilisé par les réservations).

---

## 5. Composants (nouveaux, sauf `InvoicesPage` qui remplace le placeholder)

- `useInvoices(year, quarter)` : charge les factures dont `invoice_date` tombe dans le trimestre affiché (filtre sur la plage de dates du trimestre), triées par `invoice_date` puis `created_at`. Refetch à chaque changement de trimestre (pas de cache, décision 16).
- `InvoicesPage.tsx` : en-tête nav trimestre + bouton ZIP (avec compteur/taille) ; grille de vignettes + carte « Ajouter une facture » ; texte d'aide « N factures ce trimestre. Cliquer pour agrandir ou supprimer. » ; états chargement/erreur/vide en FR.
- `InvoiceCard.tsx` : vignette (aperçu image via URL signée ; icône générique pour les PDF) + nom + date formatée FR. Clic → aperçu plein écran.
- `InvoiceUploadModal.tsx` : sélection fichier (validation + compression), champs nom (prérempli) / date / notes. Upload Storage **immédiat** puis INSERT `invoices` ; **nettoyage de l'orphelin** si l'INSERT échoue (pattern étape 7). Bandeau d'erreur inline FR (décision 19).
- `InvoicePreviewModal.tsx` : plein écran (iframe PDF, `<img>` images, lien de repli « Ouvrir dans un nouvel onglet » pour iOS Safari — comme `ContractPreviewModal`), + bouton **Supprimer** avec `ConfirmDialog` ; à la confirmation, DELETE BDD puis `deleteInvoice` du fichier, refetch.

---

## 6. ZIP trimestre

- Ajouter `buildInvoicesZip(invoices): Promise<Blob>` à `lib/export.ts` (réutilise JSZip + `downloadFile` + `downloadBlob` déjà présents ; aucune modif des fonctions existantes).
- Nom des fichiers dans le ZIP : nom de la facture assaini + extension issue du `file_path` ; dédoublonner les collisions (suffixe `-2`, `-3`…).
- Téléchargements **séquentiels**, fichier manquant ignoré (try/catch). Bouton désactivé si 0 facture ; spinner pendant la génération.

---

## 7. Libellés

Ajouter tous les textes FR (titres, boutons, messages succès/erreur, texte d'aide, compteur) dans `constants/labels.ts`. Rien en dur dans les composants.

---

## 8. Pièges et règles

- **Aucun `new Date` sur les dates métier** : `parseISO` systématique, y compris pour dériver le trimestre (décision 14).
- Storage uniquement via `lib/storage.ts` (décision 33).
- Orphelins Storage nettoyés à l'échec/annulation (décision 30).
- Voir `CLAUDE.md` : pas de cache, patterns Button/spinner/modale, retrait du `sandbox` d'iframe pour les PDF Supabase (décision 35).

---

## 9. Hors périmètre

- Édition des métadonnées après upload.
- Rattachement à un gîte ou à une réservation.
- Catégorisation / filtres (type de charge, montant).
- OCR, extraction de montant, comptabilité.
- Toute modification d'un autre onglet ou du schéma BDD.

---

## 10. Découpage commits (5-7 indicatif)

1. `docs: add directive for step 9 (invoices)`
2. `feat(storage): add invoice upload/delete/signed-url/size helpers + invoiceFile util`
3. `feat(invoices): useInvoices hook + InvoicesPage with quarter navigation`
4. `feat(invoices): upload modal with client-side compression`
5. `feat(invoices): fullscreen preview + delete`
6. `feat(invoices): quarter ZIP download with count + size`

Push à la fin sans pause intermédiaire (décision 36). `npx tsc -b --noEmit` avant de clore (décision 57).

---

## 11. Tests Vercel (5-7 points)

1. Upload d'un JPEG et d'un PDF → apparaissent dans la grille du bon trimestre, vignette correcte (aperçu image / icône PDF).
2. Nom prérempli avec le fichier, modifiable ; date obligatoire ; notes optionnelles.
3. Navigation trimestre précédent/suivant → la grille change, trimestre courant par défaut ; une facture de janvier apparaît en T1, une d'août en T3.
4. Clic sur une facture → plein écran ; suppression avec confirmation → disparaît de la grille et du Storage.
5. Bouton ZIP → `factures-2026-T{n}.zip` contenant toutes les factures du trimestre, ouvrables ; compteur + taille cohérents.
6. Trimestre sans facture → bouton ZIP désactivé, message « Aucune facture ce trimestre ».
7. Test mobile (Johan sur téléphone) : upload depuis la galerie, grille et plein écran lisibles.

---

## Isolation entre onglets (règle transversale)

Cette étape **ne modifie** aucun composant ni donnée des onglets déjà livrés (Calendrier, Réservations, Finances, Export).

Fichiers touchés : `pages/InvoicesPage.tsx` (remplace le placeholder), nouveaux composants/hook Factures, `utils/invoiceFile.ts` (nouveau), `lib/storage.ts` (**ajout** de fonctions `invoices`, existant intact), `lib/export.ts` (**ajout** de `buildInvoicesZip`), `constants/labels.ts` (ajout). Rien d'autre.

---

## Note pour Claude Code

Ambiguïté majeure non couverte ici → **demande avant d'implémenter**. Détails mineurs (ordre des vignettes, format d'affichage de la date, libellés) : aligne-toi sur les patterns des étapes 5-8 et les noms de champs BDD.
