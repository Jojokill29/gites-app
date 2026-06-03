import { useState } from 'react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import ReservationForm from './ReservationForm'
import type { ReservationFormData } from './ReservationForm'
import { supabase } from '../../lib/supabase'
import { deleteContract } from '../../lib/storage'
import { LABELS } from '../../constants/labels'
import type { Reservation } from '../../types/domain'

interface ReservationModalProps {
  mode: 'create' | 'edit'
  reservation?: Reservation
  giteId: string
  giteName: string
  giteCapacity?: number
  defaults?: { start_date?: string; end_date?: string }
  onClose: () => void
  onSuccess: () => void
}

export default function ReservationModal({
  mode,
  reservation,
  giteId,
  giteName,
  giteCapacity = 0,
  defaults,
  onClose,
  onSuccess,
}: ReservationModalProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Contract state
  const [pendingContractPath, setPendingContractPath] = useState<string | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState(false)

  const currentContractPath = reservation?.contract_path ?? null

  const handleClose = async () => {
    // Clean up orphan if a file was uploaded during this session
    if (pendingContractPath) {
      await deleteContract(pendingContractPath)
    }
    onClose()
  }

  const handleContractUploaded = (path: string) => {
    setPendingContractPath(path)
    setPendingRemoval(false)
  }

  const handleContractRemoveRequested = () => {
    if (pendingRemoval) {
      // Cancel removal
      setPendingRemoval(false)
      return
    }
    if (pendingContractPath && currentContractPath) {
      // Cancel replacement: clean up the pending upload
      deleteContract(pendingContractPath)
      setPendingContractPath(null)
      return
    }
    if (pendingContractPath && !currentContractPath) {
      // Remove freshly uploaded contract (creation mode)
      deleteContract(pendingContractPath)
      setPendingContractPath(null)
      return
    }
    // Request removal of existing contract
    setPendingRemoval(true)
  }

  const handleSubmit = async (data: ReservationFormData) => {
    setSaving(true)
    setError(null)

    // Determine final contract_path
    let finalContractPath: string | null
    if (pendingContractPath) {
      finalContractPath = pendingContractPath
    } else if (pendingRemoval) {
      finalContractPath = null
    } else {
      finalContractPath = currentContractPath
    }

    const payload = {
      gite_id: data.gite_id,
      client_name: data.client_name,
      start_date: String(data.start_date),
      end_date: String(data.end_date),
      guest_count: data.guest_count ?? null,
      linen_sets_single: data.linen_sets_single ?? null,
      linen_sets_double: data.linen_sets_double ?? null,
      adult_count: data.adult_count ?? null,
      tax_amount: data.tax_amount ?? null,
      total_amount: data.total_amount,
      paid_amount: data.paid_amount,
      status: data.status,
      notes: data.notes,
      contract_path: finalContractPath,
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
      console.error('Supabase error:', JSON.stringify(result.error, null, 2))
      console.error('Payload sent:', JSON.stringify(payload))

      // DB failed: clean up the freshly uploaded file to avoid orphans
      if (pendingContractPath) {
        await deleteContract(pendingContractPath)
        setPendingContractPath(null)
      }

      if (result.error.code === '23P01') {
        setError(LABELS.errorDateConflict)
      } else {
        setError(LABELS.errorSaveData)
      }
      return
    }

    // DB succeeded: clean up old file from storage if replaced or removed
    const oldPath = currentContractPath
    if (oldPath && (pendingContractPath || pendingRemoval)) {
      await deleteContract(oldPath)
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

    // DB delete succeeded: clean up contract file from storage
    if (currentContractPath) {
      await deleteContract(currentContractPath)
    }
    if (pendingContractPath) {
      await deleteContract(pendingContractPath)
    }

    setShowConfirm(false)
    onSuccess()
    onClose()
  }

  return (
    <>
      <Modal open onClose={handleClose}>
        <ReservationForm
          mode={mode}
          giteId={giteId}
          giteName={giteName}
          giteCapacity={giteCapacity}
          reservation={reservation}
          defaults={defaults}
          error={error}
          saving={saving}
          deleting={deleting}
          contractCurrentPath={pendingRemoval ? null : currentContractPath}
          contractPendingPath={pendingContractPath}
          pendingRemoval={pendingRemoval}
          onContractUploaded={handleContractUploaded}
          onContractRemoveRequested={handleContractRemoveRequested}
          onSubmit={handleSubmit}
          onDelete={mode === 'edit' ? () => setShowConfirm(true) : undefined}
          onCancel={handleClose}
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
