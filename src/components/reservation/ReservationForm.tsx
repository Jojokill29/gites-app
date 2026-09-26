import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '../ui/Button'
import ContractField from '../contracts/ContractField'
import { LABELS } from '../../constants/labels'
import { STATUSES } from '../../constants/statuses'
import {
  reservationSchema,
  buildDefaultValues,
  type ReservationFormData,
} from '../../lib/reservationSchema'
import type { Reservation } from '../../types/domain'

// --- Props ---

interface ReservationFormProps {
  mode: 'create' | 'edit'
  giteId: string
  giteName: string
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

// --- Helpers ---

const currencyFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

// Fields: dark background, 36px high, 4px radius, light border on focus
const fieldBase =
  'w-full px-2.5 text-[14px] text-text bg-bg border border-border-input rounded-md placeholder:text-text-muted focus:outline-none focus:border-focus'
const inputClass = `${fieldBase} h-9`
const amountInputClass = `${inputClass} tabular-nums`
const textareaClass = `${fieldBase} py-2 resize-y`
const labelClass = 'block text-[13px] text-text-secondary mb-1.5'
const errorMsgClass = 'mt-1 text-[12px] text-status-red-text'
// Rule between the sections of the form
const sectionClass = 'border-t border-border pt-4 mt-4'

// --- Component ---

export default function ReservationForm({
  mode,
  giteId,
  giteName,
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
}: ReservationFormProps) {
  const isEdit = mode === 'edit'
  const busy = saving || deleting

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema) as Resolver<ReservationFormData>,
    defaultValues: buildDefaultValues(
      isEdit ? reservation : undefined,
      giteId,
      defaults,
    ),
  })

  // Live "reste à payer" calculation
  const watchTotal = useWatch({ control, name: 'total_amount' })
  const watchPaid = useWatch({ control, name: 'paid_amount' })
  const remaining = (Number(watchTotal) || 0) - (Number(watchPaid) || 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Title */}
      <h2 className="font-semibold text-[17px] text-text mb-4 pr-8">
        {isEdit ? LABELS.editReservationTitle : LABELS.newReservationTitle}
      </h2>

      {/* Server error banner (overlap 23P01, capacity…) */}
      {serverError && (
        <div className="mb-4 px-2.5 py-2 rounded-md bg-alert-bg text-alert text-[13px]">
          {serverError}
        </div>
      )}

      {/* Hidden gite_id */}
      <input type="hidden" {...register('gite_id')} />

      {/* Gite (read-only) */}
      <div className="mb-3">
        <span className={labelClass}>{LABELS.gite}</span>
        <div className="h-9 flex items-center px-2.5 text-[14px] bg-surface border border-border rounded-md text-text-secondary">
          {giteName}
        </div>
      </div>

      {/* Client name */}
      <div className="mb-3">
        <label className={labelClass}>{LABELS.clientName}</label>
        <input type="text" {...register('client_name')} className={inputClass} />
        {errors.client_name && <p className={errorMsgClass}>{errors.client_name.message}</p>}
      </div>

      {/* Dates: side by side */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>{LABELS.startDate}</label>
          <input type="date" {...register('start_date')} className={inputClass} />
          {errors.start_date && <p className={errorMsgClass}>{errors.start_date.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{LABELS.endDate}</label>
          <input type="date" {...register('end_date')} className={inputClass} />
          {errors.end_date && <p className={errorMsgClass}>{errors.end_date.message}</p>}
        </div>
      </div>

      {/* Guest count */}
      <div className="mb-3">
        <label className={labelClass}>{LABELS.guestCount}</label>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="optionnel"
          {...register('guest_count', { valueAsNumber: true })}
          className={inputClass}
        />
        {errors.guest_count && <p className={errorMsgClass}>{errors.guest_count.message}</p>}
      </div>

      {/* Linen sets: single + double side by side on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row md:gap-4 gap-3 mb-3">
        <div className="flex-1">
          <label className={labelClass}>{LABELS.linenSetsSingle}</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="optionnel"
            {...register('linen_sets_single', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.linen_sets_single && <p className={errorMsgClass}>{errors.linen_sets_single.message}</p>}
        </div>
        <div className="flex-1">
          <label className={labelClass}>{LABELS.linenSetsDouble}</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="optionnel"
            {...register('linen_sets_double', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.linen_sets_double && <p className={errorMsgClass}>{errors.linen_sets_double.message}</p>}
        </div>
      </div>

      {/* Amounts */}
      <div className={sectionClass}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{LABELS.totalAmount}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('total_amount', { valueAsNumber: true })}
              className={amountInputClass}
            />
            {errors.total_amount && <p className={errorMsgClass}>{errors.total_amount.message}</p>}
          </div>
          <div>
            <label className={labelClass}>{LABELS.paidAmount}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('paid_amount', { valueAsNumber: true })}
              className={amountInputClass}
            />
            {errors.paid_amount && <p className={errorMsgClass}>{errors.paid_amount.message}</p>}
          </div>
        </div>

        {/* Remaining amount: a row on a rule, not a card */}
        <div className="flex justify-between items-center py-2.5 mt-3 mb-3 border-t border-border">
          <span className="text-[15px] font-semibold text-text">{LABELS.remainingAmount}</span>
          <span
            className={`text-[15px] font-semibold tabular-nums ${
              remaining > 0 ? 'text-status-red-text' : 'text-text'
            }`}
          >
            {currencyFmt.format(remaining)}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        <label className={labelClass}>{LABELS.status}</label>
        <select {...register('status')} className={inputClass}>
          {(Object.entries(STATUSES) as [string, { label: string }][]).map(
            ([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      {/* Notes */}
      <div className={sectionClass}>
        <label className={labelClass}>{LABELS.notes}</label>
        <textarea
          rows={3}
          {...register('notes', {
            setValueAs: (v: string) => (v === '' ? null : v),
          })}
          className={textareaClass}
        />
      </div>

      {/* Contract */}
      <div className="mt-3 mb-4">
        {pendingRemoval ? (
          <div>
            <span className={labelClass}>
              {LABELS.contracts.fieldTitle}
            </span>
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

      {/* Actions: destructive on the left, save on the right */}
      <div className="flex items-center gap-2 border-t border-border pt-4 max-sm:flex-col-reverse max-sm:items-stretch">
        {isEdit && onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} disabled={busy}>
            {deleting ? 'Suppression...' : LABELS.delete}
          </Button>
        )}
        <div className="flex-1 max-sm:hidden" />
        <Button type="button" onClick={onCancel} disabled={busy}>
          {LABELS.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {saving ? 'Enregistrement...' : LABELS.save}
        </Button>
      </div>
    </form>
  )
}
