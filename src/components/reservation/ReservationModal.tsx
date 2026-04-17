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

    // Ensure dates are plain YYYY-MM-DD strings (not transformed by form/zod)
    const payload = {
      gite_id: data.gite_id,
      client_name: data.client_name,
      start_date: String(data.start_date),
      end_date: String(data.end_date),
      guest_count: data.guest_count ?? null,
      linen_sets_single: data.linen_sets_single ?? null,
      linen_sets_double: data.linen_sets_double ?? null,
      total_amount: data.total_amount,
      paid_amount: data.paid_amount,
      status: data.status,
      notes: data.notes,
    }

    console.log('Reservation payload:', JSON.stringify(payload))

    const result =
      mode === 'create'
        ? await supabase.from('reservations').insert(payload)
        : await supabase
            .from('reservations')
            .update(payload)
            .eq('id', reservation!.id)

    setSaving(false)

    if (result.error) {
      // Log full error with details (includes conflicting key ranges for 23P01)
      console.error('Supabase error:', JSON.stringify(result.error, null, 2))
      console.error('Payload sent:', JSON.stringify(payload))
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
