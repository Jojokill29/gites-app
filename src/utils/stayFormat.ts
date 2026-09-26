import { differenceInCalendarDays, format, getMonth, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LABELS } from '../constants/labels'

/** "27 sept" — date-fns adds a trailing dot to the short month, dropped here. */
export function formatDayMonth(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM', { locale: fr }).replace(/\.$/, '')
}

/** "ven. 25 sept" */
export function formatWeekdayDayMonth(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE d MMM', { locale: fr }).replace(/\.$/, '')
}

/**
 * "25 → 27 sept" when both dates fall in the same month, otherwise
 * "30 sept → 2 oct".
 */
export function formatStayRange(startStr: string, endStr: string): string {
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  const sameMonth = getMonth(start) === getMonth(end)
  const left = sameMonth
    ? format(start, 'd', { locale: fr })
    : formatDayMonth(startStr)
  return `${left} → ${formatDayMonth(endStr)}`
}

export function nightsBetween(startStr: string, endStr: string): number {
  return differenceInCalendarDays(parseISO(endStr), parseISO(startStr))
}

/** "2 nuits" / "1 nuit" */
export function formatNights(startStr: string, endStr: string): string {
  const nights = nightsBetween(startStr, endStr)
  return `${nights} ${nights > 1 ? LABELS.mobile.nights : LABELS.mobile.night}`
}
