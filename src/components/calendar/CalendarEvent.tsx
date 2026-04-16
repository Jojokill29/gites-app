import { STATUSES } from '../../constants/statuses'
import type { SegmentType } from '../../utils/calendar'
import type { Reservation } from '../../types/domain'
import type { StatusKey } from '../../constants/statuses'

interface CalendarEventProps {
  reservation: Reservation
  type: SegmentType
  showName: boolean
  onClick: () => void
}

const segmentStyles: Record<SegmentType, string> = {
  start: 'rounded-l-[4px] rounded-r-none mr-[-6px]',
  middle: 'rounded-none ml-[-6px] mr-[-6px]',
  end: 'rounded-l-none rounded-r-[4px] ml-[-6px]',
  single: 'rounded-[4px]',
}

export default function CalendarEvent({
  reservation,
  type,
  showName,
  onClick,
}: CalendarEventProps) {
  const status = STATUSES[reservation.status as StatusKey]

  return (
    <div
      className={`block px-1.5 py-0.5 text-[10px] font-medium mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-sm:text-[9px] max-sm:px-1 max-sm:py-px ${segmentStyles[type]}`}
      style={{ backgroundColor: status.color, color: status.text }}
      onClick={onClick}
      title={reservation.client_name}
    >
      {showName ? reservation.client_name : '\u00A0'}
    </div>
  )
}
