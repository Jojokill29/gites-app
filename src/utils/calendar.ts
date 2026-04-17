import {
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  subDays,
  differenceInDays,
  parseISO,
  getMonth,
} from 'date-fns'
import type { Reservation } from '../types/domain'

export type SegmentType = 'start' | 'middle' | 'end' | 'single'

export interface SegmentInfo {
  reservation: Reservation
  type: SegmentType
  showName: boolean
}

export interface RotationInfo {
  departing: Reservation
  arriving: Reservation
}

export interface DayInfo {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  segments: SegmentInfo[]
  rotation: RotationInfo | null
}

/**
 * Build the grid of dates for a given month.
 * Returns an array of weeks, each week containing 7 Date objects.
 * Includes padding days from previous/next months so weeks are always complete.
 * Week starts on Monday.
 */
export function buildMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const last = endOfMonth(first)
  const gridStart = startOfWeek(first, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(last, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

/**
 * Build display info for a single day in the calendar grid.
 *
 * Reservation occupancy uses the half-open interval [start_date, end_date).
 * A "rotation day" occurs when one reservation's end_date matches another's
 * start_date on the same day — both are shown stacked instead of as regular bars.
 */
export function buildDayInfo(
  date: Date,
  reservations: Reservation[],
  currentMonth: number,
  today: Date,
): DayInfo {
  const dateStr = format(date, 'yyyy-MM-dd')

  // Rotation detection: one reservation departs (end_date) as another arrives (start_date)
  const departing = reservations.find((r) => r.end_date === dateStr)
  const arriving = reservations.find((r) => r.start_date === dateStr)
  const rotation =
    departing && arriving ? { departing, arriving } : null

  // Reservations occupying this day: [start_date, end_date) half-open
  const occupying = reservations.filter(
    (r) => r.start_date <= dateStr && r.end_date > dateStr,
  )

  // On rotation days, the arriving reservation is shown in the rotation display,
  // not as a regular bar segment
  const forSegments = rotation
    ? occupying.filter((r) => r.id !== rotation.arriving.id)
    : occupying

  const segments: SegmentInfo[] = forSegments.map((r) => {
    const isStart = r.start_date === dateStr
    const lastOccupied = format(subDays(parseISO(r.end_date), 1), 'yyyy-MM-dd')
    const isEnd = lastOccupied === dateStr

    let type: SegmentType
    if (isStart && isEnd) type = 'single'
    else if (isStart) type = 'start'
    else if (isEnd) type = 'end'
    else type = 'middle'

    // Show client name on start and end segments (not middle) if reservation >= 2 days
    const occupiedDays = differenceInDays(
      parseISO(r.end_date),
      parseISO(r.start_date),
    )
    const showName =
      (type === 'start' || type === 'end' || type === 'single') && occupiedDays >= 2

    return { reservation: r, type, showName }
  })

  return {
    date,
    dateStr,
    isCurrentMonth: getMonth(date) === currentMonth,
    isToday: isSameDay(date, today),
    segments,
    rotation,
  }
}

/**
 * Compute the date range to fetch reservations for a given displayed month.
 * Includes the full grid range (padding days from prev/next months).
 */
export function getMonthFetchRange(
  year: number,
  month: number,
): { start: string; end: string } {
  const first = new Date(year, month, 1)
  const last = endOfMonth(first)
  const gridStart = startOfWeek(first, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(last, { weekStartsOn: 1 })

  return {
    start: format(gridStart, 'yyyy-MM-dd'),
    end: format(gridEnd, 'yyyy-MM-dd'),
  }
}
