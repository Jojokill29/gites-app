import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
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
    guest_count: z.number().int().positive('Doit être supérieur à 0.').nullable().optional(),
    linen_sets_single: z.number().int().min(0, 'Doit être positif ou nul.').nullable().optional(),
    linen_sets_double: z.number().int().min(0, 'Doit être positif ou nul.').nullable().optional(),
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

export type ReservationFormData = z.infer<typeof reservationSchema>

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
    resolver: zodResolver(reservationSchema),
    defaultValues: isEdit && reservation
      ? {
          gite_id: reservation.gite_id,
          client_name: reservation.client_name,
          start_date: reservation.start_date,
          end_date: reservation.end_date,
          guest_count: reservation.guest_count,
          linen_sets_single: reservation.linen_sets_single,
          linen_sets_double: reservation.linen_sets_double,
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
          guest_count: null,
          linen_sets_single: null,
          linen_sets_double: null,
          total_amount: undefined as unknown as number,
          paid_amount: 0,
          status: 'pending_contract' as const,
          notes: null,
        },
  })

  // Live "reste à payer" calculation
  const watchTotal = useWatch({ control, name: 'total_amount' })
  const watchPaid = useWatch({ control, name: 'paid_amount' })
  const remaining = (Number(watchTotal) || 0) - (Number(watchPaid) || 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          {...register('guest_count', {
            setValueAs: (v: string) => (v === '' ? null : parseInt(v, 10)),
          })}
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
            {...register('linen_sets_single', {
              setValueAs: (v: string) => (v === '' ? null : parseInt(v, 10)),
            })}
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
            {...register('linen_sets_double', {
              setValueAs: (v: string) => (v === '' ? null : parseInt(v, 10)),
            })}
            className={inputClass}
          />
          {errors.linen_sets_double && <p className={errorMsgClass}>{errors.linen_sets_double.message}</p>}
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
