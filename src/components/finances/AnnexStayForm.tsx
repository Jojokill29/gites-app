import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import type { AnnexStay } from '../../types/domain'

const annexStaySchema = z
  .object({
    client_name: z.string().trim().min(1, 'Le nom du client est obligatoire.'),
    start_date: z.string().min(1, "La date d'arrivée est obligatoire."),
    end_date: z.string().min(1, 'La date de départ est obligatoire.'),
    guest_count: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().positive('Doit être supérieur à 0.').optional(),
    ),
    adult_count: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().nonnegative('Doit être positif ou nul.').optional(),
    ),
    paid_amount: z.number({ message: 'Obligatoire.' }).min(0, 'Doit être positif ou nul.'),
    tax_amount: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().nonnegative('Doit être positif ou nul.').optional(),
    ),
    notes: z.string().nullable(),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: "La date de départ doit être postérieure ou égale à la date d'arrivée.",
    path: ['end_date'],
  })

export type AnnexStayFormData = {
  client_name: string
  start_date: string
  end_date: string
  guest_count?: number
  adult_count?: number
  paid_amount: number
  tax_amount?: number
  notes: string | null
}

interface AnnexStayFormProps {
  annexStay?: AnnexStay
  error: string | null
  saving: boolean
  deleting: boolean
  onSubmit: (data: AnnexStayFormData) => void
  onDelete?: () => void
  onCancel: () => void
}

const inputClass =
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'
const errorMsgClass = 'mt-1 text-[12px] text-status-red-text'

export default function AnnexStayForm({
  annexStay,
  error: serverError,
  saving,
  deleting,
  onSubmit,
  onDelete,
  onCancel,
}: AnnexStayFormProps) {
  const isEdit = !!annexStay
  const busy = saving || deleting

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnexStayFormData>({
    resolver: zodResolver(annexStaySchema) as Resolver<AnnexStayFormData>,
    defaultValues: isEdit && annexStay
      ? {
          client_name: annexStay.client_name,
          start_date: annexStay.start_date,
          end_date: annexStay.end_date,
          guest_count: annexStay.guest_count ?? undefined,
          adult_count: annexStay.adult_count ?? undefined,
          paid_amount: Number(annexStay.paid_amount),
          tax_amount: annexStay.tax_amount != null ? Number(annexStay.tax_amount) : undefined,
          notes: annexStay.notes,
        }
      : {
          client_name: '',
          start_date: '',
          end_date: '',
          guest_count: undefined,
          adult_count: undefined,
          paid_amount: 0,
          tax_amount: undefined,
          notes: null,
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="font-semibold text-[18px] text-text mb-4 pr-8">
        {isEdit ? 'Modifier l\'opération annexe' : 'Nouvelle opération annexe'}
      </h2>

      {serverError && (
        <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">
          {serverError}
        </div>
      )}

      <div className="mb-3">
        <label className={labelClass}>{LABELS.clientName}</label>
        <input type="text" {...register('client_name')} className={inputClass} />
        {errors.client_name && <p className={errorMsgClass}>{errors.client_name.message}</p>}
      </div>

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

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>{LABELS.guestCount}</label>
          <input
            type="number" min="1" step="1" placeholder="optionnel"
            {...register('guest_count', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.guest_count && <p className={errorMsgClass}>{errors.guest_count.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{LABELS.adultCount}</label>
          <input
            type="number" min="0" step="1" placeholder="optionnel"
            {...register('adult_count', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.adult_count && <p className={errorMsgClass}>{errors.adult_count.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>{LABELS.paidAmount}</label>
          <input
            type="number" min="0" step="0.01"
            {...register('paid_amount', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.paid_amount && <p className={errorMsgClass}>{errors.paid_amount.message}</p>}
        </div>
        <div>
          <label className={labelClass}>{LABELS.taxAmount}</label>
          <input
            type="number" min="0" step="0.01" placeholder="optionnel"
            {...register('tax_amount', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.tax_amount && <p className={errorMsgClass}>{errors.tax_amount.message}</p>}
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>{LABELS.notes}</label>
        <textarea
          rows={2}
          {...register('notes', { setValueAs: (v: string) => (v === '' ? null : v) })}
          className={`${inputClass} resize-y`}
        />
      </div>

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
