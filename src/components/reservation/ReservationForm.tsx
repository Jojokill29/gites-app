import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
import ContractField from '../contracts/ContractField'
import { LABELS } from '../../constants/labels'
import { STATUSES } from '../../constants/statuses'
import type { Reservation } from '../../types/domain'

// --- Zod schema ---
// Using z.number() directly (not z.coerce) because we register inputs
// with { valueAsNumber: true } so react-hook-form delivers numbers.

const reservationSchema = z
  .object({
    gite_id: z.string(),
    client_name: z.string().trim().min(1, 'Le nom du client est obligatoire.'),
    start_date: z.string().min(1, "La date d'arrivée est obligatoire."),
    end_date: z.string().min(1, 'La date de départ est obligatoire.'),
    guest_count: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().positive('Doit être supérieur à 0.').optional(),
    ),
    linen_sets_single: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().nonnegative('Doit être positif ou nul.').optional(),
    ),
    linen_sets_double: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().nonnegative('Doit être positif ou nul.').optional(),
    ),
    adult_count: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().nonnegative('Doit être positif ou nul.').optional(),
    ),
    tax_amount: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().nonnegative('Doit être positif ou nul.').optional(),
    ),
    total_amount: z.number({ message: 'Obligatoire.' }).min(0, 'Doit être positif ou nul.'),
    paid_amount: z.number({ message: 'Obligatoire.' }).min(0, 'Doit être positif ou nul.'),
    status: z.enum(['pending_contract', 'pending_deposit', 'deposit_paid']),
    notes: z.string().nullable(),
  })
  .refine((d) => d.end_date > d.start_date, {
    message: "La date de départ doit être postérieure à la date d'arrivée.",
    path: ['end_date'],
  })
  .refine((d) => d.paid_amount <= d.total_amount, {
    message: 'Le montant payé ne peut pas dépasser le montant total.',
    path: ['paid_amount'],
  })

// Explicit output type because z.preprocess types its input as unknown,
// which conflicts with zodResolver's generic constraint.
export type ReservationFormData = {
  gite_id: string
  client_name: string
  start_date: string
  end_date: string
  guest_count?: number
  linen_sets_single?: number
  linen_sets_double?: number
  adult_count?: number
  tax_amount?: number
  total_amount: number
  paid_amount: number
  status: 'pending_contract' | 'pending_deposit' | 'deposit_paid'
  notes: string | null
}

// --- Props ---

interface ReservationFormProps {
  mode: 'create' | 'edit'
  giteId: string
  giteName: string
  giteCapacity: number
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

const inputClass =
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'
const errorMsgClass = 'mt-1 text-[12px] text-status-red-text'

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
  giteCapacity,
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
    setError,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema) as Resolver<ReservationFormData>,
    defaultValues: isEdit && reservation
      ? {
          gite_id: reservation.gite_id,
          client_name: reservation.client_name,
          start_date: reservation.start_date,
          end_date: reservation.end_date,
          guest_count: reservation.guest_count ?? undefined,
          linen_sets_single: reservation.linen_sets_single ?? undefined,
          linen_sets_double: reservation.linen_sets_double ?? undefined,
          adult_count: reservation.adult_count ?? undefined,
          tax_amount: reservation.tax_amount != null ? Number(reservation.tax_amount) : undefined,
          total_amount: Number(reservation.total_amount),
          paid_amount: Number(reservation.paid_amount),
          status: reservation.status as ReservationFormData['status'],
          notes: reservation.notes,
        }
      : {
          gite_id: giteId,
          client_name: '',
          start_date: defaults?.start_date ?? '',
          end_date: defaults?.end_date ?? '',
          guest_count: undefined,
          linen_sets_single: undefined,
          linen_sets_double: undefined,
          adult_count: undefined,
          tax_amount: undefined,
          total_amount: undefined as unknown as number,
          paid_amount: 0,
          status: 'pending_contract' as const,
          notes: null,
        },
  })

  // Cross-field validation before submitting to parent
  const handleValidatedSubmit = (data: ReservationFormData) => {
    if (data.guest_count != null && data.guest_count > giteCapacity) {
      setError('guest_count', {
        message: `${LABELS.errorGuestCountExceedsCapacity} (${giteCapacity} max).`,
      })
      return
    }
    if (data.adult_count != null && data.guest_count != null && data.adult_count > data.guest_count) {
      setError('adult_count', { message: LABELS.errorAdultCountExceedsGuests })
      return
    }
    onSubmit(data)
  }

  // Live "reste à payer" calculation
  const watchTotal = useWatch({ control, name: 'total_amount' })
  const watchPaid = useWatch({ control, name: 'paid_amount' })
  const remaining = (Number(watchTotal) || 0) - (Number(watchPaid) || 0)

  return (
    <form onSubmit={handleSubmit(handleValidatedSubmit)} noValidate>
      {/* Title */}
      <h2 className="font-semibold text-[18px] text-text mb-4 pr-8">
        {isEdit ? LABELS.editReservationTitle : LABELS.newReservationTitle}
      </h2>

      {/* Server error banner */}
      {serverError && (
        <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">
          {serverError}
        </div>
      )}

      {/* Hidden gite_id */}
      <input type="hidden" {...register('gite_id')} />

      {/* Gite (read-only) */}
      <div className="mb-3">
        <span className={labelClass}>{LABELS.gite}</span>
        <div className="px-3 py-2 text-[14px] bg-surface-alt rounded-[10px] text-text-secondary">
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
        <p className="mt-0.5 text-[11px] text-text-secondary">
          {LABELS.giteCapacityHint} {giteCapacity}
        </p>
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

      {/* Adult count + Tax amount */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>{LABELS.adultCount}</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="optionnel"
            {...register('adult_count', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.adult_count && <p className={errorMsgClass}>{errors.adult_count.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{LABELS.taxAmount}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="optionnel"
            {...register('tax_amount', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.tax_amount && <p className={errorMsgClass}>{errors.tax_amount.message}</p>}
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>{LABELS.totalAmount}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            {...register('total_amount', { valueAsNumber: true })}
            className={inputClass}
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
            className={inputClass}
          />
          {errors.paid_amount && <p className={errorMsgClass}>{errors.paid_amount.message}</p>}
        </div>
      </div>

      {/* Remaining amount */}
      <div className="flex justify-between items-center py-2 px-3 mb-3 rounded-[10px] bg-surface-alt">
        <span className="text-[13px] text-text-secondary">{LABELS.remainingAmount}</span>
        <span
          className={`text-[14px] font-medium ${
            remaining > 0 ? 'text-status-red' : 'text-text'
          }`}
        >
          {currencyFmt.format(remaining)}
        </span>
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
      <div className="mb-4">
        <label className={labelClass}>{LABELS.notes}</label>
        <textarea
          rows={3}
          {...register('notes', {
            setValueAs: (v: string) => (v === '' ? null : v),
          })}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Contract */}
      <div className="mb-4">
        {pendingRemoval ? (
          <div>
            <span className="block text-[12px] font-medium text-text-secondary mb-1">
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

      {/* Actions */}
      <div className="flex gap-2 max-sm:flex-col">
        <Button type="submit" disabled={busy} className="flex-1">
          {saving ? 'Enregistrement...' : LABELS.save}
        </Button>
        {isEdit && onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} disabled={busy} className="flex-1">
            {deleting ? 'Suppression...' : LABELS.delete}
          </Button>
        )}
        <Button type="button" onClick={onCancel} disabled={busy} className="flex-1">
          {LABELS.cancel}
        </Button>
      </div>
    </form>
  )
}
