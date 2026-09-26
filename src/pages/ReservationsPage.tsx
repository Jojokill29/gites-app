import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, getYear, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useUpcomingReservations } from '../hooks/useUpcomingReservations'
import { STATUSES } from '../constants/statuses'
import { LABELS } from '../constants/labels'
import { formatDayMonth } from '../utils/stayFormat'
import { computeRemaining, formatEURorDash } from '../utils/money'
import type { Gite, Reservation } from '../types/domain'

interface ReservationsPageProps {
  gites: Gite[]
}

type StatusFilter = 'upcoming' | 'pending_contract' | 'pending_deposit'

const tabClass = (active: boolean) =>
  `h-11 flex items-center gap-1.5 shrink-0 border-b-2 text-[14px] ${
    active
      ? 'text-text font-medium border-action'
      : 'text-text-tertiary border-transparent'
  }`

const chipClass = (active: boolean) =>
  `h-9 px-2.5 rounded-md flex items-center gap-1.5 text-[13px] whitespace-nowrap shrink-0 ${
    active
      ? 'bg-action text-action-text font-medium'
      : 'border border-border-hover text-text'
  }`

/** Group reservations by arrival month, keeping the incoming order. */
function groupByMonth(
  reservations: Reservation[],
): { key: string; label: string; items: Reservation[] }[] {
  const groups: { key: string; label: string; items: Reservation[] }[] = []
  const thisYear = getYear(new Date())

  for (const reservation of reservations) {
    const date = parseISO(reservation.start_date)
    const key = format(date, 'yyyy-MM')
    let group = groups.find((g) => g.key === key)
    if (!group) {
      // The year is only worth showing when it is not the current one
      const pattern = getYear(date) === thisYear ? 'MMMM' : 'MMMM yyyy'
      const label = format(date, pattern, { locale: fr })
      group = {
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        items: [],
      }
      groups.push(group)
    }
    group.items.push(reservation)
  }

  return groups
}

/** 2b — the mobile-only list of stays. */
export default function ReservationsPage({ gites }: ReservationsPageProps) {
  const navigate = useNavigate()
  const { reservations, loading, error } = useUpcomingReservations()
  const [giteFilter, setGiteFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming')

  const byGite = useMemo(
    () =>
      giteFilter
        ? reservations.filter((r) => r.gite_id === giteFilter)
        : reservations,
    [reservations, giteFilter],
  )

  // Counters always describe the gite currently selected
  const counts = useMemo(
    () => ({
      upcoming: byGite.length,
      pending_contract: byGite.filter((r) => r.status === 'pending_contract').length,
      pending_deposit: byGite.filter((r) => r.status === 'pending_deposit').length,
    }),
    [byGite],
  )

  const visible = useMemo(
    () =>
      statusFilter === 'upcoming'
        ? byGite
        : byGite.filter((r) => r.status === statusFilter),
    [byGite, statusFilter],
  )

  const groups = useMemo(() => groupByMonth(visible), [visible])

  const giteName = (giteId: string) =>
    gites.find((g) => g.id === giteId)?.name ?? ''

  return (
    <div className="px-4">
      {/* Gite tabs, flush with the header */}
      <div className="-mx-4 px-5 flex gap-6 border-b border-border overflow-x-auto scrollbar-none">
        <button
          type="button"
          className={tabClass(giteFilter === null)}
          onClick={() => setGiteFilter(null)}
        >
          {LABELS.mobile.allGites}
        </button>
        {gites.map((g) => (
          <button
            key={g.id}
            type="button"
            className={tabClass(giteFilter === g.id)}
            onClick={() => setGiteFilter(g.id)}
          >
            {g.name}
            <span className="font-mono text-[11px] text-text-muted">
              {g.capacity}p
            </span>
          </button>
        ))}
      </div>

      {/* Status filters with their counters */}
      <div className="flex gap-1.5 py-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          className={chipClass(statusFilter === 'upcoming')}
          onClick={() => setStatusFilter('upcoming')}
        >
          {LABELS.mobile.filterUpcoming}
          <span className="font-mono text-[11px]">{counts.upcoming}</span>
        </button>
        <button
          type="button"
          className={chipClass(statusFilter === 'pending_contract')}
          onClick={() => setStatusFilter('pending_contract')}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: STATUSES.pending_contract.color }}
          />
          {LABELS.mobile.filterContract}
          <span className="font-mono text-[11px] text-text-muted">
            {counts.pending_contract}
          </span>
        </button>
        <button
          type="button"
          className={chipClass(statusFilter === 'pending_deposit')}
          onClick={() => setStatusFilter('pending_deposit')}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: STATUSES.pending_deposit.color }}
          />
          {LABELS.mobile.filterDeposit}
          <span className="font-mono text-[11px] text-text-muted">
            {counts.pending_deposit}
          </span>
        </button>
      </div>

      {error && (
        <p className="py-3 text-[13px] text-status-red-text">
          {LABELS.errorLoadData}
        </p>
      )}

      {loading ? (
        <p className="py-3 text-[13px] text-text-muted">{LABELS.loading}</p>
      ) : groups.length === 0 ? (
        <p className="py-3 text-[13px] text-text-muted border-t border-border">
          {LABELS.mobile.noReservations}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.key}>
            <div className="pt-4 pb-2 text-[12px] text-text-tertiary border-b border-border">
              {group.label}
            </div>
            {group.items.map((r) => {
              const status = STATUSES[r.status]
              const remaining = computeRemaining(r.total_amount, r.paid_amount)
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(`/reservations/${r.id}`)}
                  className="w-full h-16 grid grid-cols-[56px_minmax(0,1fr)_auto] gap-3 items-center border-b border-border text-left"
                >
                  <span className="flex flex-col">
                    <span className="text-[17px] font-semibold text-text tabular-nums">
                      {format(parseISO(r.start_date), 'd')}
                    </span>
                    <span className="font-mono text-[11px] text-text-muted">
                      → {formatDayMonth(r.end_date)}
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[14px] font-medium text-text truncate">
                      {r.client_name}
                    </span>
                    <span className="text-[12px] text-text-secondary truncate">
                      {giteName(r.gite_id)}
                      {r.guest_count != null &&
                        ` · ${r.guest_count} ${LABELS.mobile.people}`}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    <span className="text-[14px] font-medium text-text tabular-nums">
                      {formatEURorDash(remaining)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
