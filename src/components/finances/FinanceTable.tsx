import { LABELS } from '../../constants/labels'
import { formatEUR } from '../../utils/money'
import type { Quarter } from '../../types/domain'

interface FinanceTableProps {
  revenuesByQuarter: Record<Quarter, number>
  taxesByQuarter: Record<Quarter, number>
  miscByQuarter: Record<Quarter, number>
  currentQuarter: Quarter | null // null when viewing a different year
  isLoading: boolean
  onQuarterClick: (quarter: Quarter) => void
}

const QUARTER_LABELS: Record<Quarter, string> = {
  1: 'T1 — jan à mars',
  2: 'T2 — avr à juin',
  3: 'T3 — juil à sept',
  4: 'T4 — oct à déc',
}

const headerClass = 'text-left text-[12px] font-medium text-text-secondary px-3 py-2'
const cellClass = 'px-3 py-2.5 text-[13px] text-text'

export default function FinanceTable({
  revenuesByQuarter,
  taxesByQuarter,
  miscByQuarter,
  currentQuarter,
  isLoading,
  onQuarterClick,
}: FinanceTableProps) {
  const quarters: Quarter[] = [1, 2, 3, 4]

  return (
    <div className={`overflow-x-auto ${isLoading ? 'opacity-50' : ''}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className={headerClass}>{LABELS.quarterHeader}</th>
            <th className={`${headerClass} text-right`}>{LABELS.revenueHeader}</th>
            <th className={`${headerClass} text-right`}>{LABELS.taxHeader}</th>
            <th className={`${headerClass} text-right`}>{LABELS.notesHeader}</th>
          </tr>
        </thead>
        <tbody>
          {quarters.map((q) => {
            const isCurrent = q === currentQuarter
            return (
              <tr
                key={q}
                className={`border-b border-border cursor-pointer hover:bg-surface-alt transition-colors ${
                  isCurrent ? 'bg-status-blue-bg font-medium' : ''
                }`}
                onClick={() => onQuarterClick(q)}
              >
                <td className={cellClass}>{QUARTER_LABELS[q]}</td>
                <td className={`${cellClass} text-right`}>{formatEUR(revenuesByQuarter[q])}</td>
                <td className={`${cellClass} text-right`}>{formatEUR(taxesByQuarter[q])}</td>
                <td className={`${cellClass} text-right`}>{formatEUR(miscByQuarter[q])}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
