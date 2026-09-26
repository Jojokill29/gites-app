import { useMemo } from 'react'
import CalendarDay from './CalendarDay'
import { buildMonthGrid, buildDayInfo } from '../../utils/calendar'
import type { Reservation } from '../../types/domain'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface CalendarGridProps {
  year: number
  month: number
  reservations: Reservation[]
  loading: boolean
  onClickDay: (dateStr: string) => void
  onClickReservation: (reservationId: string) => void
}

export default function CalendarGrid({
  year,
  month,
  reservations,
  loading,
  onClickDay,
  onClickReservation,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), [])

  const weeks = useMemo(
    () => buildMonthGrid(year, month),
    [year, month],
  )

  const dayInfos = useMemo(
    () =>
      weeks.map((week) =>
        week.map((date) => buildDayInfo(date, reservations, month, today)),
      ),
    [weeks, reservations, month, today],
  )

  return (
    <div
      className={`bg-calendar border border-border rounded-lg overflow-hidden transition-opacity ${
        loading ? 'opacity-60' : ''
      }`}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 px-2.5 text-[12px] text-text-tertiary max-sm:text-[11px] max-sm:px-1.5 max-sm:text-center"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {dayInfos.map((week) =>
          week.map((day) => (
            <CalendarDay
              key={day.dateStr}
              day={day}
              onClickDay={onClickDay}
              onClickReservation={onClickReservation}
            />
          )),
        )}
      </div>
    </div>
  )
}
