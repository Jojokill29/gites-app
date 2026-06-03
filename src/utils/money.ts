const currencyFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

/** Format a number as EUR in French locale (e.g. "1 234,56 €") */
export function formatEUR(value: number): string {
  return currencyFmt.format(value)
}
