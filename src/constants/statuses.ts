export const STATUSES = {
  pending_contract: {
    label: 'Contrat en attente',
    color: '#E24B4A',
    bg: '#FCEBEB',
    text: '#791F1F',
  },
  pending_deposit: {
    label: 'Acompte en attente',
    color: '#EF9F27',
    bg: '#FAEEDA',
    text: '#854F0B',
  },
  deposit_paid: {
    label: 'Acompte payé',
    color: '#5DCAA5',
    bg: '#E1F5EE',
    text: '#085041',
  },
} as const

export type StatusKey = keyof typeof STATUSES
