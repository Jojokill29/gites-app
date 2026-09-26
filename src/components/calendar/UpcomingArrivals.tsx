import { Link } from 'react-router-dom'
import { STATUSES } from '../../constants/statuses'
import { LABELS } from '../../constants/labels'
import { formatStayRange } from '../../utils/stayFormat'
import type { Reservation } from '../../types/domain'

interface UpcomingArrivalsProps {
  reservations: Reservation[]
  onClickReservation: (reservationId: string) => void
}

/**
 * The next arrivals of the displayed month, under the mobile grid.
 * Nothing is fetched here: the list is derived from the month already loaded.
 */
export default function UpcomingArrivals({
  reservations,
  onClickReservation,
}: UpcomingArrivalsProps) {
  return (
    <section className="mt-5">
      <div className="flex justify-between items-baseline px-1 pb-2">
        <h2 className="text-[14px] font-semibold text-text">
          {LABELS.mobile.upcomingArrivals}
        </h2>
        <Link to="/reservations" className="text-[13px] text-text-tertiary">
          {LABELS.mobile.seeAll}
        </Link>
      </div>

      {reservations.length === 0 ? (
        <p className="px-1 py-3 text-[13px] text-text-muted border-t border-border">
          {LABELS.mobile.noUpcomingArrivals}
        </p>
      ) : (
        <div className="border-t border-border">
          {reservations.map((reservation) => {
            const status = STATUSES[reservation.status]
            return (
              <button
                key={reservation.id}
                type="button"
                onClick={() => onClickReservation(reservation.id)}
                className="w-full h-14 flex justify-between items-center gap-3 border-b border-border text-left"
              >
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-medium text-text truncate">
                    {reservation.client_name}
                  </span>
                  <span className="font-mono text-[11px] text-text-secondary">
                    {formatStayRange(reservation.start_date, reservation.end_date)}
                    {reservation.guest_count != null &&
                      ` · ${reservation.guest_count} ${LABELS.mobile.people}`}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-text-secondary shrink-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
