import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Reservation } from '../types/domain'

/**
 * Layout of the mobile booking bars for one week.
 *
 * The week is drawn on 14 columns, two per day, so a bar can start on the
 * second half of the arrival day and stop on the first half of the departure
 * day — which is what makes a rotation day readable. Grid lines run from 1
 * (Monday 00:00) to 15 (Sunday 24:00), so for a day at index `d` (Monday = 0):
 *
 *   arrival line   = 2 * d + 2   (second half of the day)
 *   departure line = 2 * d + 2   (first half of the day)
 *
 * A stay reaching outside the week is clipped to line 1 or line 15.
 */
export interface WeekBar {
  reservation: Reservation
  /** CSS grid start line, 1..14 */
  startCol: number
  /** CSS grid end line, 2..15 */
  endCol: number
  /** Row index inside the week, 0 for the first bar row */
  lane: number
  clippedStart: boolean
  clippedEnd: boolean
}

const FIRST_LINE = 1
const LAST_LINE = 15

/** Grid line for a date, relative to the Monday starting the week. */
function lineFor(date: Date, weekStart: Date): number {
  return 2 * differenceInCalendarDays(date, weekStart) + 2
}

export function buildWeekBars(
  weekStart: Date,
  reservations: Reservation[],
): WeekBar[] {
  const placed: WeekBar[] = []
  // Last used end line per lane, so bars can share a row when they don't touch
  const laneEnds: number[] = []

  const candidates = reservations
    .map((reservation) => {
      const rawStart = lineFor(parseISO(reservation.start_date), weekStart)
      const rawEnd = lineFor(parseISO(reservation.end_date), weekStart)
      return {
        reservation,
        startCol: Math.max(FIRST_LINE, rawStart),
        endCol: Math.min(LAST_LINE, rawEnd),
        clippedStart: rawStart < FIRST_LINE,
        clippedEnd: rawEnd > LAST_LINE,
      }
    })
    // Anything with no width does not touch this week at all
    .filter((b) => b.endCol > b.startCol)
    .sort((a, b) => a.startCol - b.startCol)

  for (const bar of candidates) {
    // A rotation day gives two bars that meet on the same line without
    // overlapping, so they legitimately share a lane.
    let lane = laneEnds.findIndex((end) => end <= bar.startCol)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(bar.endCol)
    } else {
      laneEnds[lane] = bar.endCol
    }
    placed.push({ ...bar, lane })
  }

  return placed
}

/** Number of bar rows a week needs (always at least one, for the spacing). */
export function laneCount(bars: WeekBar[]): number {
  return bars.reduce((max, bar) => Math.max(max, bar.lane + 1), 1)
}
