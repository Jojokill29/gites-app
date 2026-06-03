import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LABELS } from '../constants/labels'
import { useFinances } from '../hooks/useFinances'
import type { StayRow } from '../hooks/useFinances'
import { formatEUR } from '../utils/money'
import FinanceMetricCard from '../components/finances/FinanceMetricCard'
import FinanceTable from '../components/finances/FinanceTable'
import ReservationModal from '../components/reservation/ReservationModal'
import AnnexStayModal from '../components/finances/AnnexStayModal'
import Button from '../components/ui/Button'
import type { Gite, AnnexStay, Quarter } from '../types/domain'

const MIN_YEAR = 2020

function getCurrentYear(): number {
  return new Date().getFullYear()
}

function getCurrentQuarter(): Quarter {
  return (Math.floor(new Date().getMonth() / 3) + 1) as Quarter
}

interface FinancesPageProps {
  gites: Gite[]
}

type ModalState =
  | null
  | { type: 'reservation'; reservationId: string; giteId: string; stay: StayRow }
  | { type: 'annex-create' }
  | { type: 'annex-edit'; annexStay: AnnexStay }

export default function FinancesPage({ gites }: FinancesPageProps) {
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

  const annualRevenue =
    finances.revenuesByQuarter[1] + finances.revenuesByQuarter[2] +
    finances.revenuesByQuarter[3] + finances.revenuesByQuarter[4]
  const annualTaxes =
    finances.taxesByQuarter[1] + finances.taxesByQuarter[2] +
    finances.taxesByQuarter[3] + finances.taxesByQuarter[4]
  const annualMisc =
    finances.miscByQuarter[1] + finances.miscByQuarter[2] +
    finances.miscByQuarter[3] + finances.miscByQuarter[4]

  const currentQuarter = year === currentYear ? getCurrentQuarter() : null

  const giteMap = new Map(gites.map((g) => [g.id, g]))

  const handleStayClick = (stay: StayRow) => {
    if (stay.source === 'reservation' && stay.reservation) {
      setModal({
        type: 'reservation',
        reservationId: stay.id,
        giteId: stay.gite_id!,
        stay,
      })
    } else if (stay.source === 'annex' && stay.annexStay) {
      setModal({ type: 'annex-edit', annexStay: stay.annexStay })
    }
  }

  const handleAddAnnexStay = () => {
    setModal({ type: 'annex-create' })
  }

  const handleModalClose = () => setModal(null)
  const handleModalSuccess = () => {
    setModal(null)
    finances.refetch()
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setYear(year - 1)}
            disabled={year <= MIN_YEAR}
            aria-label={LABELS.previousYear}
          >
            &lt;
          </Button>
          <span className="font-heading text-[20px] font-semibold text-text min-w-[60px] text-center">
            {year}
          </span>
          <Button
            onClick={() => setYear(year + 1)}
            disabled={year >= maxYear}
            aria-label={LABELS.nextYear}
          >
            &gt;
          </Button>
        </div>
        {year !== currentYear && (
          <Button onClick={() => setYear(currentYear)}>
            {LABELS.currentYear}
          </Button>
        )}
      </div>

      {finances.error && (
        <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">
          {LABELS.errorLoadData}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <FinanceMetricCard label={LABELS.annualRevenue} value={formatEUR(annualRevenue)} />
        <FinanceMetricCard label={LABELS.annualTaxes} value={formatEUR(annualTaxes)} />
        <FinanceMetricCard
          label={LABELS.annualMisc}
          value={formatEUR(annualMisc)}
          negative={annualMisc < 0}
        />
        <FinanceMetricCard label={LABELS.reservationCount} value={String(finances.reservationCount)} />
      </div>

      {/* Quarterly table with accordion */}
      <FinanceTable
        revenuesByQuarter={finances.revenuesByQuarter}
        taxesByQuarter={finances.taxesByQuarter}
        miscByQuarter={finances.miscByQuarter}
        staysByQuarter={finances.staysByQuarter}
        miscEntriesByQuarter={finances.miscEntriesByQuarter}
        gites={gites}
        year={year}
        currentQuarter={currentQuarter}
        isLoading={finances.isLoading}
        onStayClick={handleStayClick}
        onAddAnnexStay={handleAddAnnexStay}
        onDataChanged={finances.refetch}
      />

      {/* Reservation modal */}
      {modal?.type === 'reservation' && modal.stay.reservation && (
        <ReservationModal
          mode="edit"
          reservation={modal.stay.reservation}
          giteId={modal.giteId}
          giteName={(() => {
            const g = giteMap.get(modal.giteId)
            return g ? `${g.name} (${g.capacity}p)` : ''
          })()}
          giteCapacity={giteMap.get(modal.giteId)?.capacity ?? 0}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Annex stay modal */}
      {modal?.type === 'annex-create' && (
        <AnnexStayModal
          mode="create"
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal?.type === 'annex-edit' && (
        <AnnexStayModal
          mode="edit"
          annexStay={modal.annexStay}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
