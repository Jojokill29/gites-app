import { useMemo } from 'react'
import { getMonth, isSameDay } from 'date-fns'
import { buildMonthGrid } from '../../utils/calendar'
import { buildWeekBars, laneCount } from '../../utils/weekBars'
import { STATUSES } from '../../constants/statuses'
import type { Reservation } from '../../types/domain'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface MobileCalendarProps {
  year: number
  month: number
  reservations: Reservation[]
  loading: boolean
  onClickReservation: (reservationId: string) => void
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
}: MobileCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month])

  return (
    <div
      className={`bg-calendar border border-border rounded-lg overflow-hidden transition-opacity ${
        loading ? 'opacity-60' : ''
      }`}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 h-7 items-center border-b border-border text-[12px] text-text-tertiary text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      {weeks.map((week) => {
        const bars = buildWeekBars(week[0], reservations)
        const lanes = laneCount(bars)

        return (
          <div
            key={week[0].toISOString()}
            className="grid border-t border-border-grid first:border-t-0"
            style={{
              gridTemplateColumns: 'repeat(14, 1fr)',
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
                  className={`px-2 pt-1.5 text-[13px] ${cellBg}`}
                  style={{
                    gridColumn: `${2 * dayIndex + 1} / ${2 * dayIndex + 3}`,
                    gridRow: '1 / -1',
                  }}
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
