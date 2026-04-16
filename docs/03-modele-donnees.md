# Modele de donnees

Schema de la base PostgreSQL (hebergee sur Supabase). Tout est en anglais (tables et colonnes) pour s'aligner avec le code et les types generes par Supabase.

---

## Tables

### `gites`

Definit les gites geres par l'application. Demarre avec deux entrees, peut en accueillir d'autres.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom affichable (ex: "Grand gite") |
| `capacity` | INTEGER | NOT NULL, CHECK > 0 | Nombre max de personnes |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 | Ordre dans la TabBar (utilise pour tri ASC) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage creation |

Contenu initial (seed) :
- Grand gite, capacity 22, display_order 1
- Petit gite, capacity 15, display_order 2

### `reservations`

Coeur de l'application. Chaque ligne represente une reservation.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `gite_id` | UUID | NOT NULL, FK -> gites(id) ON DELETE RESTRICT | Gite concerne |
| `client_name` | TEXT | NOT NULL | Nom affiche sur le calendrier |
| `start_date` | DATE | NOT NULL | Date d'arrivee |
| `end_date` | DATE | NOT NULL, CHECK (end_date >= start_date) | Date de depart |
| `guest_count` | INTEGER | NOT NULL, CHECK > 0 | Nombre d'occupants |
| `linen_sets` | INTEGER | CHECK >= 0 | Sets de draps fournis (peut etre NULL) |
| `total_amount` | NUMERIC(10,2) | NOT NULL, CHECK >= 0 | Montant total en euros |
| `paid_amount` | NUMERIC(10,2) | NOT NULL, DEFAULT 0, CHECK >= 0 | Montant deja regle |
| `status` | TEXT | NOT NULL, CHECK IN (...) | Voir liste ci-dessous |
| `notes` | TEXT | | Notes libres |
| `contract_path` | TEXT | | Chemin du PDF dans Supabase Storage (NULL si pas de contrat) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage derniere modif (mis a jour par trigger) |

Valeurs possibles de `status` :
- `pending_contract` -- rouge (contrat en attente)
- `pending_deposit` -- orange (contrat recu, acompte en attente)
- `deposit_paid` -- vert (contrat recu, acompte paye)

Pas de colonne `remaining_amount` : c'est calcule cote client (`total_amount - paid_amount`) pour eviter les incoherences.

**Contrainte d'exclusion** (empeche le chevauchement) :

```sql
ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    gite_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  );
```

Le range `'[)'` (borne gauche inclusive, borne droite exclusive) autorise explicitement le jour de rotation : si la reservation A va du 1 au 7 (`[1, 7)`), une reservation B peut commencer le 7 (`[7, ...)`), car le 7 n'est pas inclus dans A.

**Index recommande** pour accelerer les requetes par mois :

```sql
CREATE INDEX idx_reservations_gite_dates
  ON reservations (gite_id, start_date, end_date);
```

### `tax_entries`

Saisies manuelles des taxes de sejour versees a la commune (anciennement `finances`, simplifie).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `amount` | NUMERIC(10,2) | NOT NULL, CHECK >= 0 | Montant en euros |
| `year` | INTEGER | NOT NULL, CHECK BETWEEN 2020 AND 2100 | Annee concernee |
| `quarter` | INTEGER | NOT NULL, CHECK BETWEEN 1 AND 4 | Trimestre (1-4) |
| `notes` | TEXT | | Commentaire optionnel |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage creation |

Une entree par trimestre n'est pas obligatoire (UNIQUE constraint volontairement absente : laisser la souplesse de plusieurs versements pour un meme trimestre).

### `misc_entries`

Entrees financieres libres (corrections, frais exceptionnels, remboursements).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `label` | TEXT | NOT NULL | Description courte (ex: "Remboursement client") |
| `amount` | NUMERIC(10,2) | NOT NULL | Montant en euros (peut etre negatif pour les sorties) |
| `year` | INTEGER | NOT NULL, CHECK BETWEEN 2020 AND 2100 | Annee concernee |
| `quarter` | INTEGER | NOT NULL, CHECK BETWEEN 1 AND 4 | Trimestre (1-4) |
| `notes` | TEXT | | Commentaire optionnel |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage creation |

Note : pas de table `revenue` pour le CA. Il est calcule directement a partir des `paid_amount` des `reservations` (voir requete plus bas).

### `invoices`

Photos et scans de factures a transmettre au comptable.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom affichable de la facture |
| `file_path` | TEXT | NOT NULL | Chemin du fichier dans Supabase Storage |
| `invoice_date` | DATE | NOT NULL | Date de la facture |
| `notes` | TEXT | | Commentaire optionnel |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Horodatage creation |

