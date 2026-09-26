import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Stepper from './Stepper'
import Button from '../ui/Button'
import ContractField from '../contracts/ContractField'
import { LABELS } from '../../constants/labels'
import { STATUSES, type StatusKey } from '../../constants/statuses'
import {
  reservationSchema,
  buildDefaultValues,
  type ReservationFormData,
} from '../../lib/reservationSchema'
import { computeRemaining, formatEURorDash } from '../../utils/money'
import { nightsBetween } from '../../utils/stayFormat'
import type { Gite, Reservation } from '../../types/domain'

interface ReservationFormMobileProps {
  mode: 'create' | 'edit'
  gites: Gite[]
  giteId: string
  reservation?: Reservation
  defaults?: { start_date?: string; end_date?: string }
  error: string | null
  saving: boolean
  deleting: boolean
  contractCurrentPath: string | null
  contractPendingPath: string | null
  pendingRemoval: boolean
  onContractUploaded: (path: string) => void
  onContractRemoveRequested: () => void
  onSubmit: (data: ReservationFormData) => void
  onDelete?: () => void
  onCancel: () => void
}

// 44px touch targets and 16px text: below 16px iOS zooms in on focus
const fieldClass =
  'w-full h-11 min-w-0 px-3 text-[16px] text-text bg-bg border border-border-input rounded-md focus:outline-none focus:border-focus'
const labelClass = 'block text-[13px] text-text-secondary mb-1.5'
const errorMsgClass = 'mt-1 text-[12px] text-status-red-text'

/**
 * 2c — full-screen reservation form for phones. Same schema and same submit
 * handler as the desktop modal: only the layout differs.
 */
