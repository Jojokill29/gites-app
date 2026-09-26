# Charte graphique — Gestion des gîtes (thème sombre)

## Principes
- Sobre, dense et utilitaire : l'information passe avant la décoration.
- Noirs **chauds** (légèrement brun), pas de bleu nuit ni de dégradés, halos ou ombres colorées.
- Hiérarchie par la graisse et la couleur du texte, pas par des boîtes.
- Filets de 1 px plutôt que des cartes arrondies ; rayons faibles (4–8 px).
- La couleur est réservée aux **statuts** de réservation.

## Typographie
- Texte : **IBM Plex Sans** (400 / 500 / 600) — Google Fonts
- Chiffres techniques, raccourcis : **IBM Plex Mono** (400 / 500)
- Montants : `font-variant-numeric: tabular-nums`

| Usage | Taille | Graisse |
|---|---|---|
| Titre de page (mois) | 20 px | 600, letter-spacing −0.01em |
| Titre de fenêtre | 17 px | 600 |
| Nom d'application | 15 px | 600 |
| Texte courant, onglets, boutons | 14 px | 400 / 500 |
| Libellés de champ, secondaire | 13 px | 400 |
| En-têtes de colonnes, légende | 12 px | 400 |
| Mono (capacité, raccourcis) | 11 px | 400 |

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

## Couleurs

### Fonds
| Rôle | Hex |
|---|---|
| Fond de page | `#141311` |
| Champs de saisie | `#141311` |
| En-tête, barre d'onglets | `#181715` |
| Calendrier (surface) | `#1A1917` |
| Fenêtre modale, boutons secondaires | `#1C1B18` |
| Week-end dans le calendrier | `#1E1D1A` |
| Survol | `#201F1C` / `#262420` |
| Jours hors mois | `#161513` |

### Bordures
| Rôle | Hex |
|---|---|
| Filets principaux | `#2A2824` |
| Filets internes (grille) | `#26241F` |
| Bordure de boutons | `#34322D` |
| Bordure de champs | `#3A3833` |
| Champ actif (focus) | `#9A968C` |

### Texte
| Rôle | Hex |
|---|---|
| Principal | `#E9E6DF` |
| Secondaire (libellés) | `#A8A49B` |
| Tertiaire (onglets inactifs, en-têtes) | `#8C887F` |
| Discret (aide, unités) | `#77736A` |
| Désactivé (jours hors mois) | `#55524B` |

### Action principale
- Bouton principal : fond `#E9E6DF`, texte `#141311`, survol `#FFFFFF`
- Onglet actif : souligné 2 px `#E9E6DF`
- Aujourd'hui : pastille `#E9E6DF`, chiffre `#141311`

### Statuts (oklch — même luminosité et chroma, teinte différente)
| Statut | Teinte | Point | Fond de barre | Bordure |
|---|---|---|---|---|
| Contrat en attente | 28 | `oklch(0.74 0.13 28)` | `oklch(0.30 0.045 28)` | `oklch(0.42 0.07 28)` |
| Acompte en attente | 75 | `oklch(0.74 0.13 75)` | `oklch(0.30 0.045 75)` | `oklch(0.42 0.07 75)` |
| Acompte payé | 150 | `oklch(0.74 0.13 150)` | `oklch(0.30 0.045 150)` | `oklch(0.42 0.07 150)` |

- Alerte (chevauchement, capacité) : texte `oklch(0.82 0.10 40)` sur `oklch(0.28 0.05 30)`
- Action destructive (Supprimer) : `oklch(0.72 0.13 28)`

## Formes et espacements
- Rayons : 3 px (pastilles), **4 px** (boutons, champs, barres), 6 px (calendrier), 8 px (fenêtre)
- Hauteurs : boutons/champs **36 px**, navigation de mois 32 px, en-tête 52 px
- Espacements : 4 · 6 · 8 · 12 · 16 · 20 · 24 px
- Marges de page : 24 px ; largeur max du contenu : 1440 px
- Ombre unique (fenêtre modale) : `0 24px 64px rgba(0,0,0,0.5)` ; voile `rgba(8,8,7,0.62)`

## Composants
- **Onglets** : texte 14 px `#8C887F`, actif `#E9E6DF` + soulignement 2 px ; capacité en mono 11 px `#77736A`.
- **Boutons secondaires** : fond transparent ou `#1C1B18`, bordure `#34322D`, texte `#E9E6DF`.
- **Champs** : fond `#141311`, bordure `#3A3833`, focus `#9A968C`, `color-scheme: dark`.
- **Barres de réservation** : fond + bordure du statut, point de 6 px, nom 13 px/500, détail en mono 11 px `#BDB9B0`. Elles vont de la demi-journée d'arrivée à la demi-journée de départ.
- **Raccourcis clavier** : étiquette mono 11 px, bordure 1 px, rayon 3 px.

## À éviter
Bleu électrique, dégradés, glow et ombres colorées, cartes très arrondies, bordure colorée à gauche, emoji, Inter/Roboto.
