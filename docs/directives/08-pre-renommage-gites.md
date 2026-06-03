# Directive — Mini-tâche : renommage des gîtes + swap display_order

Mini-tâche atomique, indépendante du reste. À traiter en **session Claude Code dédiée**, un seul commit poussé sur GitHub.

---

## Contexte

Les gîtes sont actuellement nommés "Petit gîte" (15p) et "Grand gîte" (22p) en BDD. Les noms officiels du domaine (cf. site moulinlasalmoniere.fr) sont "Le Vallon" et "La Salmonière". On les renomme, et on en profite pour inverser leur `display_order` afin que Le Vallon (15p) apparaisse en premier dans la TabBar.

---

## Travail à faire

### Migration BDD unique

Créer `supabase/migrations/YYYYMMDDHHMMSS_rename_gites.sql` :

```sql
UPDATE gites SET name = 'Le Vallon', display_order = 1 WHERE name = 'Petit gite';
UPDATE gites SET name = 'La Salmonière', display_order = 2 WHERE name = 'Grand gite';
```

Les accents UTF-8 passent sans souci côté PostgreSQL / Supabase. Pas de mapping côté front nécessaire.

### Pas de modification de code

La TabBar charge dynamiquement les gîtes depuis la BDD (étape 4) — elle affichera automatiquement les nouveaux noms et le nouvel ordre. Les réservations existantes pointent vers `gite_id` (UUID), donc elles suivent.

Régénérer les types TS via `npm run generate:types` au cas où.

---

## Isolation entre onglets

Ne pas modifier les composants du calendrier (étape 5), de la fiche réservation (étape 6) ou des contrats (étape 7). Pas d'effet de bord — c'est juste un UPDATE SQL.

---

## Commit unique

```
db: rename gites to official names and swap display_order

- 'Petit gite' (15p, display_order 2) -> 'Le Vallon' (display_order 1)
- 'Grand gite' (22p, display_order 1) -> 'La Salmonière' (display_order 2)

Names taken from moulinlasalmoniere.fr. Le Vallon now appears first
in the TabBar. Reservations are unaffected (linked via gite_id UUID).
```

Push direct sur la branche principale.

---

## Test Vercel

Ouvrir l'app et vérifier que la TabBar affiche "Le Vallon (15p)" en premier et "La Salmonière (22p)" en second. Les réservations existantes restent rattachées aux bons gîtes.
