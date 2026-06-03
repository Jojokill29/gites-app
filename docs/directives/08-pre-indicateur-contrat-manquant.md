# Directive — Mini-tâche d'ouverture étape 8 : indicateur "Contrat manquant" sur le calendrier

Mini-tâche préalable à l'étape 8 (Finances). À traiter en **session Claude Code dédiée**, en un seul commit poussé sur GitHub, avant d'attaquer la directive `08-finances.md`.

---

## Contexte

Aujourd'hui, sur le calendrier, une réservation au statut `pending_contract` (rouge) sans contrat uploadé (`contract_path IS NULL`) est visuellement identique à une réservation `pending_contract` avec contrat uploadé. Or il est utile pour Johan de distinguer d'un coup d'œil les barres pour lesquelles il manque encore le fichier — c'est l'action concrète à mener.

Décision tranchée le 2026-06-03 : ajouter un indicateur visuel sur ces barres.

---

## Objectif fonctionnel

Sur le calendrier (page `/calendar/:giteId`), les barres de réservation qui répondent aux **deux** conditions suivantes affichent un indicateur visuel "Contrat manquant" :

1. `status === 'pending_contract'`
2. `contract_path === null`

Les autres barres (statut différent, ou contrat déjà uploadé) sont inchangées.

### Justification du double critère

- Statut `pending_deposit` ou `deposit_paid` impliquent que le contrat est arrivé (cf. doc 03). Si `contract_path` est NULL pour ces statuts, c'est une incohérence métier — on ne la signale pas ici, c'est hors périmètre.
- Statut `pending_contract` avec `contract_path` non NULL = Johan a déjà uploadé le contrat mais n'a pas encore changé le statut. Le contrat n'est donc pas "manquant", on ne signale rien.

Seul le cas (1) ET (2) déclenche l'indicateur.

---

## Spécifications visuelles

### Forme de l'indicateur

Petite icône type **`!`** ou symbole "document barré" / "alerte", placée **au début de la barre** (avant le nom du client), intégrée dans le composant `CalendarEvent`.

Recommandation pragmatique : un caractère unicode discret du type **`⚠`** ou une icône SVG inline 12×12 px. Pas de dépendance externe (Lucide est déjà présent dans `package.json` — utiliser `lucide-react` `AlertTriangle` ou `FileWarning` est OK si on reste cohérent avec le reste du projet).

### Couleur

Couleur du texte de la barre `pending_contract` (`--red-text`), pour garder le contraste sur le fond rouge clair (`--red`). Ne pas inventer de couleur nouvelle.

### Comportement multi-cellules

Une réservation à cheval sur plusieurs jours est rendue en plusieurs segments (`start`, `middle`, `end`) dans `CalendarGrid`. L'indicateur ne doit s'afficher **qu'une fois**, sur le **premier segment visible à l'écran** (le segment `start`, ou `middle` s'il s'agit du début de la portion affichée dans le mois courant). Cohérent avec l'affichage du nom client en étape 6 (commits `b9a76c7`, `ffa850f`, `c7899a1`).

### Tooltip

Tooltip HTML natif `title="Contrat manquant"` sur la barre (cumulable avec le tooltip nom client existant — concaténer ou prioriser, à arbitrer côté implémentation, le plus simple est de remplacer le tooltip par "Nom — Contrat manquant" quand le contrat manque).

### Cas "rotation" (jours empilés Dép./Arr.)

Si la barre d'arrivée correspond à une réservation `pending_contract` sans contrat, l'indicateur s'applique aussi sur la mini-barre "Arr.". Si la place est insuffisante, accepter qu'il soit tronqué — on garde la couleur et le tooltip comme repli.

---

## Périmètre du commit

### Fichiers touchés

- `src/components/calendar/CalendarEvent.tsx` — ajouter le rendu conditionnel de l'indicateur.
- Éventuellement `src/utils/calendar.ts` ou un helper inline pour la fonction `isContractMissing(reservation)`.
- Aucun changement de schéma BDD, aucune nouvelle migration.
- Aucun changement de `useReservations` (les champs `status` et `contract_path` sont déjà dans le SELECT).

### Style

- Tailwind classes existantes + design tokens (`text-[var(--red-text)]` ou équivalent du theme). Pas de couleur hardcodée. Cohérent avec décision 25.

### Tests

À valider sur Vercel uniquement (décision 36) :

1. Créer une réservation `pending_contract` sans contrat → indicateur visible.
2. Uploader un contrat sur cette réservation → indicateur disparaît.
3. Changer le statut à `pending_deposit` (sans contrat) → indicateur disparaît (cf. justification du double critère).
4. Réservation à cheval sur 2 mois : naviguer → indicateur s'affiche bien sur le premier segment visible côté mois courant.
5. Tooltip desktop affiche "Contrat manquant".
6. Mobile 375px : indicateur ne casse pas la mise en page, lisible.

---

## Commit

Message recommandé :

```
feat(calendar): show missing contract indicator on reservation bars

Display a discreet visual indicator on calendar bars when status is
pending_contract and contract_path is NULL. Helps Johan spot at a
glance which reservations still need the contract file uploaded.

Implementation:
- Add isContractMissing helper
- Render indicator in CalendarEvent (first segment only on multi-day)
- Tooltip "Contrat manquant" on hover

Decided 2026-06-03, end of step 7.
```

Pousser directement sur la branche principale, pas de PR. Adrien teste sur Vercel après le push.

---

## Limites explicites

- Pas de filtre "afficher uniquement les réservations sans contrat".
- Pas d'indicateur côté finances ou autre vue.
- Pas de notification push, badge dans la TopBar, etc. Strictement visuel sur les barres du calendrier.

Si Claude Code identifie une amélioration tentante hors de ce périmètre, la noter en commentaire de commit mais ne pas l'implémenter dans le même commit.
