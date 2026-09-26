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

// Inner edges of a multi-day bar lose their border and radius so the
// segments read as one continuous bar across the week.
const segmentStyles: Record<SegmentType, string> = {
  start: 'rounded-l-md rounded-r-none border-r-0 mr-[-6px]',
  middle: 'rounded-none border-x-0 ml-[-6px] mr-[-6px]',
  end: 'rounded-l-none rounded-r-md border-l-0 ml-[-6px]',
  single: 'rounded-md',
}

// A booking bar is a status-tinted fill with a matching border and a 6px dot
const STATUS_TINT: Record<StatusKey, { fill: string; dot: string }> = {
  pending_contract: { fill: 'bg-status-red-bg border-status-red-border', dot: 'bg-status-red' },
  pending_deposit: { fill: 'bg-status-orange-bg border-status-orange-border', dot: 'bg-status-orange' },
  deposit_paid: { fill: 'bg-status-green-bg border-status-green-border', dot: 'bg-status-green' },
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
      className={`flex items-center gap-1.5 px-1.5 py-[3px] border text-[13px] font-medium text-text mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden max-sm:text-[10px] max-sm:gap-1 max-sm:px-1 max-sm:py-px ${tint.fill} ${segmentStyles[type]}`}
      data-reservation
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={buildTooltip(reservation)}
    >
      {showName ? (
        <>
          <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${tint.dot}`} />
          <span className="overflow-hidden text-ellipsis">
            {showMissingIcon && (
              <span className="text-alert mr-0.5" aria-hidden="true">⚠</span>
            )}
            {reservation.client_name}
            {showSuffix && (
              <span className="font-mono text-[11px] text-text-secondary ml-1.5 max-sm:text-[9px]">
                {linenSuffix}
              </span>
            )}
          </span>
        </>
      ) : (
        '\u00A0'
      )}
    </div>
  )
}
