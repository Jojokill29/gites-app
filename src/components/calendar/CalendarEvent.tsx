import { LABELS } from '../../constants/labels'
import type { SegmentType } from '../../utils/calendar'
import type { Reservation } from '../../types/domain'
import type { StatusKey } from '../../constants/statuses'
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

// Tinted status treatment — colours resolve from CSS variables, so both the
// light and dark palettes are handled automatically. The leading edge of a
// reservation gets a 3px accent in the full status colour.
const STATUS_TINT: Record<StatusKey, { fill: string; edge: string }> = {
  pending_contract: { fill: 'bg-status-red-bg text-status-red-text', edge: 'border-status-red' },
  pending_deposit: { fill: 'bg-status-orange-bg text-status-orange-text', edge: 'border-status-orange' },
  deposit_paid: { fill: 'bg-status-green-bg text-status-green-text', edge: 'border-status-green' },
}

/** Check if a reservation is missing its contract file */
function isContractMissing(r: Reservation): boolean {
  return r.status === 'pending_contract' && r.contract_path === null
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
  if (isContractMissing(r)) lines[0] += ` — ${LABELS.missingContract}`
  return lines.join('\n')
}

export default function CalendarEvent({
  reservation,
  type,
  showName,
  onClick,
}: CalendarEventProps) {
  const tint = STATUS_TINT[reservation.status]
  const linenSuffix = buildLinenSuffix(reservation)

  // Leading edge accent shown on the first visible segment of the reservation
  const isEdge = type === 'start' || type === 'single'
  const edgeClass = isEdge ? `border-l-[3px] ${tint.edge}` : ''

  // Show indicator on the first visible segment only (same logic as showName,
  // which covers start, single, and middle when it's the first visible in month)
  const showMissingIcon = showName && isContractMissing(reservation)

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
      className={`flex items-center px-1.5 py-0.5 text-[10px] font-medium mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden max-sm:text-[9px] max-sm:px-1 max-sm:py-px ${tint.fill} ${edgeClass} ${segmentStyles[type]}`}
      data-reservation
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={buildTooltip(reservation)}
    >
      {showName ? (
        <span className="overflow-hidden text-ellipsis">
          {showMissingIcon && (
            <span className="mr-0.5" aria-hidden="true">⚠</span>
          )}
          {reservation.client_name}
          {showSuffix && (
            <span className="text-[9px] md:text-[10px] opacity-70 ml-1">
              · {linenSuffix}
            </span>
          )}
        </span>
      ) : (
        '\u00A0'
      )}
    </div>
  )
}
