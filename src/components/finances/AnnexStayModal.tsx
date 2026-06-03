import { useState } from 'react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import AnnexStayForm from './AnnexStayForm'
import type { AnnexStayFormData } from './AnnexStayForm'
import { supabase } from '../../lib/supabase'
import { LABELS } from '../../constants/labels'
import type { AnnexStay } from '../../types/domain'

interface AnnexStayModalProps {
  mode: 'create' | 'edit'
  annexStay?: AnnexStay
  onClose: () => void
  onSuccess: () => void
}

export default function AnnexStayModal({
  mode,
  annexStay,
  onClose,
  onSuccess,
}: AnnexStayModalProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (data: AnnexStayFormData) => {
    setSaving(true)
    setError(null)

    const payload = {
      client_name: data.client_name,
      start_date: String(data.start_date),
      end_date: String(data.end_date),
      guest_count: data.guest_count ?? null,
      adult_count: data.adult_count ?? null,
      paid_amount: data.paid_amount,
      tax_amount: data.tax_amount ?? null,
      notes: data.notes,
    }

    const result =
      mode === 'create'
        ? await supabase.from('annex_stays').insert(payload)
        : await supabase.from('annex_stays').update(payload).eq('id', annexStay!.id)

    setSaving(false)

    if (result.error) {
      console.error('Annex stay save error:', result.error)
      setError(LABELS.errorSaveData)
      return
    }

    onSuccess()
    onClose()
  }

  const handleDelete = async () => {
    if (!annexStay) return
    setDeleting(true)
    setError(null)

    const { error: deleteError } = await supabase
      .from('annex_stays')
      .delete()
      .eq('id', annexStay.id)

    setDeleting(false)

    if (deleteError) {
      console.error('Annex stay delete error:', deleteError)
      setError(LABELS.errorSaveData)
      setShowConfirm(false)
      return
    }

    setShowConfirm(false)
    onSuccess()
    onClose()
  }

  return (
    <>
      <Modal open onClose={onClose}>
        <AnnexStayForm
          annexStay={annexStay}
          error={error}
          saving={saving}
          deleting={deleting}
          onSubmit={handleSubmit}
          onDelete={mode === 'edit' ? () => setShowConfirm(true) : undefined}
          onCancel={onClose}
        />
      </Modal>

      <ConfirmDialog
        open={showConfirm}
        message="Confirmer la suppression de l'opération annexe ?"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </>
  )
}
