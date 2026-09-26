import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ReservationFormMobile from '../components/reservation/ReservationFormMobile'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useReservation } from '../hooks/useReservation'
import { persistReservation, removeReservation } from '../lib/reservations'
import type { ReservationFormData } from '../lib/reservationSchema'
import { deleteContract } from '../lib/storage'
import { LABELS } from '../constants/labels'
import type { Gite } from '../types/domain'

interface ReservationFormPageProps {
  gites: Gite[]
  mode: 'create' | 'edit'
}

/**
 * 2c — hosts the full-screen mobile form. The save and delete calls go through
 * src/lib/reservations.ts, the same code the desktop modal uses.
 */
export default function ReservationFormPage({
  gites,
  mode,
}: ReservationFormPageProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const isEdit = mode === 'edit'
  const { reservation, loading, notFound } = useReservation(
    isEdit ? id : undefined,
  )

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingContractPath, setPendingContractPath] = useState<string | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState(false)

  const currentContractPath = reservation?.contract_path ?? null

  // Creation defaults come from the query string (gite of the current calendar)
  const giteId =
    reservation?.gite_id ??
    searchParams.get('gite') ??
    (gites.length > 0 ? gites[0].id : '')
  const defaults = {
    start_date: searchParams.get('start') ?? undefined,
    end_date: searchParams.get('end') ?? undefined,
  }

  const handleCancel = async () => {
    // Clean up the orphan if a file was uploaded during this session
    if (pendingContractPath) await deleteContract(pendingContractPath)
    navigate(-1)
  }

  const handleContractUploaded = (path: string) => {
    setPendingContractPath(path)
    setPendingRemoval(false)
  }

  const handleContractRemoveRequested = () => {
    if (pendingRemoval) {
      setPendingRemoval(false)
      return
    }
    if (pendingContractPath) {
      // Cancel the fresh upload, whether it replaced a contract or not
      deleteContract(pendingContractPath)
      setPendingContractPath(null)
      return
    }
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

    // After an edit, go back to the stay; after a creation, to the list
    if (isEdit && reservation) {
      navigate(`/reservations/${reservation.id}`, { replace: true })
    } else {
      navigate('/reservations', { replace: true })
    }
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
    setShowConfirm(false)

    if (deleteError) {
      setError(deleteError)
      return
    }

    navigate('/reservations', { replace: true })
  }

  if (isEdit && loading) {
    return (
      <p className="p-4 text-[13px] text-text-muted">{LABELS.loading}</p>
    )
  }

  if (isEdit && (notFound || !reservation)) {
    return (
      <p className="p-4 text-[13px] text-text-muted">
        {LABELS.mobile.reservationNotFound}
      </p>
    )
  }

  return (
    <>
      <ReservationFormMobile
        mode={mode}
        gites={gites}
        giteId={giteId}
        reservation={reservation ?? undefined}
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
        onDelete={isEdit ? () => setShowConfirm(true) : undefined}
        onCancel={handleCancel}
      />

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
