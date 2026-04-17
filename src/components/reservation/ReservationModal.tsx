import { useState } from 'react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import ReservationForm from './ReservationForm'
import type { ReservationFormData } from './ReservationForm'
import { supabase } from '../../lib/supabase'
import { LABELS } from '../../constants/labels'
import type { Reservation } from '../../types/domain'

interface ReservationModalProps {
  mode: 'create' | 'edit'
  reservation?: Reservation
  giteId: string
  giteName: string
  defaults?: { start_date?: string; end_date?: string }
  onClose: () => void
  onSuccess: () => void
}

export default function ReservationModal({
  mode,
  reservation,
  giteId,
  giteName,
  defaults,
  onClose,
  onSuccess,
}: ReservationModalProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (data: ReservationFormData) => {
    setSaving(true)
    setError(null)

    const payload = {
      gite_id: data.gite_id,
      client_name: data.client_name,
      start_date: data.start_date,
      end_date: data.end_date,
      guest_count: data.guest_count,
      linen_sets: data.linen_sets,
      total_amount: data.total_amount,
      paid_amount: data.paid_amount,
      status: data.status,
      notes: data.notes,
    }

    const result =
      mode === 'create'
        ? await supabase.from('reservations').insert(payload)
        : await supabase
            .from('reservations')
            .update(payload)
            .eq('id', reservation!.id)

    setSaving(false)

    if (result.error) {
      console.error('Supabase error:', result.error)
      if (result.error.code === '23P01') {
        setError(LABELS.errorDateConflict)
      } else {
        setError(LABELS.errorSaveData)
      }
      return
    }

    onSuccess()
    onClose()
  }

  const handleDelete = async () => {
    if (!reservation) return
    setDeleting(true)
    setError(null)

    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation.id)

    setDeleting(false)

    if (deleteError) {
      console.error('Delete error:', deleteError)
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
        <ReservationForm
          mode={mode}
          giteId={giteId}
          giteName={giteName}
          reservation={reservation}
          defaults={defaults}
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
        message={LABELS.confirmDeleteReservation}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </>
  )
}
