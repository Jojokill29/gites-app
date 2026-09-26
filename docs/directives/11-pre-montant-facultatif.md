# Directive — Fiche réservation : montant total facultatif

## Contexte

Johan veut pouvoir créer une réservation avec le minimum d'informations et compléter plus tard.
Après cadrage avec Adrien : le gîte et les deux dates **restent obligatoires**, parce que le calendrier
et la liste mobile ont besoin d'eux pour afficher la réservation. Le seul champ réellement obligatoire
qu'on retire est le **montant total**. Tous les autres champs sont déjà facultatifs ou ont une valeur par défaut.

## Décisions tranchées

| Champ | Règle |
|---|---|
| Nom du client | Obligatoire (inchangé) |
| Gîte | Obligatoire (inchangé, pré-rempli depuis le calendrier) |
| Dates d'arrivée / de départ | Obligatoires (inchangé), départ > arrivée (inchangé) |
| Nb personnes, draps simples, draps doubles, notes | Facultatifs (inchangé) |
| Montant total | **Devient facultatif.** Champ vide → `NULL` en base. Placeholder « optionnel » comme les autres champs facultatifs |
| Montant déjà payé | Reste pré-rempli à 0. Si l'utilisateur vide le champ → enregistré comme 0 (pas d'erreur) |
| Statut | Inchangé (défaut « Contrat en attente ») |
| Contrôle « payé ≤ total » | Appliqué seulement si un montant total est saisi |
| Reste à payer | Si le total est vide : afficher « — » (et non un montant négatif ou 0,00 €) |

## Base de données

- Nouvelle migration : `reservations.total_amount` perd sa contrainte `NOT NULL`. La contrainte `>= 0` reste
  valable quand une valeur est présente.
- **Appliquer la migration** sur le projet Supabase (créer le fichier ne suffit pas), puis vérifier par un SELECT
  sur `information_schema.columns` que `total_amount` est bien `is_nullable = YES`.
- Régénérer / mettre à jour `src/types/database.ts` et `src/types/domain.ts` (`total_amount: number | null`).

## Code concerné

- `src/lib/reservationSchema.ts` : schéma zod (règles partagées desktop + mobile), type `ReservationFormData`,
  valeurs par défaut. Les deux formulaires (`ReservationForm.tsx` et `ReservationFormMobile.tsx`) doivent
  hériter de la règle sans duplication.
- Tous les endroits qui calculent ou affichent le reste à payer ou le total doivent gérer un total absent :
  formulaires desktop et mobile, `ReservationDetailPage.tsx`, `ReservationsPage.tsx`, et tout autre usage
  trouvé via une recherche de `total_amount`.
- `src/lib/export.ts` : total vide → cellule vide dans le CSV ; colonne « reste » vide aussi.

## Hors périmètre

- Aucun changement sur le gîte, les dates, le statut, les contrats, Finances, Factures (isolation entre onglets).
- Aucun changement visuel autre que le placeholder « optionnel » sur le montant total et l'affichage « — ».

## Tests Vercel

1. Créer une réservation avec seulement nom + dates (desktop) → enregistrée, visible au calendrier.
2. Idem sur mobile.
3. Ouvrir cette réservation : reste à payer affiché « — », aucune erreur.
4. Vider le champ « Montant déjà payé » puis enregistrer → enregistré à 0.
5. Saisir total 100 et payé 150 → message d'erreur toujours affiché.
6. Ajouter un montant total à une réservation existante sans montant → reste à payer correct.
7. Export CSV réservations : la ligne sans total s'exporte sans erreur.
