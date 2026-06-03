import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../ui/Button'
import { LABELS } from '../../constants/labels'
import { supabase } from '../../lib/supabase'
import type { TaxEntry, Quarter } from '../../types/domain'

const taxEntrySchema = z.object({
  amount: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(',', '.') : v),
    z.coerce.number().positive('Le montant doit être positif.'),
  ),
  notes: z.string().max(500).optional().or(z.literal('')),
})

type TaxEntryFormData = {
  amount: number
  notes?: string | undefined
}

interface TaxEntryFormProps {
  year: number
  quarter: Quarter
  entry?: TaxEntry
  onSaved: (entry: TaxEntry, isNew: boolean) => void
  onCancel: () => void
}

const inputClass =
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'

export default function TaxEntryForm({
  year,
  quarter,
  entry,
  onSaved,
  onCancel,
}: TaxEntryFormProps) {
  const isEdit = !!entry
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaxEntryFormData>({
    resolver: zodResolver(taxEntrySchema) as Resolver<TaxEntryFormData>,
    defaultValues: isEdit
      ? { amount: Number(entry.amount), notes: entry.notes ?? '' }
      : { amount: undefined as unknown as number, notes: '' },
  })

  const onSubmit = async (data: TaxEntryFormData) => {
    setSaving(true)
    setError(null)

    const payload = {
      amount: data.amount,
      notes: data.notes || null,
      year,
      quarter,
    }

    if (isEdit) {
      const { data: updated, error: updateError } = await supabase
        .from('tax_entries')
        .update(payload)
        .eq('id', entry.id)
        .select()
        .single()

      setSaving(false)
      if (updateError) {
        console.error('Tax entry update error:', updateError)
        setError(LABELS.errorSaveData)
        return
      }
      onSaved(updated as TaxEntry, false)
    } else {
      const { data: created, error: createError } = await supabase
        .from('tax_entries')
        .insert(payload)
        .select()
        .single()

      setSaving(false)
      if (createError) {
        console.error('Tax entry create error:', createError)
        setError(LABELS.errorSaveData)
        return
      }
      onSaved(created as TaxEntry, true)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-3 rounded-[10px] border border-border bg-surface mb-2">
      {error && (
        <div className="mb-3 p-2 rounded-[8px] bg-status-red-bg text-status-red-text text-[12px]">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className={labelClass}>{LABELS.amountField}</label>
        <input
          type="text"
          inputMode="decimal"
          {...register('amount')}
          className={inputClass}
        />
        {errors.amount && (
          <p className="mt-1 text-[12px] text-status-red-text">{errors.amount.message}</p>
        )}
      </div>

      <div className="mb-3">
        <label className={labelClass}>{LABELS.notes}</label>
        <textarea
          rows={2}
          maxLength={500}
          {...register('notes')}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Enregistrement...' : LABELS.save}
        </Button>
        <Button type="button" onClick={onCancel} disabled={saving}>
          {LABELS.cancel}
        </Button>
      </div>
    </form>
  )
}
