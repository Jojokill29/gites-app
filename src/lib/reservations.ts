import { supabase } from './supabase'
import { deleteContract } from './storage'
import { LABELS } from '../constants/labels'
import type { ReservationFormData } from './reservationSchema'

/**
 * Write side of a reservation, shared by the desktop modal and the mobile
 * full-screen form. Keeping it here means the contract housekeeping (delete the
 * replaced file only once the row is saved, delete the orphan when the row
 * fails) exists in one place.
 *
 * Supabase never throws: every call checks `error` before going further.
 */

interface PersistArgs {
  mode: 'create' | 'edit'
  reservationId?: string
  data: ReservationFormData
  currentContractPath: string | null
  pendingContractPath: string | null
  pendingRemoval: boolean
}

export interface PersistResult {
  /** French message to display, or null when the save succeeded. */
  error: string | null
  /**
   * True when the freshly uploaded contract was deleted because the row failed
   * to save: the caller must forget its pending path.
   */
  pendingCleaned: boolean
}

export async function persistReservation({
  mode,
  reservationId,
  data,
  currentContractPath,
  pendingContractPath,
  pendingRemoval,
}: PersistArgs): Promise<PersistResult> {
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
    total_amount: data.total_amount ?? null,
    paid_amount: data.paid_amount,
    status: data.status,
    notes: data.notes,
    contract_path: finalContractPath,
  }

  const result =
    mode === 'create'
      ? await supabase.from('reservations').insert(payload)
      : await supabase.from('reservations').update(payload).eq('id', reservationId!)

  if (result.error) {
    console.error('Supabase error:', JSON.stringify(result.error, null, 2))
    console.error('Payload sent:', JSON.stringify(payload))

    // DB failed: clean up the freshly uploaded file to avoid orphans
    let pendingCleaned = false
    if (pendingContractPath) {
      await deleteContract(pendingContractPath)
      pendingCleaned = true
    }

    return {
      // 23P01 is the exclusion constraint: the dates overlap another stay
      error: result.error.code === '23P01' ? LABELS.errorDateConflict : LABELS.errorSaveData,
      pendingCleaned,
    }
  }

  // DB succeeded: clean up the old file from storage if replaced or removed
  if (currentContractPath && (pendingContractPath || pendingRemoval)) {
    await deleteContract(currentContractPath)
  }

  return { error: null, pendingCleaned: false }
}

interface RemoveArgs {
  reservationId: string
  currentContractPath: string | null
  pendingContractPath: string | null
}

/** Delete a reservation and its contract file (no storage cascade in Supabase). */
export async function removeReservation({
  reservationId,
  currentContractPath,
  pendingContractPath,
}: RemoveArgs): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)

  if (error) {
    console.error('Delete error:', error)
    return { error: LABELS.errorSaveData }
  }

  if (currentContractPath) await deleteContract(currentContractPath)
  if (pendingContractPath) await deleteContract(pendingContractPath)

  return { error: null }
}

/**
 * "Enregistrer le solde": the stay is fully paid, so paid_amount catches up
 * with total_amount. `remaining` stays a client-side computation everywhere.
 */
export async function markBalancePaid(
  reservationId: string,
  totalAmount: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reservations')
    .update({ paid_amount: totalAmount })
    .eq('id', reservationId)

  if (error) {
    console.error('Failed to save the balance:', error)
    return { error: LABELS.errorSaveData }
  }

  return { error: null }
}