---

## Buckets Supabase Storage

Deux buckets prives (non publics) :

### `contracts`
- Chemin : `contracts/{uuid}.pdf` (UUID genere a l'upload, jamais base sur le nom utilisateur pour eviter les problemes d'accents et de caracteres speciaux)
- Le path complet est stocke dans `reservations.contract_path`
- Acces : URLs signees uniquement, duree 10 minutes
- Quand une reservation est mise a jour avec un nouveau contrat : on uploade le nouveau, on update `contract_path`, on supprime l'ancien fichier
- Quand une reservation est supprimee : suppression manuelle du fichier dans le code (pas de cascade automatique sur Storage)

### `invoices`
- Chemin : `invoices/{uuid}.{ext}` ou ext est `jpg`, `png`, ou `pdf`
- Le path est stocke dans `invoices.file_path`
- Acces : URLs signees uniquement
- Images JPEG/PNG compressees cote client avant upload (qualite 80%, max 2000px)

---

## Row Level Security (RLS)

Toutes les tables ont RLS activee. Politique simple : **tout utilisateur authentifie a acces complet** (lecture et ecriture) a toutes les tables.

```sql
-- Tables : meme politique pour gites, reservations, tax_entries, misc_entries, invoices

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users full access on reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Policies Storage

Les buckets Supabase Storage utilisent leur propre systeme de policies, separe de celui des tables. Il faut explicitement les declarer :

```sql
-- Bucket "contracts" : authentifies en lecture/ecriture/delete

CREATE POLICY "Authenticated read contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contracts');

CREATE POLICY "Authenticated insert contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Authenticated update contracts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contracts');

CREATE POLICY "Authenticated delete contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contracts');

-- Repeter le meme pattern pour le bucket "invoices"
```

---

## Triggers

### Mise a jour automatique de `updated_at` sur `reservations`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Configuration Supabase Auth

A configurer dans le dashboard Supabase :

- **Disable signups** : activer "Disable new sign-ups" pour empecher l'inscription publique
- **Site URL** : URL Vercel du frontend (ex: `https://gites-app.vercel.app`)
- **Redirect URLs** : ajouter les URLs de preview Vercel egalement
- **Email templates** : adapter les templates de reset password en francais

Les deux comptes utilisateurs (Johan, Quentin) sont crees manuellement via le dashboard Supabase Auth -> Users -> Add user.

---

## Exemples de requetes frequentes

### Recuperer les reservations d'un gite pour un mois donne

```sql
SELECT * FROM reservations
WHERE gite_id = $1
  AND end_date > $2          -- debut du mois (exclusif car end_date = jour de depart)
  AND start_date < $3        -- debut du mois suivant
ORDER BY start_date;
```

### Calculer le reste a payer

Calcul cote client pour eviter une colonne redondante :
```typescript
const remainingAmount = reservation.total_amount - reservation.paid_amount;
```

### Calcul du chiffre d'affaires d'un trimestre

**Regle retenue** (voir decision 1 dans `05-decisions-a-trancher.md`) : le CA d'un trimestre est la somme des `paid_amount` des reservations dont le `start_date` tombe dans le trimestre. Une reservation a cheval sur deux trimestres est entierement comptee dans le trimestre de son `start_date`.

Requete pour les 4 trimestres d'une annee donnee :

```sql
SELECT
  EXTRACT(QUARTER FROM start_date)::int as quarter,
  COALESCE(SUM(paid_amount), 0) as revenue
FROM reservations
WHERE EXTRACT(YEAR FROM start_date) = $1
GROUP BY EXTRACT(QUARTER FROM start_date)
ORDER BY quarter;
```

Les trimestres sans reservation ne sont pas retournes par cette requete ; le code client doit initialiser les 4 trimestres a 0 avant merge.

### Agregation taxes de sejour par trimestre

```sql
SELECT
  quarter,
  COALESCE(SUM(amount), 0) as total_tax
FROM tax_entries
WHERE year = $1
GROUP BY quarter
ORDER BY quarter;
```

---

## Migrations

Chaque modification du schema passe par un fichier de migration versionne dans `supabase/migrations/`. Convention de nommage avec timestamp (genere par `npx supabase migration new`) :

```
20260416120000_initial_schema.sql
20260416120100_rls_policies.sql
20260416120200_storage_setup.sql
20260420093000_add_some_field.sql
...
```

**Regle absolue** : ne jamais modifier une migration deja appliquee en production. Toujours creer une nouvelle migration pour changer le schema.

Les migrations doivent etre idempotentes quand c'est possible (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` quand supporte) pour pouvoir les rejouer en cas de besoin.
