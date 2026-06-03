import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { supabase } from '../../lib/supabase'
import type { RevenueEntry, Quarter, GiteLabel } from '../../types/domain'

const GITE_OPTIONS: GiteLabel[] = ['Le Vallon', 'La Salmonière', 'Annexe']

const schema = z.object({
  gite_label: z.enum(['Le Vallon', 'La Salmonière', 'Annexe']),
  amount: z.number({ message: 'Obligatoire.' }).min(0, 'Doit être positif ou nul.'),
  entry_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = { gite_label: GiteLabel; amount: number; entry_date?: string; notes?: string }

interface Props {
  mode: 'create' | 'edit'
  entry?: RevenueEntry
  year: number
  quarter: Quarter
  onClose: () => void
  onSuccess: () => void
}

const inputClass =
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'

export default function RevenueEntryModal({ mode, entry, year, quarter, onClose, onSuccess }: Props) {
  const isEdit = mode === 'edit'
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: isEdit && entry
      ? { gite_label: entry.gite_label as GiteLabel, amount: Number(entry.amount), entry_date: entry.entry_date ?? '', notes: entry.notes ?? '' }
      : { gite_label: 'Le Vallon', amount: undefined as unknown as number, entry_date: '', notes: '' },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError(null)
    const payload = { gite_label: data.gite_label, amount: data.amount, entry_date: data.entry_date || null, notes: data.notes || null, year, quarter }
    const result = isEdit
      ? await supabase.from('revenue_entries').update(payload).eq('id', entry!.id)
      : await supabase.from('revenue_entries').insert(payload)
    setSaving(false)
    if (result.error) { console.error('Revenue entry save error:', result.error); setError(LABELS.errorSaveData); return }
    onSuccess(); onClose()
  }

  const handleDelete = async () => {
    if (!entry) return
    setDeleting(true)
    const { error: err } = await supabase.from('revenue_entries').delete().eq('id', entry.id)
    setDeleting(false)
    if (err) { console.error('Revenue entry delete error:', err); setError(LABELS.errorSaveData); setShowConfirm(false); return }
    setShowConfirm(false); onSuccess(); onClose()
  }

  const busy = saving || deleting

  return (
    <>
      <Modal open onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 className="font-semibold text-[18px] text-text mb-4 pr-8">
            {isEdit ? LABELS.editRevenueEntry : LABELS.newRevenueEntry}
          </h2>
          {error && <div className="mb-4 p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px]">{error}</div>}

          <div className="mb-3">
            <label className={labelClass}>{LABELS.giteField}</label>
            <select {...register('gite_label')} className={inputClass}>
              {GITE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className={labelClass}>{LABELS.amountField}</label>
            <input type="number" min="0" step="0.01" {...register('amount', { valueAsNumber: true })} className={inputClass} />
            {errors.amount && <p className="mt-1 text-[12px] text-status-red-text">{errors.amount.message}</p>}
          </div>

          <div className="mb-3">
            <label className={labelClass}>{LABELS.dateField}</label>
            <input type="text" placeholder="ex: 14 juillet" {...register('entry_date')} className={inputClass} />
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
