import { useMemo, useRef } from 'react'
import { format, getMonth, isSameDay } from 'date-fns'
import { buildMonthGrid } from '../../utils/calendar'
import { buildWeekBars, laneCount } from '../../utils/weekBars'
import { STATUSES } from '../../constants/statuses'
import type { Reservation } from '../../types/domain'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** Horizontal distance a swipe must cover before it changes month. */
const SWIPE_MIN_DISTANCE = 50

interface MobileCalendarProps {
  year: number
  month: number
  reservations: Reservation[]
  loading: boolean
  onClickReservation: (reservationId: string) => void
  /** Tapping a day of the displayed month starts a reservation on that day. */
  onClickDay: (dateStr: string) => void
  onSwipeNextMonth: () => void
  onSwipePreviousMonth: () => void
}

/**
 * Month grid for mobile. Each week is a 14-column grid: one row of day numbers,
 * then one row per bar lane (see utils/weekBars.ts). No legend on mobile — the
 * status is read from the detail screen instead.
 */
export default function MobileCalendar({
  year,
  month,
  reservations,
  loading,
  onClickReservation,
  onClickDay,
  onSwipeNextMonth,
  onSwipePreviousMonth,
}: MobileCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month])

  const touchStart = useRef<{ x: number; y: number } | null>(null)
  // A horizontal drag still fires a click on the element underneath, which
  // would open the stay that happened to be under the finger: the next click
  // is swallowed when a swipe was recognised.
  const swiped = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    swiped.current = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y

    // Too short, or more vertical than horizontal: leave scrolling and taps be
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return
    if (Math.abs(dx) <= Math.abs(dy)) return

    swiped.current = true
    if (dx < 0) {
      onSwipeNextMonth()
    } else {
      onSwipePreviousMonth()
    }
  }

  return (
    <div
      className={`bg-calendar border border-border rounded-lg overflow-hidden transition-opacity ${
        loading ? 'opacity-60' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null
      }}
      onClickCapture={(e) => {
        if (!swiped.current) return
        swiped.current = false
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 h-7 items-center border-b border-border text-[12px] text-text-tertiary text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => {
        const bars = buildWeekBars(week[0], reservations)
        const lanes = laneCount(bars)

        return (
          <div
            key={week[0].toISOString()}
            // The first week sits right under the header rule, no second line
            className={`grid ${weekIndex > 0 ? 'border-t border-border-grid' : ''}`}
            style={{
              // minmax(0, …) or a long client name would widen the grid
              gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
              gridTemplateRows: `28px ${'24px '.repeat(lanes)}8px`,
            }}
          >
            {week.map((date, dayIndex) => {
              const weekday = date.getDay()
              const isWeekend = weekday === 0 || weekday === 6
              const isCurrentMonth = getMonth(date) === month
              const isToday = isSameDay(date, today)

              const cellBg = !isCurrentMonth
                ? 'bg-outside'
                : isWeekend
                  ? 'bg-weekend'
                  : ''

              return (
                <div
                  key={date.toISOString()}
                  className={`px-2 pt-1.5 text-[13px] ${cellBg} ${
                    isCurrentMonth ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    gridColumn: `${2 * dayIndex + 1} / ${2 * dayIndex + 3}`,
                    gridRow: '1 / -1',
                  }}
                  // Days outside the displayed month are inert, as on desktop.
                  // The bars are siblings painted above, so tapping one never
                  // reaches this cell.
                  onClick={
                    isCurrentMonth
                      ? () => onClickDay(format(date, 'yyyy-MM-dd'))
                      : undefined
                  }
                >
                  <span
                    className={`inline-flex items-center justify-center min-w-[22px] h-5 rounded-sm tabular-nums ${
                      isToday
                        ? 'bg-action text-action-text font-semibold'
                        : isCurrentMonth
                          ? 'text-text'
                          : 'text-text-disabled'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
              )
            })}

            {bars.map((bar) => {
              const status = STATUSES[bar.reservation.status]
              return (
                <button
                  key={bar.reservation.id}
                  type="button"
                  onClick={() => onClickReservation(bar.reservation.id)}
                  className={`flex items-center gap-1.5 px-1.5 min-w-0 border text-[13px] font-medium text-text whitespace-nowrap overflow-hidden rounded-md ${
                    bar.clippedStart ? 'rounded-l-none border-l-0' : ''
                  } ${bar.clippedEnd ? 'rounded-r-none border-r-0' : ''}`}
                  style={{
                    gridColumn: `${bar.startCol} / ${bar.endCol}`,
                    gridRow: bar.lane + 2,
                    backgroundColor: status.bg,
                    borderColor: status.border,
                  }}
                >
                  <span
                    className="shrink-0 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="truncate">{bar.reservation.client_name}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
