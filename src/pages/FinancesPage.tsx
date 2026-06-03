import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LABELS } from '../constants/labels'
import { useFinances } from '../hooks/useFinances'
import { formatEUR } from '../utils/money'
import FinanceMetricCard from '../components/finances/FinanceMetricCard'
import FinanceTable from '../components/finances/FinanceTable'
import RevenueEntryModal from '../components/finances/RevenueEntryModal'
import TaxStayModal from '../components/finances/TaxStayModal'
import MiscEntryModal from '../components/finances/MiscEntryModal'
import Button from '../components/ui/Button'
import type { RevenueEntry, TaxStay, MiscEntry, Quarter } from '../types/domain'

const MIN_YEAR = 2020

function getCurrentYear(): number {
  return new Date().getFullYear()
}

function getCurrentQuarter(): Quarter {
  return (Math.floor(new Date().getMonth() / 3) + 1) as Quarter
}

type ModalState =
  | null
  | { type: 'revenue-create'; quarter: Quarter }
  | { type: 'revenue-edit'; entry: RevenueEntry }
  | { type: 'tax-create'; quarter: Quarter }
  | { type: 'tax-edit'; entry: TaxStay }
  | { type: 'misc-create'; quarter: Quarter }
  | { type: 'misc-edit'; entry: MiscEntry }

export default function FinancesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentYear = getCurrentYear()
  const maxYear = currentYear + 1

  const urlYear = searchParams.get('year')
  const year = urlYear ? Math.max(MIN_YEAR, Math.min(maxYear, Number(urlYear))) : currentYear

  const finances = useFinances(year)
  const [modal, setModal] = useState<ModalState>(null)

  const setYear = (y: number) => {
    setSearchParams({ year: String(y) })
  }

  const sum4 = (m: Record<Quarter, number>) => m[1] + m[2] + m[3] + m[4]
  const annualRevenue = sum4(finances.revenuesByQuarter)
  const annualTaxes = sum4(finances.taxesByQuarter)
  const annualMisc = sum4(finances.miscByQuarter)

  const currentQuarter = year === currentYear ? getCurrentQuarter() : null

  const handleModalClose = () => setModal(null)
  const handleModalSuccess = () => { setModal(null); finances.refetch() }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Button onClick={() => setYear(year - 1)} disabled={year <= MIN_YEAR} aria-label={LABELS.previousYear}>&lt;</Button>
          <span className="font-heading text-[20px] font-semibold text-text min-w-[60px] text-center">{year}</span>
          <Button onClick={() => setYear(year + 1)} disabled={year >= maxYear} aria-label={LABELS.nextYear}>&gt;</Button>
        </div>
        {year !== currentYear && (
          <Button onClick={() => setYear(currentYear)}>{LABELS.currentYear}</Button>
        )}
      </div>

      {finances.error && (
        <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">{LABELS.errorLoadData}</div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <FinanceMetricCard label={LABELS.annualRevenue} value={formatEUR(annualRevenue)} />
        <FinanceMetricCard label={LABELS.annualTaxes} value={formatEUR(annualTaxes)} />
        <FinanceMetricCard label={LABELS.annualMisc} value={formatEUR(annualMisc)} negative={annualMisc < 0} />
        <FinanceMetricCard label={LABELS.operationCount} value={String(finances.operationCount)} />
      </div>

      {/* Quarterly table with accordion */}
      <FinanceTable
        revenuesByQuarter={finances.revenuesByQuarter}
        taxesByQuarter={finances.taxesByQuarter}
        miscByQuarter={finances.miscByQuarter}
        revenueEntriesByQuarter={finances.revenueEntriesByQuarter}
        taxStaysByQuarter={finances.taxStaysByQuarter}
        miscEntriesByQuarter={finances.miscEntriesByQuarter}
        currentQuarter={currentQuarter}
        isLoading={finances.isLoading}
        onAddRevenue={(q) => setModal({ type: 'revenue-create', quarter: q })}
        onEditRevenue={(e) => setModal({ type: 'revenue-edit', entry: e })}
        onAddTax={(q) => setModal({ type: 'tax-create', quarter: q })}
        onEditTax={(e) => setModal({ type: 'tax-edit', entry: e })}
        onAddMisc={(q) => setModal({ type: 'misc-create', quarter: q })}
        onEditMisc={(e) => setModal({ type: 'misc-edit', entry: e })}
      />

      {/* Modals */}
      {modal?.type === 'revenue-create' && (
        <RevenueEntryModal mode="create" year={year} quarter={modal.quarter} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {modal?.type === 'revenue-edit' && (
        <RevenueEntryModal mode="edit" entry={modal.entry} year={year} quarter={modal.entry.quarter as Quarter} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {modal?.type === 'tax-create' && (
        <TaxStayModal mode="create" year={year} quarter={modal.quarter} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {modal?.type === 'tax-edit' && (
        <TaxStayModal mode="edit" entry={modal.entry} year={year} quarter={modal.entry.quarter as Quarter} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {modal?.type === 'misc-create' && (
        <MiscEntryModal mode="create" year={year} quarter={modal.quarter} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {modal?.type === 'misc-edit' && (
        <MiscEntryModal mode="edit" entry={modal.entry} year={year} quarter={modal.entry.quarter as Quarter} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
    </div>
  )
}