export default function ReservationFormMobile({
  mode,
  gites,
  giteId,
  reservation,
  defaults,
  error: serverError,
  saving,
  deleting,
  contractCurrentPath,
  contractPendingPath,
  pendingRemoval,
  onContractUploaded,
  onContractRemoveRequested,
  onSubmit,
  onDelete,
  onCancel,
}: ReservationFormMobileProps) {
  const isEdit = mode === 'edit'
  const busy = saving || deleting

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema) as Resolver<ReservationFormData>,
    defaultValues: buildDefaultValues(
      isEdit ? reservation : undefined,
      giteId,
      defaults,
    ),
  })

  const values = useWatch({ control })
  // null when no total is entered yet: the footer then shows a dash
  const remaining = computeRemaining(values.total_amount, values.paid_amount)

  const startDate = values.start_date ?? ''
  const endDate = values.end_date ?? ''
  const nights =
    startDate && endDate && endDate > startDate
      ? nightsBetween(startDate, endDate)
      : null

  // A counter at zero means "not filled in": the column is nullable in the
  // database and guest_count must stay strictly positive when it is set.
  const setCounter = (
    field: 'guest_count' | 'linen_sets_single' | 'linen_sets_double',
    next: number,
  ) => setValue(field, next === 0 ? undefined : next, { shouldValidate: true })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="h-[100dvh] flex flex-col bg-surface"
    >
      {/* Header */}
      <div className="flex-none h-[52px] grid grid-cols-[72px_minmax(0,1fr)_72px] items-center px-4 border-b border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-[14px] text-text-secondary text-left"
        >
          {LABELS.cancel}
        </button>
        <span className="text-[17px] font-semibold text-text text-center truncate">
          {isEdit ? LABELS.editReservationTitle : LABELS.newReservationTitle}
        </span>
        <span />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {serverError && (
          <div className="px-2.5 py-2 rounded-md bg-alert-bg text-alert text-[13px]">
            {serverError}
          </div>
        )}

        {/* Gite: segmented control */}
        <div>
          <span className={labelClass}>{LABELS.gite}</span>
          <div
            className="grid border border-border-hover rounded-md overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${gites.length || 1}, minmax(0, 1fr))`,
            }}
          >
            {gites.map((g) => {
              const active = values.gite_id === g.id
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setValue('gite_id', g.id, { shouldValidate: true })}
                  className={`h-11 min-w-0 px-1 flex items-center justify-center gap-1.5 text-[14px] ${
                    active
                      ? 'bg-action text-action-text font-medium'
                      : 'text-text-secondary'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  <span
                    className={`font-mono text-[11px] shrink-0 ${
                      active ? '' : 'text-text-muted'
                    }`}
                  >
                    {g.capacity}p
                  </span>
                </button>
              )
            })}
          </div>
          <input type="hidden" {...register('gite_id')} />
          {errors.gite_id && <p className={errorMsgClass}>{errors.gite_id.message}</p>}
        </div>

        {/* Client name */}
        <div>
          <label className={labelClass}>{LABELS.clientName}</label>
          <input type="text" {...register('client_name')} className={fieldClass} />
          {errors.client_name && (
            <p className={errorMsgClass}>{errors.client_name.message}</p>
          )}
        </div>

        {/* Dates side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label className={labelClass}>{LABELS.startDate}</label>
            <input type="date" {...register('start_date')} className={fieldClass} />
            {errors.start_date && (
              <p className={errorMsgClass}>{errors.start_date.message}</p>
            )}
          </div>
          <div className="min-w-0">
            <label className={labelClass}>
              {LABELS.endDate}
              {nights !== null && (
                <span className="font-mono text-[11px] text-text-muted">
                  {' '}
                  · {nights}{' '}
                  {nights > 1 ? LABELS.mobile.nights : LABELS.mobile.night}
                </span>
              )}
            </label>
            <input type="date" {...register('end_date')} className={fieldClass} />
            {errors.end_date && (
              <p className={errorMsgClass}>{errors.end_date.message}</p>
            )}
          </div>
        </div>

        {/* Counters */}
        <div className="border-t border-b border-border">
          <Stepper
            label={LABELS.mobile.guests}
            value={values.guest_count ?? 0}
            onChange={(v) => setCounter('guest_count', v)}
          />
          <Stepper
            label={LABELS.mobile.linenSingle}
            value={values.linen_sets_single ?? 0}
            onChange={(v) => setCounter('linen_sets_single', v)}
          />
          <Stepper
            label={LABELS.mobile.linenDouble}
            value={values.linen_sets_double ?? 0}
            onChange={(v) => setCounter('linen_sets_double', v)}
          />
        </div>

        {/* Amounts side by side */}
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label className={labelClass}>{LABELS.totalAmount}</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="optionnel"
              {...register('total_amount', { valueAsNumber: true })}
              className={`${fieldClass} tabular-nums`}
            />
            {errors.total_amount && (
              <p className={errorMsgClass}>{errors.total_amount.message}</p>
            )}
          </div>
          <div className="min-w-0">
            <label className={labelClass}>{LABELS.paidAmount}</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              {...register('paid_amount', { valueAsNumber: true })}
              className={`${fieldClass} tabular-nums`}
            />
            {errors.paid_amount && (
              <p className={errorMsgClass}>{errors.paid_amount.message}</p>
            )}
          </div>
        </div>

        {/* Status pills */}
        <div>
          <span className={labelClass}>{LABELS.status}</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(STATUSES) as [StatusKey, (typeof STATUSES)[StatusKey]][]).map(
              ([key, status]) => {
                const active = values.status === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setValue('status', key, { shouldValidate: true })}
                    className="h-10 px-2.5 rounded-md border flex items-center gap-2 text-[14px] text-text"
                    style={{
                      backgroundColor: active ? status.bg : 'transparent',
                      borderColor: active ? status.border : 'var(--color-border-hover)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </button>
                )
              },
            )}
          </div>
          <input type="hidden" {...register('status')} />
        </div>

        {/* Contract */}
        <div className="border-t border-border pt-3">
          {pendingRemoval ? (
            <div>
              <span className={labelClass}>{LABELS.contracts.fieldTitle}</span>
              <p className="text-[13px] text-text-secondary mb-2">
                {LABELS.contracts.removalPending}
              </p>
              <Button type="button" onClick={onContractRemoveRequested}>
                {LABELS.cancel}
              </Button>
            </div>
          ) : (
            <ContractField
              currentPath={contractCurrentPath}
              pendingPath={contractPendingPath}
              onUploaded={onContractUploaded}
              onRemoveRequested={onContractRemoveRequested}
            />
          )}
        </div>

        {/* Notes */}
        <div className="border-t border-border pt-3">
          <label className={labelClass}>{LABELS.notes}</label>
          <textarea
            rows={3}
            {...register('notes', {
              setValueAs: (v: string) => (v === '' ? null : v),
            })}
            className="w-full px-3 py-2 text-[16px] text-text bg-bg border border-border-input rounded-md resize-y focus:outline-none focus:border-focus"
          />
        </div>

        {isEdit && onDelete && (
          <div className="border-t border-border pt-3 pb-2">
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={busy}
              className="!h-11 w-full"
            >
              {deleting ? 'Suppression...' : LABELS.delete}
            </Button>
          </div>
        )}
      </div>

      {/* Fixed footer: the save button stays visible, keyboard open included */}
      <div
        className="flex-none px-4 pt-3 pb-3 border-t border-border bg-header flex flex-col gap-2.5"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-between text-[14px]">
          <span className="text-text-secondary">{LABELS.remainingAmount}</span>
          <span className="font-semibold text-text tabular-nums">
            {formatEURorDash(remaining)}
          </span>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-md bg-action text-action-text text-[14px] font-medium disabled:opacity-40"
        >
          {saving ? 'Enregistrement...' : LABELS.save}
        </button>
      </div>
    </form>
  )
}
