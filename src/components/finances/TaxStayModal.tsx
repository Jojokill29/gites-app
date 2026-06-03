import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { supabase } from '../../lib/supabase'
import type { TaxStay, Quarter, GiteLabel } from '../../types/domain'

const GITE_OPTIONS: GiteLabel[] = ['Petit gite', 'Grand gite', 'Annexe']

const schema = z.object({
  gite_label: z.enum(['Petit gite', 'Grand gite', 'Annexe']),
  stay_dates: z.string().optional().or(z.literal('')),
  nights_count: z.number({ message: 'Obligatoire.' }).int().positive('Doit être supérieur à 0.'),
  adult_count: z.number({ message: 'Obligatoire.' }).int().positive('Doit être supérieur à 0.'),
  amount: z.preprocess(
    (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
    z.coerce.number().nonnegative('Doit être positif ou nul.').optional(),
  ),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = {
  gite_label: GiteLabel
  stay_dates?: string
  nights_count: number
  adult_count: number
  amount?: number
  notes?: string
}

interface Props {
  mode: 'create' | 'edit'
  entry?: TaxStay
  year: number
  quarter: Quarter
  onClose: () => void
  onSuccess: () => void
}

const inputClass =
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'

export default function TaxStayModal({ mode, entry, year, quarter, onClose, onSuccess }: Props) {
  const isEdit = mode === 'edit'
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: isEdit && entry
      ? {
          gite_label: entry.gite_label as GiteLabel,
          stay_dates: entry.stay_dates ?? '',
          nights_count: entry.nights_count,
          adult_count: entry.adult_count,
          amount: entry.amount != null ? Number(entry.amount) : undefined,
          notes: entry.notes ?? '',
        }
      : { gite_label: 'Petit gite', stay_dates: '', nights_count: undefined as unknown as number, adult_count: undefined as unknown as number, amount: undefined, notes: '' },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError(null)
    const payload = {
      gite_label: data.gite_label,
      stay_dates: data.stay_dates || null,
      nights_count: data.nights_count,
      adult_count: data.adult_count,
      amount: data.amount ?? null,
      notes: data.notes || null,
      year,
      quarter,
    }
    const result = isEdit
      ? await supabase.from('tax_stays').update(payload).eq('id', entry!.id)
      : await supabase.from('tax_stays').insert(payload)
    setSaving(false)
    if (result.error) { console.error('Tax stay save error:', result.error); setError(LABELS.errorSaveData); return }
    onSuccess(); onClose()
  }

  const handleDelete = async () => {
    if (!entry) return
    setDeleting(true)
    const { error: err } = await supabase.from('tax_stays').delete().eq('id', entry.id)
    setDeleting(false)
    if (err) { console.error('Tax stay delete error:', err); setError(LABELS.errorSaveData); setShowConfirm(false); return }
    setShowConfirm(false); onSuccess(); onClose()
  }

  const busy = saving || deleting

  return (
    <>
      <Modal open onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 className="font-semibold text-[18px] text-text mb-4 pr-8">
            {isEdit ? LABELS.editTaxStay : LABELS.newTaxStay}
          </h2>
          {error && <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">{error}</div>}

          <div className="mb-3">
            <label className={labelClass}>{LABELS.giteField}</label>
            <select {...register('gite_label')} className={inputClass}>
              {GITE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className={labelClass}>{LABELS.datesField}</label>
            <input type="text" placeholder="ex: 14 au 21 juillet" {...register('stay_dates')} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelClass}>{LABELS.nightsField}</label>
              <input type="number" min="1" step="1" {...register('nights_count', { valueAsNumber: true })} className={inputClass} />
              {errors.nights_count && <p className="mt-1 text-[12px] text-status-red-text">{errors.nights_count.message}</p>}
            </div>
            <div>
              <label className={labelClass}>{LABELS.adultsField}</label>
              <input type="number" min="1" step="1" {...register('adult_count', { valueAsNumber: true })} className={inputClass} />
              {errors.adult_count && <p className="mt-1 text-[12px] text-status-red-text">{errors.adult_count.message}</p>}
            </div>
          </div>

          <div className="mb-3">
            <label className={labelClass}>{LABELS.amountField}</label>
            <input type="number" min="0" step="0.01" placeholder="optionnel" {...register('amount', { valueAsNumber: true })} className={inputClass} />
            {errors.amount && <p className="mt-1 text-[12px] text-status-red-text">{errors.amount.message}</p>}
          </div>

          <div className="mb-4">
            <label className={labelClass}>{LABELS.notes}</label>
            <textarea rows={2} {...register('notes')} className={`${inputClass} resize-y`} />
          </div>

          <div className="flex gap-2 max-sm:flex-col">
            <Button type="submit" disabled={busy} className="flex-1">{saving ? 'Enregistrement...' : LABELS.save}</Button>
            {isEdit && <Button type="button" variant="danger" onClick={() => setShowConfirm(true)} disabled={busy} className="flex-1">{LABELS.delete}</Button>}
            <Button type="button" onClick={onClose} disabled={busy} className="flex-1">{LABELS.cancel}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={showConfirm} message={LABELS.confirmDeleteEntry} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} loading={deleting} />
    </>
  )
}
