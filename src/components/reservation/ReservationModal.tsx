import { useState } from 'react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import ReservationForm from './ReservationForm'
import type { ReservationFormData } from '../../lib/reservationSchema'
import { persistReservation, removeReservation } from '../../lib/reservations'
import { deleteContract } from '../../lib/storage'
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

    const result = await persistReservation({
      mode,
      reservationId: reservation?.id,
      data,
      currentContractPath,
      pendingContractPath,
      pendingRemoval,
    })

    setSaving(false)

    if (result.pendingCleaned) setPendingContractPath(null)

    if (result.error) {
      setError(result.error)
      return
    }

    onSuccess()
    onClose()
  }

  const handleDelete = async () => {
    if (!reservation) return
    setDeleting(true)
    setError(null)

    const { error: deleteError } = await removeReservation({
      reservationId: reservation.id,
      currentContractPath,
      pendingContractPath,
    })

    setDeleting(false)

    if (deleteError) {
      setError(deleteError)
      setShowConfirm(false)
      return
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
