import { STATUSES } from '../../constants/statuses'
import type { SegmentType } from '../../utils/calendar'
import type { Reservation } from '../../types/domain'
import { differenceInDays, parseISO } from 'date-fns'

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

/** Build the "5S 2D" linen suffix string, or empty if nothing to show */
function buildLinenSuffix(r: Reservation): string {
  const s = r.linen_sets_single
  const d = r.linen_sets_double
  const parts: string[] = []
  if (s != null && s > 0) parts.push(`${s}S`)
  if (d != null && d > 0) parts.push(`${d}D`)
  return parts.join(' ')
}

/** Build full tooltip text with client name, dates, and linen details */
function buildTooltip(r: Reservation): string {
  const lines = [`${r.client_name} — ${r.start_date} → ${r.end_date}`]
  const s = r.linen_sets_single
  const d = r.linen_sets_double
  const linenParts: string[] = []
  if (s != null && s > 0) linenParts.push(`${s} simples`)
  if (d != null && d > 0) linenParts.push(`${d} doubles`)
  if (linenParts.length > 0) lines.push(linenParts.join(', '))
  return lines.join('\n')
}

export default function CalendarEvent({
  reservation,
  type,
  showName,
  onClick,
}: CalendarEventProps) {
  const status = STATUSES[reservation.status]
  const linenSuffix = buildLinenSuffix(reservation)

  // Linen suffix is only shown on start/single segments of reservations
  // spanning 3+ days, to avoid cluttering short bars or narrow mobile views.
  // On shorter reservations the info remains accessible via the tooltip.
  const durationDays = differenceInDays(
    parseISO(reservation.end_date),
    parseISO(reservation.start_date),
  )
  const showSuffix =
    showName &&
    linenSuffix !== '' &&
    (type === 'start' || type === 'single') &&
    durationDays >= 3

  return (
    <div
      className={`block px-1.5 py-0.5 text-[10px] font-medium mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-sm:text-[9px] max-sm:px-1 max-sm:py-px ${segmentStyles[type]}`}
      data-reservation
      style={{ backgroundColor: status.color, color: '#000000' }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={buildTooltip(reservation)}
    >
      {showName ? (
        <>
          {reservation.client_name}
          {showSuffix && (
            <span className="text-[9px] md:text-[10px] opacity-70 ml-1">
              · {linenSuffix}
            </span>
          )}
        </>
      ) : (
        '\u00A0'
      )}
    </div>
  )
}
