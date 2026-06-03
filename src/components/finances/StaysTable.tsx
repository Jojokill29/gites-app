import { differenceInDays, parseISO, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { LABELS } from '../../constants/labels'
import { formatEUR } from '../../utils/money'
import type { Gite } from '../../types/domain'
import type { StayRow } from '../../hooks/useFinances'

interface StaysTableProps {
  stays: StayRow[]
  gites: Gite[]
  onStayClick: (stay: StayRow) => void
}

const ANNEX_PILL = { bg: '#E8E3DC', text: '#5C5346' }

export default function StaysTable({
  stays,
  gites,
  onStayClick,
}: StaysTableProps) {
  if (stays.length === 0) {
    return (
      <p className="text-[13px] text-text-secondary italic py-2">
        {LABELS.noStays}
      </p>
    )
  }

  const giteMap = new Map(gites.map((g) => [g.id, g]))

  const thClass = 'text-left text-[11px] font-medium text-text-secondary px-2 py-1.5 whitespace-nowrap'
  const tdClass = 'px-2 py-1.5 text-[12px] text-text whitespace-nowrap'

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr className="border-b border-border">
            <th className={thClass}>{LABELS.arrival}</th>
            <th className={thClass}>Lieu</th>
            <th className={`${thClass} text-right`}>{LABELS.nights}</th>
            <th className={`${thClass} text-right`}>{LABELS.adults}</th>
            <th className={`${thClass} text-right`}>{LABELS.revenueHeader}</th>
            <th className={`${thClass} text-right`}>{LABELS.tax}</th>
            <th className={thClass}></th>
          </tr>
        </thead>
        <tbody>
          {stays.map((s) => {
            const nights = differenceInDays(parseISO(s.end_date), parseISO(s.start_date))
            const arrivalLabel = `${format(parseISO(s.start_date), 'd MMM', { locale: fr })} ${s.client_name}`

            // Pill: gite name for reservations, "Annexe" for annex stays
            let pillLabel: string
            let pillBg: string
            let pillText: string
            if (s.source === 'annex') {
              pillLabel = 'Annexe'
              pillBg = ANNEX_PILL.bg
              pillText = ANNEX_PILL.text
            } else {
              const gite = s.gite_id ? giteMap.get(s.gite_id) : null
              pillLabel = gite?.name ?? '?'
              // Use a neutral pill for gite names
              pillBg = '#E6F1FB'
              pillText = '#0C447C'
            }

            return (
              <tr key={`${s.source}-${s.id}`} className="border-b border-border last:border-b-0">
                <td className={tdClass}>{arrivalLabel}</td>
                <td className={tdClass}>
                  <span
                    className="inline-block px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium"
                    style={{ backgroundColor: pillBg, color: pillText }}
                  >
                    {pillLabel}
                  </span>
                </td>
                <td className={`${tdClass} text-right`}>{nights}</td>
                <td className={`${tdClass} text-right`}>{s.adult_count ?? '—'}</td>
                <td className={`${tdClass} text-right`}>{formatEUR(s.paid_amount)}</td>
                <td className={`${tdClass} text-right`}>
                  {s.tax_amount != null ? formatEUR(s.tax_amount) : '—'}
                </td>
                <td className={tdClass}>
                  <button
                    type="button"
                    onClick={() => onStayClick(s)}
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
