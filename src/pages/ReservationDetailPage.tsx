import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, getMonth, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ContractPreviewModal from '../components/contracts/ContractPreviewModal'
import { useReservation } from '../hooks/useReservation'
import { markBalancePaid } from '../lib/reservations'
import { STATUSES } from '../constants/statuses'
import { LABELS } from '../constants/labels'
import { computeRemaining, formatEUR, formatEURorDash } from '../utils/money'
import { formatNights, formatWeekdayDayMonth } from '../utils/stayFormat'
import type { Gite } from '../types/domain'

interface ReservationDetailPageProps {
  gites: Gite[]
}

const M = LABELS.mobile

/** One step of the "Suivi" list: filled dot when done, outlined when pending. */
function TrackingRow({
  done,
  label,
  value,
  last,
}: {
  done: boolean
  label: string
  value?: string
  last?: boolean
}) {
  return (
    <div
      className={`h-12 flex items-center gap-3 border-t border-border ${
        last ? 'border-b' : ''
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={
          done
            ? { backgroundColor: STATUSES.deposit_paid.color }
            : { border: '1px solid var(--color-text-muted)' }
        }
      />
      <span className="flex-1 text-[14px] text-text">{label}</span>
      {value && (
        <span className="text-[14px] text-text tabular-nums">{value}</span>
      )}
    </div>
  )
}

/** 2d — detail of a stay. */
export default function ReservationDetailPage({
  gites,
}: ReservationDetailPageProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { reservation, loading, notFound, refetch } = useReservation(id)

  const [showConfirm, setShowConfirm] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [savingBalance, setSavingBalance] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <p className="p-4 text-[13px] text-text-muted">{LABELS.loading}</p>
  }

  if (notFound || !reservation) {
    return (
      <p className="p-4 text-[13px] text-text-muted">{M.reservationNotFound}</p>
    )
  }

  const status = STATUSES[reservation.status]
  // The total is optional: null until the price is known
  const total = reservation.total_amount === null ? null : Number(reservation.total_amount)
  const paid = Number(reservation.paid_amount)
  // Never stored: always recomputed from the two amounts, null without a total
  const remaining = computeRemaining(total, paid)

  const giteName = gites.find((g) => g.id === reservation.gite_id)?.name ?? ''
  const start = parseISO(reservation.start_date)
  const end = parseISO(reservation.end_date)
  const sameMonth = getMonth(start) === getMonth(end)
  const startLabel = sameMonth
    ? format(start, 'EEE d', { locale: fr })
    : formatWeekdayDayMonth(reservation.start_date)
  const stayLine = [
    giteName,
    `${startLabel} → ${formatWeekdayDayMonth(reservation.end_date)}`,
    formatNights(reservation.start_date, reservation.end_date),
  ]
    .filter(Boolean)
    .join(' · ')

  const handleSaveBalance = async () => {
    // The button is hidden without a total, so this is a safety net only
    if (total === null) return
    setSavingBalance(true)
    setError(null)
    const result = await markBalancePaid(reservation.id, total)
    setSavingBalance(false)
    setShowConfirm(false)
    if (result.error) {
      setError(result.error)
      return
    }
    refetch()
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Header */}
      <div className="flex-none h-[52px] bg-header border-b border-border flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[14px] text-text-secondary"
        >
          ‹ {M.back}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/reservations/${reservation.id}/edit`)}
          className="text-[14px] text-text-secondary"
        >
          {M.edit}
        </button>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-5">
        {/* Identity */}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {status.label}
          </span>
          <h1 className="font-heading text-[20px] font-semibold text-text m-0">
            {reservation.client_name}
          </h1>
          <p className="text-[14px] text-text-secondary m-0">{stayLine}</p>
        </div>

        {/* Guests and linen */}
        <div className="grid grid-cols-3 border-t border-b border-border">
          <div className="py-3 flex flex-col gap-0.5">
            <span className="text-[12px] text-text-tertiary">{M.guests}</span>
            <span className="text-[17px] font-semibold text-text tabular-nums">
              {reservation.guest_count ?? '—'}
            </span>
          </div>
          <div className="py-3 px-3 flex flex-col gap-0.5 border-l border-border">
            <span className="text-[12px] text-text-tertiary">{M.linenSingle}</span>
            <span className="text-[17px] font-semibold text-text tabular-nums">
              {reservation.linen_sets_single ?? '—'}
            </span>
          </div>
          <div className="py-3 px-3 flex flex-col gap-0.5 border-l border-border">
            <span className="text-[12px] text-text-tertiary">{M.linenDouble}</span>
            <span className="text-[17px] font-semibold text-text tabular-nums">
              {reservation.linen_sets_double ?? '—'}
            </span>
          </div>
        </div>

        {/* Tracking */}
        <div className="flex flex-col">
          <span className="text-[12px] text-text-tertiary pb-2">{M.tracking}</span>
          <TrackingRow
            done={reservation.contract_path !== null}
            label={M.trackingContract}
          />
          <TrackingRow
            done={reservation.status === 'deposit_paid'}
            label={M.trackingDeposit}
            value={formatEUR(paid)}
          />
          <TrackingRow
            done={remaining !== null && remaining <= 0}
            label={M.trackingBalance}
            value={
              remaining === null
                ? formatEURorDash(null)
                : remaining > 0
                  ? `${formatEUR(remaining)} ${M.remainingSuffix}`
                  : formatEUR(0)
            }
            last
          />
        </div>

        {/* Amounts */}
        <div className="flex flex-col gap-1.5 text-[13px] text-text-secondary">
          <div className="flex justify-between">
            <span>{M.total}</span>
            <span className="text-text tabular-nums">{formatEURorDash(total)}</span>
          </div>
          <div className="flex justify-between">
            <span>{M.paid}</span>
            <span className="text-text tabular-nums">{formatEUR(paid)}</span>
          </div>
          <div className="flex justify-between">
            <span>{LABELS.remainingAmount}</span>
            <span className="text-text font-semibold tabular-nums">
              {formatEURorDash(remaining)}
            </span>
          </div>
        </div>

        {reservation.contract_path && (
          <button
            type="button"
            onClick={() => setShowContract(true)}
            className="h-11 w-full rounded-md border border-border-hover bg-surface text-[14px] text-text"
          >
            {M.viewContract}
          </button>
        )}

        {error && <p className="text-[13px] text-status-red-text">{error}</p>}
      </div>

      {/* Balance action. Hidden once nothing is left to pay, or without a total. */}
      {remaining !== null && remaining > 0 && (
        <div
          className="flex-none px-4 pt-3 border-t border-border"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={savingBalance}
            className="h-11 w-full rounded-md bg-action text-action-text text-[14px] font-medium disabled:opacity-40"
          >
            {M.saveBalance}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        message={M.confirmSaveBalance}
        confirmLabel={M.confirmSaveBalanceAction}
        loadingLabel="Enregistrement..."
        destructive={false}
        onConfirm={handleSaveBalance}
        onCancel={() => setShowConfirm(false)}
        loading={savingBalance}
      />

      {showContract && reservation.contract_path && (
        <ContractPreviewModal
          path={reservation.contract_path}
          onClose={() => setShowContract(false)}
        />
      )}
    </div>
  )
}
