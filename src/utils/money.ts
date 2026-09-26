const currencyFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

/** Format a number as EUR in French locale (e.g. "1 234,56 €") */
export function formatEUR(value: number): string {
  return currencyFmt.format(value)
}

/** Shown instead of an amount when the value is not known yet. */
export const EMPTY_AMOUNT = '—'

/**
 * Format an amount that may be missing. `total_amount` is nullable in the
 * database (a reservation can be created before the price is known) and an
 * empty <input type="number"> reads as NaN, so both cases show a dash.
 */
export function formatEURorDash(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return EMPTY_AMOUNT
  return formatEUR(Number(value))
}

/**
 * Remaining to pay, never stored: always recomputed. Returns null when no
 * total has been entered, so callers can show a dash instead of a wrong 0.
 */
export function computeRemaining(
  total: number | string | null | undefined,
  paid: number | string | null | undefined,
): number | null {
  if (total == null || Number.isNaN(Number(total))) return null
  return Number(total) - (Number(paid) || 0)
}
