import CalendarEvent from './CalendarEvent'
import type { StatusKey } from '../../constants/statuses'
import type { DayInfo } from '../../utils/calendar'

interface CalendarDayProps {
  day: DayInfo
  onClickDay: (dateStr: string) => void
  onClickReservation: (reservationId: string) => void
}

// Rotation bars use the same status fill as a normal booking bar
const ROTATION_TINT: Record<StatusKey, { bar: string; dot: string }> = {
  pending_contract: { bar: 'bg-status-red-bg border-status-red-border', dot: 'bg-status-red' },
  pending_deposit: { bar: 'bg-status-orange-bg border-status-orange-border', dot: 'bg-status-orange' },
  deposit_paid: { bar: 'bg-status-green-bg border-status-green-border', dot: 'bg-status-green' },
}

export default function CalendarDay({
  day,
  onClickDay,
  onClickReservation,
}: CalendarDayProps) {
  const hasRotation = day.rotation !== null
  const isEmpty = !day.isCurrentMonth
  // Saturday and Sunday get a slightly lighter cell
  const weekday = day.date.getDay()
  const isWeekend = weekday === 0 || weekday === 6

  const baseClasses =
    'min-h-[76px] p-1.5 border-r border-b border-border-grid relative cursor-pointer transition-colors max-sm:min-h-[56px] max-sm:p-1'

  const stateClasses = isEmpty
    ? 'bg-outside cursor-default'
    : isWeekend
      ? 'bg-weekend hover:bg-surface-alt'
      : 'hover:bg-surface-alt'

  // Rotation days need more height
  const heightClass = hasRotation ? 'min-h-[94px] max-sm:min-h-[76px]' : ''

  const rotationBar =
    'flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[11px] font-medium text-text mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden max-sm:text-[9px] max-sm:px-1 max-sm:py-px'

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${heightClass} [&:nth-child(7n)]:border-r-0`}
      onClick={(e) => {
        // Only trigger day click if clicking directly on the cell or day number,
        // not on a reservation event (which has its own handler + stopPropagation)
        const target = e.target as HTMLElement
        const isEventBar = target.closest('[data-reservation]')
        if (!isEmpty && !isEventBar) {
          onClickDay(day.dateStr)
        }
      }}
    >
      {/* Today is a light pill around the number, not a tinted cell */}
      <div className="mb-1">
        <span
          className={`inline-grid place-items-center min-w-[22px] h-[22px] rounded-sm text-[12px] tabular-nums max-sm:text-[11px] max-sm:min-w-[19px] max-sm:h-[19px] ${
            day.isToday
              ? 'bg-action text-action-text font-semibold'
              : isEmpty
                ? 'text-text-disabled'
                : 'text-text'
          }`}
        >
          {day.date.getDate()}
        </span>
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
            data-reservation
            className={`${rotationBar} ${ROTATION_TINT[day.rotation.departing.status].bar}`}
            onClick={(e) => {
              e.stopPropagation()
              onClickReservation(day.rotation!.departing.id)
            }}
            title={day.rotation.departing.client_name}
          >
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${ROTATION_TINT[day.rotation.departing.status].dot}`} />
            <span className="overflow-hidden text-ellipsis">Dép. {day.rotation.departing.client_name}</span>
          </div>
          <div
            data-reservation
            className={`${rotationBar} ${ROTATION_TINT[day.rotation.arriving.status].bar}`}
            onClick={(e) => {
              e.stopPropagation()
              onClickReservation(day.rotation!.arriving.id)
            }}
            title={day.rotation.arriving.client_name}
          >
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${ROTATION_TINT[day.rotation.arriving.status].dot}`} />
            <span className="overflow-hidden text-ellipsis">Arr. {day.rotation.arriving.client_name}</span>
          </div>
          <div className="font-mono text-[11px] text-text-muted text-center mt-px max-sm:text-[9px]">
            rotation
          </div>
        </>
      )}
    </div>
  )
}
