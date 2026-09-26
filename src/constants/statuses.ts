// Colours come from docs/charte-graphique.md (dark theme): same lightness and
// chroma for the 3 statuses, only the hue changes.
// `color` is the 6px dot, `bg` + `border` make the booking bar.
export const STATUSES = {
  pending_contract: {
    label: 'Contrat en attente',
    color: 'oklch(0.74 0.13 28)',
    bg: 'oklch(0.30 0.045 28)',
    border: 'oklch(0.42 0.07 28)',
    text: '#F1EEE8',
  },
  pending_deposit: {
    label: 'Acompte en attente',
    color: 'oklch(0.74 0.13 75)',
    bg: 'oklch(0.30 0.045 75)',
    border: 'oklch(0.42 0.07 75)',
    text: '#F1EEE8',
  },
  deposit_paid: {
    label: 'Acompte payé',
    color: 'oklch(0.74 0.13 150)',
    bg: 'oklch(0.30 0.045 150)',
    border: 'oklch(0.42 0.07 150)',
    text: '#F1EEE8',
  },
} as const

export type StatusKey = keyof typeof STATUSES
