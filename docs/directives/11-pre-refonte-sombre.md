# Directive — Refonte visuelle sombre (pré-étape 11)

## Contexte

L'application adopte une nouvelle charte graphique : thème sombre unique, noirs chauds, IBM Plex, couleur réservée aux statuts. Deux références, placées dans `docs/` :
- `docs/charte-graphique.md` — **fait foi** pour toutes les valeurs (couleurs, tailles, rayons, hauteurs).
- `docs/maquette-calendrier-sombre.html` — référence de rendu pour le calendrier, la barre d'en-tête, les onglets et la fiche réservation. Le fichier ne s'affiche pas seul (il dépend d'un script absent) : lire son balisage et ses styles en ligne comme spécification.

Cette refonte est **purement visuelle**. Aucun comportement, aucune donnée, aucune règle métier ne change.

## Décisions tranchées

| Sujet | Décision |
|---|---|
| Thème | Sombre uniquement. Le mode clair et le bouton de bascule sont supprimés. |
| Périmètre | Toute l'application : connexion, calendrier, fiche réservation, contrats, Finances, Factures, Export, dialogues. |
| Fonctionnement | Inchangé. Ce qui existe aujourd'hui reste, restylé ; rien n'est ajouté. |
| Éléments de la maquette **non repris** | Ligne « Acompte 30 % » (contredit la décision 2), lien « Paramètres » (aucune page derrière), raccourci clavier « N », barres de réservation en demi-journées, statut en 3 boutons, statistiques du mois. |
| Jours de rotation | La logique actuelle (barres empilées « Dép. » / « Arr. ») est conservée, seulement restylée. |
| Indicateur « contrat manquant » | Conservé, restylé. |
| Mobile | Comportement actuel conservé (onglets en bas, grille compacte, safe-area). La charte s'applique aussi sur mobile. |
| Couleurs de statut | Valeurs oklch de la charte (point, fond de barre, bordure). Plus de filet coloré à gauche des barres : point de 6 px à la place. |
| Action principale | Bouton clair `#E9E6DF` sur texte `#141311`. Le bleu d'accent disparaît partout (bouton principal, onglet actif, liens). |
| Polices | IBM Plex Sans + IBM Plex Mono remplacent DM Sans. Montants en chiffres tabulaires. |
| Rayons | 3 / 4 / 6 / 8 px selon la charte. L'option ouverte « rounded 8px partout » est donc tranchée par cette directive. |

## Architecture

### Jetons de design (`src/index.css`)
- Remplacer la palette claire et le bloc `.dark` par **une seule palette** conforme à la charte. Supprimer la variante `dark` personnalisée.
- Conserver autant que possible les noms de jetons existants (`bg`, `surface`, `surface-alt`, `text`, `text-secondary`, `text-tertiary`, `border`, `border-hover`, `status-*`) pour limiter les changements dans les composants. Ajouter les jetons manquants de la charte (en-tête, surface calendrier, week-end, hors mois, champ, bordure de champ, focus, texte discret, texte désactivé, action principale, alerte, destructif).
- Supprimer les jetons bleus (`status-blue*`) une fois plus utilisés.
- `color-scheme: dark` sur la page (champs date, barres de défilement).
- Rayons et polices déclarés en jetons.

### Polices (`index.html`)
- Remplacer le lien Google Fonts DM Sans par le lien IBM Plex donné dans la charte.

### Statuts (`src/constants/statuses.ts`)
- Mettre à jour les valeurs de couleur avec celles de la charte. Clés et libellés inchangés.

### Thème
- Supprimer `ThemeContext.tsx`, `ThemeToggle.tsx`, leur usage dans `App.tsx` et `TopBar.tsx`, et les libellés associés dans `labels.ts` s'il y en a.
- Nettoyer la clé localStorage du thème si elle est lue ailleurs (aucune migration nécessaire côté utilisateur).

### Composants à restyler (classes Tailwind uniquement)
- `layout/` : `TopBar` (52 px, fond en-tête, nom d'app 15 px/600, utilisateur en secondaire), `TabBar` (onglet actif souligné 2 px clair, capacité en mono 11 px), `ProtectedRoute` si concerné.
- `ui/` : `Button` (variantes : principale claire, secondaire à bordure, destructive en texte, ghost ; hauteur 36 px, rayon 4 px), `Modal` (fond `#1C1B18`, rayon 8 px, ombre et voile de la charte, en-tête et pied séparés par des filets), `ConfirmDialog`.
- `calendar/` : `CalendarGrid`, `CalendarDay`, `CalendarEvent`, `CalendarLegend` — suivre la maquette (surface, week-end, hors mois, pastille « aujourd'hui », barres avec point de statut et détail en mono).
- `reservation/` : `ReservationForm`, `ReservationModal` — champs, libellés, sections séparées par des filets, message d'alerte au style de la charte (chevauchement 23P01, erreurs).
- `contracts/`, `invoices/`, `finances/` : même traitement. `FinanceMetricCard` : blocs sobres à filet, pas de grosse carte arrondie.
- `pages/` : `LoginPage`, `CalendarPage` (en-tête mois 20 px/600, navigation groupée 32 px), `FinancesPage`, `InvoicesPage`, `ExportPage`.

### Règles de style
- Aucune couleur en dur dans les composants : tout passe par les jetons de `index.css`.
- Hiérarchie par graisse et couleur de texte, filets de 1 px plutôt que cartes. Voir la section « À éviter » de la charte.

## Isolation

Exception assumée à la règle d'isolation des onglets : cette directive touche tous les onglets, mais **uniquement l'apparence**. Interdit de modifier :
- les hooks (`src/hooks/`), `lib/`, `utils/` (sauf si une fonction ne sert qu'au thème), `types/`, `contexts/AuthContext.tsx` ;
- la logique des formulaires (schémas zod, validations, soumissions, gestion d'erreurs) ;
- les migrations Supabase et la base ;
- les textes de `labels.ts` (sauf suppression des libellés du thème).

Si un changement visuel semble exiger une modification de logique, s'arrêter et demander.

## Documentation à mettre à jour

- `CLAUDE.md` : section « Statuts de réservation » (remplacer les anciennes couleurs par un renvoi à `docs/charte-graphique.md`), section « Style » (ajouter : la charte fait foi, thème sombre unique), « Points d'extension > Changer les couleurs » (pointer vers `index.css` et `statuses.ts`).
- `docs/README.md` : ajouter une ligne pour la charte et la maquette sombre.

## Hors périmètre

- Toute nouvelle fonctionnalité listée comme « non reprise » ci-dessus.
- Toute nouvelle dépendance npm.
- Refonte de la structure des composants ou découpage de fichiers au-delà du nécessaire.

## Découpage

6 à 8 commits logiques (par exemple : docs, jetons + polices, suppression du thème, layout + ui, calendrier, fiche + contrats, Finances/Factures/Export/connexion, CLAUDE.md). Laisser Claude Code juger.

Avant le push : `npx tsc -b --noEmit` sans erreur, et vérifier qu'il ne reste aucune couleur en dur (hex, rgb, classes Tailwind de couleur brute) dans `src/components` et `src/pages`.

## Tests Vercel

1. Connexion : page sombre, champs et bouton conformes, pas de flash blanc au chargement.
2. Calendrier des deux gîtes : week-ends, jours hors mois, aujourd'hui, barres aux 3 couleurs de statut, jour de rotation lisible, indicateur « contrat manquant » visible.
3. Fiche réservation : création depuis un jour vide, édition, chevauchement (message d'alerte lisible), contrat joint et aperçu.
4. Finances, Factures, Export : tout est lisible, aucun reste de bleu ni de fond clair, montants alignés.
5. Plus aucun bouton de bascule clair/sombre.
6. Téléphone : onglets en bas, grille calendrier sans défilement horizontal, fiche utilisable.
