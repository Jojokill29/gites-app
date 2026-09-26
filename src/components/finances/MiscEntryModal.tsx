import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { supabase } from '../../lib/supabase'
import { deleteFinanceEntry } from '../../lib/finances'
import type { MiscEntry, Quarter } from '../../types/domain'

const schema = z.object({
  label: z.string().trim().min(1, 'Le libellé est obligatoire.').max(200),
  amount: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(',', '.') : v),
    z.coerce.number().refine((v) => v !== 0, 'Le montant ne peut pas être zéro.'),
  ),
  notes: z.string().optional().or(z.literal('')),
})

type FormData = { label: string; amount: number; notes?: string }

interface Props {
  mode: 'create' | 'edit'
  entry?: MiscEntry
  year: number
  quarter: Quarter
  onClose: () => void
  onSuccess: () => void
}

const inputClass =
  'w-full px-2.5 py-2 text-[14px] text-text bg-bg border border-border-input rounded-md placeholder:text-text-muted focus:outline-none focus:border-focus'
const labelClass = 'block text-[13px] text-text-secondary mb-1.5'

export default function MiscEntryModal({ mode, entry, year, quarter, onClose, onSuccess }: Props) {
  const isEdit = mode === 'edit'
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: isEdit && entry
      ? { label: entry.label, amount: Number(entry.amount), notes: entry.notes ?? '' }
      : { label: '', amount: undefined as unknown as number, notes: '' },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError(null)
    const payload = { label: data.label, amount: data.amount, notes: data.notes || null, year, quarter }
    const result = isEdit
      ? await supabase.from('misc_entries').update(payload).eq('id', entry!.id)
      : await supabase.from('misc_entries').insert(payload)
    setSaving(false)
    if (result.error) { console.error('Misc entry save error:', result.error); setError(LABELS.errorSaveData); return }
    onSuccess(); onClose()
  }

  const handleDelete = async () => {
    if (!entry) return
    setDeleting(true)
    const ok = await deleteFinanceEntry('misc_entries', entry.id)
    setDeleting(false)
    setShowConfirm(false)
    if (!ok) { setError(LABELS.errorSaveData); return }
    onSuccess(); onClose()
  }

  const busy = saving || deleting

  return (
    <>
      <Modal open onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 className="font-semibold text-[17px] text-text mb-4 pr-8">
            {isEdit ? LABELS.editMiscEntry : LABELS.newMiscEntry}
          </h2>
          {error && <div className="mb-4 px-2.5 py-2 rounded-md bg-alert-bg text-alert text-[13px]">{error}</div>}

          <div className="mb-3">
            <label className={labelClass}>{LABELS.labelField}</label>
            <input type="text" maxLength={200} {...register('label')} className={inputClass} />
            {errors.label && <p className="mt-1 text-[12px] text-status-red-text">{errors.label.message}</p>}
          </div>

          <div className="mb-3">
            <label className={labelClass}>{LABELS.amountField}</label>
            <input type="text" inputMode="decimal" {...register('amount')} className={inputClass} />
            {errors.amount && <p className="mt-1 text-[12px] text-status-red-text">{errors.amount.message}</p>}
          </div>

          <div className="mb-4">
            <label className={labelClass}>{LABELS.notes}</label>
            <textarea rows={2} {...register('notes')} className={`${inputClass} resize-y`} />
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-4 max-sm:flex-col-reverse max-sm:items-stretch">
            {isEdit && <Button type="button" variant="danger" onClick={() => setShowConfirm(true)} disabled={busy}>{LABELS.delete}</Button>}
            <div className="flex-1 max-sm:hidden" />
            <Button type="button" onClick={onClose} disabled={busy}>{LABELS.cancel}</Button>
            <Button type="submit" variant="primary" disabled={busy}>{saving ? 'Enregistrement...' : LABELS.save}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={showConfirm} message={LABELS.confirmDeleteEntry} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} loading={deleting} />
    </>
  )
}
