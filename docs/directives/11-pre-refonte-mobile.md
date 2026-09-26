# Directive — Refonte mobile

## Contexte

Djo utilise l'app principalement au téléphone ; l'interface actuelle y est peu utilisable (barre d'onglets qui déborde, calendrier illisible, modale de réservation trop longue avec bouton Enregistrer hors écran). Cette étape rend l'app confortable sous 640 px de large. **Le desktop ne change pas.**

Références visuelles :
- `docs/maquette-mobile.html` : écrans 2a (Calendrier), 2b (Réservations), 2c (Nouvelle réservation), 2d (Détail d'un séjour). Ouvrir dans un navigateur.
- `docs/charte-graphique.md` : couleurs, typo, rayons, filets. Elle fait foi pour tout ce qui n'est pas précisé ici.

Pas de migration BDD. Aucune nouvelle colonne.

## Décisions tranchées

| Sujet | Décision |
|---|---|
| Breakpoint | Mobile = largeur ≤ 640 px. Au-dessus, rendu actuel strictement inchangé. |
| Zones tactiles | 44 px sur mobile (seul écart à la charte, qui prévoit 36 px). |
| Légende du calendrier | Supprimée sur mobile uniquement. Conservée sur desktop. |
| Bouton « Appeler » (2d) | Retiré : pas de champ téléphone en base (prévu à l'étape 11). |
| Bouton « Facture » (2d) | Retiré : les factures de l'app sont les scans de dépenses, sans lien avec un séjour. |
| « Enregistrer le solde » (2d) | Conservé. Met `paid_amount = total_amount` après confirmation (`ConfirmDialog`). Masqué si le reste à payer est nul. |
| Suivi du séjour (2d) | Contrat signé = `contract_path` renseigné ; Acompte reçu = statut `deposit_paid` ; Solde = reste à payer nul. Point plein = fait, contour = à faire. |
| Écran Réservations (2b) | Nouvel écran, accessible depuis la barre basse mobile. Pas d'entrée sur desktop. |
| Formulaire (2c) | Plein écran sur mobile, modale actuelle sur desktop. Mêmes règles de validation et même logique d'enregistrement (pas de duplication des règles métier). |
| Reste à payer | Toujours calculé côté client (`total_amount - paid_amount`), jamais stocké. |

## Structure mobile

### Navigation basse fixe
5 emplacements : `Calendrier` · `Réservations` · `+` (bouton principal 44×44, fond `#E9E6DF`, rayon 4 px, ouvre 2c) · `Finances` · `Plus`.
- Hauteur 52 px + `env(safe-area-inset-bottom)`, fond `#181715`, filet haut `#2A2824`.
- Libellés 13 px `#8C887F` ; actif `#E9E6DF` 500 + trait 2 px en haut.
- `Plus` ouvre une feuille (seule ombre autorisée) : Factures, Export, nom d'utilisateur, Déconnexion.
- Le contenu des pages ne doit jamais passer sous la barre (marge basse équivalente).

### En-tête (52 px)
Nom d'app 15 px/600 à gauche, identifiant mono 11 px `#77736A` à droite. Plus de bouton Déconnexion dans l'en-tête mobile. Dessous, sur Calendrier : onglets gîtes Le Vallon `15p` / La Salmonière `22p`, soulignement 2 px sur l'actif.

### 2a — Calendrier
- Titre : mois 20 px/600 + groupe `‹ | Aujourd'hui | ›` (boutons 44×40, bordure `#34322D`).
- Grille mois : en-têtes `Lun…Dim` 12 px ; chaque semaine = rangée numéros (28 px) + rangée barres (24 px) + 8 px d'espace.
- Rangée barres en 14 colonnes (2 par jour). Une barre démarre à la 2ᵉ moitié du jour d'arrivée et finit à la 1ʳᵉ moitié du jour de départ : ligne de début = 2 × jour d'arrivée, ligne de fin = 2 × jour de départ (lundi = 1). Un séjour qui déborde de la semaine est coupé (début en ligne 1 ou fin en ligne 15). Plusieurs séjours dans la même semaine ne doivent pas se chevaucher visuellement (jour de rotation compris).
- Barre : fond/bordure du statut, point 6 px, nom 13 px/500, rayon 4 px, texte tronqué sans retour à la ligne.
- Week-end fond `#1E1D1A` ; jours hors mois `#161513` + texte `#55524B` ; aujourd'hui pastille `#E9E6DF` rayon 3 px.
- Sous la grille : « Prochaines arrivées » (2-3 lignes à filets) : nom 14/500, dates mono 11 px, statut point + libellé 12 px.
- Tap sur une barre ou une arrivée → 2d.

### 2b — Réservations
- Onglets `Tous / Le Vallon / La Salmonière`.
- Filtres (36 px, rayon 4) : `À venir` (par défaut, actif = fond clair), `Contrat` (= `pending_contract`), `Acompte` (= `pending_deposit`), avec compteurs mono.
- Liste groupée par mois, lignes 64 px à filets : jour d'arrivée 17/600 + `→ départ` mono ; nom + « gîte · n pers. » ; à droite reste à payer (`tabular-nums`) + statut. Tap → 2d.

### 2c — Nouvelle / modification de réservation (plein écran)
- En-tête : `Annuler` · titre 17/600. Corps scrollable, pied **fixe** : reste à payer calculé + bouton `Enregistrer` 44 px, toujours visible, y compris clavier ouvert.
- Gîte : contrôle segmenté 2 choix. Nom du client.
- Arrivée / Départ côte à côte sans débordement ; nombre de nuits affiché.
- Personnes, draps simples, draps doubles : compteurs − / + (boutons 44×38), minimum 0.
- Montant total / Déjà payé côte à côte, clavier décimal.
- Statut : 3 pastilles 40 px (retour à la ligne autorisé), sélectionnée = fond + bordure du statut.
- Champ contrat PDF et notes : conservés, sous les autres champs, même comportement qu'aujourd'hui.
- Champs 44 px, fond `#141311`, bordure `#3A3833`, focus `#9A968C`, police ≥ 16 px (évite le zoom iOS).
- Les messages d'erreur existants (chevauchement de dates, champs requis) restent affichés.

### 2d — Détail d'un séjour
- `‹ Retour` (vers l'écran d'origine) et `Modifier` (→ 2c pré-rempli).
- Statut, nom 20/600, gîte + dates + nuits. Trio Personnes / Draps simples / Draps doubles séparé par filets. Montants : total, payé, reste à payer.
- Suivi 3 étapes (voir tableau). Accès au contrat PDF s'il existe (aperçu actuel).
- Action en bas : `Enregistrer le solde` (principal). La suppression reste accessible depuis 2c comme aujourd'hui.

## Couleurs de statut
Couleur réservée aux statuts, en `oklch` : point `0.74 0.13 H`, fond `0.30 0.045 H`, bordure `0.42 0.07 H`, avec H = 28 (`pending_contract`), 75 (`pending_deposit`), 150 (`deposit_paid`). Si `constants/statuses.ts` porte déjà ces couleurs, s'y référer plutôt que de les redéfinir.

Interdits : cartes arrondies, ombres (sauf feuille `Plus`), dégradés, emoji. Montants en `tabular-nums`. Libellés FR dans `constants/labels.ts`.

## Isolation et non-régression

- Cette étape touche volontairement le layout et le calendrier, la réservation, et l'accès à Finances/Factures/Export. Elle ne modifie **pas** le contenu ni la logique des pages Finances, Factures, Export et Login : sur mobile, celles-ci doivent seulement tenir dans l'écran sans défilement horizontal.
- Hooks (`useReservations`, `useGites`, `useFinances`, `useInvoices`) : réutilisés, pas de changement de comportement. Un ajout minimal est acceptable pour « Enregistrer le solde » s'il n'existe pas déjà de fonction de mise à jour réutilisable.
- Desktop : aucune différence visuelle ou fonctionnelle attendue. Vérifier à 1280 px avant de clore.

## Hors périmètre
- Champ téléphone, bouton Appeler, lien séjour/facture.
- Refonte des pages Finances, Factures, Export au-delà de l'adaptation à la largeur.
- Mode clair, animations, PWA / installation sur écran d'accueil.

## Tests Vercel (preview de la branche, sur téléphone)
1. Aucun défilement horizontal à 375 px, sur toutes les pages.
2. Barre basse : les 5 entrées fonctionnent ; Factures, Export et Déconnexion accessibles via `Plus`.
3. Calendrier : séjours lisibles sans légende, séjour à cheval sur deux semaines coupé proprement, jour de rotation correct.
4. Créer une réservation au téléphone : bouton Enregistrer visible en permanence, pas de zoom à la saisie, compteurs − / + OK.
5. Détail d'un séjour : Modifier, aperçu du contrat, Enregistrer le solde (le reste à payer passe à 0).
6. Réservations : filtres et compteurs cohérents avec le calendrier.
7. Desktop inchangé (calendrier, modale, onglets).
