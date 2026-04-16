import CalendarEvent from './CalendarEvent'
import { STATUSES } from '../../constants/statuses'
import type { DayInfo } from '../../utils/calendar'
import type { StatusKey } from '../../constants/statuses'

interface CalendarDayProps {
  day: DayInfo
  onClickDay: (dateStr: string) => void
  onClickReservation: (reservationId: string) => void
}

export default function CalendarDay({
  day,
  onClickDay,
  onClickReservation,
}: CalendarDayProps) {
  const hasRotation = day.rotation !== null
  const isEmpty = !day.isCurrentMonth

  const baseClasses =
    'min-h-[72px] p-1.5 border-r border-b border-border relative cursor-pointer transition-colors max-sm:min-h-[56px] max-sm:p-1'

  const stateClasses = isEmpty
    ? 'bg-surface-alt opacity-40 cursor-default'
    : day.isToday
      ? 'bg-status-blue-bg hover:bg-status-blue-bg/80'
      : 'hover:bg-surface-alt'

  // Rotation days need more height
  const heightClass = hasRotation ? 'min-h-[90px] max-sm:min-h-[76px]' : ''

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${heightClass} [&:nth-child(7n)]:border-r-0`}
      onClick={() => !isEmpty && onClickDay(day.dateStr)}
    >
      <div
        className={`text-[12px] font-medium mb-1 max-sm:text-[11px] ${
          day.isToday
            ? 'text-status-blue-text font-semibold'
            : 'text-text-secondary'
        }`}
      >
        {day.date.getDate()}
      </div>

      {/* Normal reservation bar segments */}
      {day.segments.map((seg) => (
        <CalendarEvent
          key={seg.reservation.id}
          reservation={seg.reservation}
          type={seg.type}
          showName={seg.showName}
          onClick={() => onClickReservation(seg.reservation.id)}
        />
      ))}

      {/* Rotation display: two stacked bars */}
      {day.rotation && (
        <>
          <div
            className="block px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-sm:text-[9px] max-sm:px-1 max-sm:py-px"
            style={{
              backgroundColor:
                STATUSES[day.rotation.departing.status as StatusKey].color,
              color:
                STATUSES[day.rotation.departing.status as StatusKey].text,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClickReservation(day.rotation!.departing.id)
            }}
            title={day.rotation.departing.client_name}
          >
            Dép. {day.rotation.departing.client_name}
          </div>
          <div
            className="block px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-sm:text-[9px] max-sm:px-1 max-sm:py-px"
            style={{
              backgroundColor:
                STATUSES[day.rotation.arriving.status as StatusKey].color,
              color:
                STATUSES[day.rotation.arriving.status as StatusKey].text,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClickReservation(day.rotation!.arriving.id)
            }}
            title={day.rotation.arriving.client_name}
          >
            Arr. {day.rotation.arriving.client_name}
          </div>
          <div className="text-[9px] text-text-tertiary text-center mt-px tracking-wide">
            rotation
          </div>
        </>
      )}
    </div>
  )
}
