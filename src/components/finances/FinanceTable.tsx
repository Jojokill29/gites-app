import { useState } from 'react'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { formatEUR } from '../../utils/money'
import type { RevenueEntry, TaxStay, MiscEntry, Quarter } from '../../types/domain'

const GITE_PILL: Record<string, { bg: string; text: string }> = {
  'Le Vallon': { bg: '#E6F1FB', text: '#0C447C' },
  'La Salmonière': { bg: '#E1F5EE', text: '#085041' },
  'Annexe': { bg: '#E8E3DC', text: '#5C5346' },
}

interface FinanceTableProps {
  revenuesByQuarter: Record<Quarter, number>
  taxesByQuarter: Record<Quarter, number>
  miscByQuarter: Record<Quarter, number>
  revenueEntriesByQuarter: Record<Quarter, RevenueEntry[]>
  taxStaysByQuarter: Record<Quarter, TaxStay[]>
  miscEntriesByQuarter: Record<Quarter, MiscEntry[]>
  currentQuarter: Quarter | null
  isLoading: boolean
  onAddRevenue: (quarter: Quarter) => void
  onEditRevenue: (entry: RevenueEntry) => void
  onAddTax: (quarter: Quarter) => void
  onEditTax: (entry: TaxStay) => void
  onAddMisc: (quarter: Quarter) => void
  onEditMisc: (entry: MiscEntry) => void
}

const QUARTER_LABELS: Record<Quarter, string> = {
  1: 'T1 — jan à mars',
  2: 'T2 — avr à juin',
  3: 'T3 — juil à sept',
  4: 'T4 — oct à déc',
}

const headerClass = 'text-left text-[12px] font-medium text-text-secondary px-3 py-2'
const cellClass = 'px-3 py-2.5 text-[13px] text-text'
const itemClass = 'flex items-center justify-between gap-2 p-2 rounded-[8px] bg-bg'

function GitePill({ label }: { label: string }) {
  const style = GITE_PILL[label] ?? { bg: '#E8E3DC', text: '#5C5346' }
  return (
    <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium" style={{ backgroundColor: style.bg, color: style.text }}>
      {label}
    </span>
  )
}

export default function FinanceTable({
  revenuesByQuarter, taxesByQuarter, miscByQuarter,
  revenueEntriesByQuarter, taxStaysByQuarter, miscEntriesByQuarter,
  currentQuarter, isLoading,
  onAddRevenue, onEditRevenue, onAddTax, onEditTax, onAddMisc, onEditMisc,
}: FinanceTableProps) {
  const [openQuarter, setOpenQuarter] = useState<Quarter | null>(null)
  const quarters: Quarter[] = [1, 2, 3, 4]

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
              className={`flex items-center cursor-pointer hover:bg-surface-alt transition-colors border-b border-border ${isCurrent ? 'bg-status-blue-bg font-medium' : ''}`}
              onClick={() => setOpenQuarter(isOpen ? null : q)}
            >
              <span className={`${cellClass} flex-1`}>
                <span className="mr-1.5 text-[11px] text-text-secondary">{isOpen ? '▾' : '▸'}</span>
                {QUARTER_LABELS[q]}
              </span>
              <span className={`${cellClass} text-right min-w-[90px]`}>{formatEUR(revenuesByQuarter[q])}</span>
              <span className={`${cellClass} text-right min-w-[90px]`}>{formatEUR(taxesByQuarter[q])}</span>
              <span className={`${cellClass} text-right min-w-[90px]`}>{formatEUR(miscByQuarter[q])}</span>
            </div>

            {isOpen && (
              <div className="bg-surface-alt border-b border-border px-3 py-3">
                {/* Revenue entries */}
                <h4 className="text-[13px] font-medium text-text mb-2">{LABELS.revenueSection}</h4>
                {revenueEntriesByQuarter[q].length === 0 ? (
                  <p className="text-[13px] text-text-secondary italic mb-2">{LABELS.noRevenueEntries}</p>
                ) : (
                  <ul className="space-y-1.5 mb-2">
                    {revenueEntriesByQuarter[q].map((e) => (
                      <li key={e.id} className={itemClass}>
                        <div className="flex-1 min-w-0">
                          <GitePill label={e.gite_label} />
                          {e.entry_date && <span className="text-[12px] text-text-secondary ml-2">{e.entry_date}</span>}
                          <span className="text-[13px] text-text font-medium ml-2">{formatEUR(Number(e.amount))}</span>
                          {e.notes && <p className="text-[12px] text-text-secondary mt-0.5 break-words">{e.notes}</p>}
                        </div>
                        <Button type="button" className="!px-2 !py-1 !text-[11px]" onClick={() => onEditRevenue(e)}>Modifier</Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" onClick={() => onAddRevenue(q)}>{LABELS.addRevenue}</Button>

                {/* Tax stays */}
                <h4 className="text-[13px] font-medium text-text mt-4 mb-2">{LABELS.taxSection}</h4>
                {taxStaysByQuarter[q].length === 0 ? (
                  <p className="text-[13px] text-text-secondary italic mb-2">{LABELS.noTaxStays}</p>
                ) : (
                  <ul className="space-y-1.5 mb-2">
                    {taxStaysByQuarter[q].map((t) => (
                      <li key={t.id} className={itemClass}>
                        <div className="flex-1 min-w-0">
                          <GitePill label={t.gite_label} />
                          {t.stay_dates && <span className="text-[12px] text-text-secondary ml-2">{t.stay_dates}</span>}
                          <span className="text-[12px] text-text-secondary ml-2">{t.nights_count}n · {t.adult_count}ad</span>
                          {t.amount != null && <span className="text-[13px] text-text font-medium ml-2">{formatEUR(Number(t.amount))}</span>}
                          {t.notes && <p className="text-[12px] text-text-secondary mt-0.5 break-words">{t.notes}</p>}
                        </div>
                        <Button type="button" className="!px-2 !py-1 !text-[11px]" onClick={() => onEditTax(t)}>Modifier</Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" onClick={() => onAddTax(q)}>{LABELS.addTax}</Button>

                {/* Misc entries */}
                <h4 className="text-[13px] font-medium text-text mt-4 mb-2">{LABELS.miscSection}</h4>
                {miscEntriesByQuarter[q].length === 0 ? (
                  <p className="text-[13px] text-text-secondary italic mb-2">{LABELS.noMiscEntries}</p>
                ) : (
                  <ul className="space-y-1.5 mb-2">
                    {miscEntriesByQuarter[q].map((m) => (
                      <li key={m.id} className={itemClass}>
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] text-text font-medium">{m.label}</span>
                          <span className={`text-[13px] ml-2 ${Number(m.amount) < 0 ? 'text-status-red-text' : 'text-text-secondary'}`}>
                            {formatEUR(Number(m.amount))}
                          </span>
                          {m.notes && <p className="text-[12px] text-text-secondary mt-0.5 break-words">{m.notes}</p>}
                        </div>
                        <Button type="button" className="!px-2 !py-1 !text-[11px]" onClick={() => onEditMisc(m)}>Modifier</Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" onClick={() => onAddMisc(q)}>{LABELS.addNote}</Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
