import { useState } from 'react'
import StaysTable from './StaysTable'
import MiscEntriesList from './MiscEntriesList'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { formatEUR } from '../../utils/money'
import type { MiscEntry, Gite, Quarter } from '../../types/domain'
import type { StayRow } from '../../hooks/useFinances'

interface FinanceTableProps {
  revenuesByQuarter: Record<Quarter, number>
  taxesByQuarter: Record<Quarter, number>
  miscByQuarter: Record<Quarter, number>
  staysByQuarter: Record<Quarter, StayRow[]>
  miscEntriesByQuarter: Record<Quarter, MiscEntry[]>
  gites: Gite[]
  year: number
  currentQuarter: Quarter | null
  isLoading: boolean
  onStayClick: (stay: StayRow) => void
  onAddAnnexStay: (quarter: Quarter) => void
  onDataChanged: () => void
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
  staysByQuarter,
  miscEntriesByQuarter,
  gites,
  year,
  currentQuarter,
  isLoading,
  onStayClick,
  onAddAnnexStay,
  onDataChanged,
}: FinanceTableProps) {
  const [openQuarter, setOpenQuarter] = useState<Quarter | null>(null)
  const quarters: Quarter[] = [1, 2, 3, 4]

  const toggleQuarter = (q: Quarter) => {
    setOpenQuarter(openQuarter === q ? null : q)
  }

  return (
    <div className={isLoading ? 'opacity-50' : ''}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className={headerClass}>{LABELS.quarterHeader}</th>
            <th className={`${headerClass} text-right`}>{LABELS.revenueHeader}</th>
            <th className={`${headerClass} text-right`}>{LABELS.taxHeader}</th>
            <th className={`${headerClass} text-right`}>{LABELS.notesHeader}</th>
          </tr>
        </thead>
      </table>

      {quarters.map((q) => {
        const isCurrent = q === currentQuarter
        const isOpen = openQuarter === q

        return (
          <div key={q}>
            <div
              className={`flex items-center cursor-pointer hover:bg-surface-alt transition-colors border-b border-border ${
                isCurrent ? 'bg-status-blue-bg font-medium' : ''
              }`}
              onClick={() => toggleQuarter(q)}
            >
              <span className={`${cellClass} flex-1`}>
                <span className="mr-1.5 text-[11px] text-text-secondary">
                  {isOpen ? '▾' : '▸'}
                </span>
                {QUARTER_LABELS[q]}
              </span>
              <span className={`${cellClass} text-right min-w-[100px]`}>
                {formatEUR(revenuesByQuarter[q])}
              </span>
              <span className={`${cellClass} text-right min-w-[100px]`}>
                {formatEUR(taxesByQuarter[q])}
              </span>
              <span className={`${cellClass} text-right min-w-[100px]`}>
                {formatEUR(miscByQuarter[q])}
              </span>
            </div>

            {isOpen && (
              <div className="bg-surface-alt border-b border-border px-3 py-3">
                <h4 className="text-[13px] font-medium text-text mb-2">
                  {LABELS.staysSection}
                </h4>
                <StaysTable
                  stays={staysByQuarter[q]}
                  gites={gites}
                  onStayClick={onStayClick}
                />
                <div className="mt-2">
                  <Button type="button" onClick={() => onAddAnnexStay(q)}>
                    + Opération annexe
                  </Button>
                </div>

                <h4 className="text-[13px] font-medium text-text mt-4 mb-2">
                  {LABELS.miscSection}
                </h4>
                <MiscEntriesList
                  entries={miscEntriesByQuarter[q]}
                  year={year}
                  quarter={q}
                  onChanged={onDataChanged}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
