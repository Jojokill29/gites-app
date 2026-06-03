import { differenceInDays, parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import InlineNumberInput from './InlineNumberInput'
import { LABELS } from '../../constants/labels'
import { STATUSES } from '../../constants/statuses'
import { formatEUR } from '../../utils/money'
import { supabase } from '../../lib/supabase'
import type { Reservation, Gite } from '../../types/domain'

interface StaysTableProps {
  reservations: Reservation[]
  gites: Gite[]
  onReservationClick: (reservation: Reservation) => void
  onReservationUpdated: () => void
}

export default function StaysTable({
  reservations,
  gites,
  onReservationClick,
  onReservationUpdated,
}: StaysTableProps) {
  if (reservations.length === 0) {
    return (
      <p className="text-[13px] text-text-secondary italic py-2">
        {LABELS.noStays}
      </p>
    )
  }

  const giteMap = new Map(gites.map((g) => [g.id, g]))

  const handleInlineSave = async (
    reservationId: string,
    field: 'adult_count' | 'tax_amount',
    value: number | null,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('reservations')
      .update({ [field]: value })
      .eq('id', reservationId)

    if (error) {
      console.error(`Inline update ${field} error:`, error)
      return false
    }
    onReservationUpdated()
    return true
  }

  const thClass = 'text-left text-[11px] font-medium text-text-secondary px-2 py-1.5 whitespace-nowrap'
  const tdClass = 'px-2 py-1.5 text-[12px] text-text whitespace-nowrap'

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>{LABELS.arrival}</th>
            <th className={thClass}>{LABELS.gite}</th>
            <th className={`${thClass} text-right`}>{LABELS.nights}</th>
            <th className={`${thClass} text-right`}>{LABELS.adults}</th>
            <th className={`${thClass} text-right`}>{LABELS.revenueHeader}</th>
            <th className={`${thClass} text-right`}>{LABELS.tax}</th>
            <th className={thClass}></th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => {
            const gite = giteMap.get(r.gite_id)
            const status = STATUSES[r.status]
            const nights = differenceInDays(parseISO(r.end_date), parseISO(r.start_date))
            const arrivalLabel = `${format(parseISO(r.start_date), 'd MMM', { locale: fr })} ${r.client_name}`

            return (
              <tr key={r.id} className="border-b border-border last:border-b-0">
                <td className={tdClass}>{arrivalLabel}</td>
                <td className={tdClass}>
                  {gite && (
                    <span
                      className="inline-block px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {gite.name}
                    </span>
                  )}
                </td>
                <td className={`${tdClass} text-right`}>{nights}</td>
                <td className={`${tdClass} text-right`}>
                  <InlineNumberInput
                    value={r.adult_count}
                    onSave={(v) => handleInlineSave(r.id, 'adult_count', v)}
                  />
                </td>
                <td className={`${tdClass} text-right`}>
                  {formatEUR(Number(r.paid_amount))}
                </td>
                <td className={`${tdClass} text-right`}>
                  <InlineNumberInput
                    value={r.tax_amount != null ? Number(r.tax_amount) : null}
                    onSave={(v) => handleInlineSave(r.id, 'tax_amount', v)}
                    format={(v) => v != null ? formatEUR(v) : '—'}
                  />
                </td>
                <td className={tdClass}>
                  <button
                    type="button"
                    onClick={() => onReservationClick(r)}
                    className="text-[12px] text-text-secondary hover:text-text"
                    title={LABELS.openReservation}
                  >
                    ↗
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
