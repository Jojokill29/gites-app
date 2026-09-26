import { z } from 'zod'
import type { Reservation } from '../types/domain'

/**
 * Validation rules for a reservation, shared by the desktop modal form and the
 * mobile full-screen form. They live here so the business rules exist once.
 *
 * Numbers are declared with z.number() (not z.coerce) because inputs are
 * registered with { valueAsNumber: true }, so react-hook-form already delivers
 * numbers. Optional number fields go through z.preprocess because an empty
 * <input type="number"> reads as NaN, which z.number() rejects even when
 * .optional() is set.
 */
export const reservationSchema = z
  .object({
    gite_id: z.string().min(1, 'Le gîte est obligatoire.'),
    client_name: z.string().trim().min(1, 'Le nom du client est obligatoire.'),
    start_date: z.string().min(1, "La date d'arrivée est obligatoire."),
    end_date: z.string().min(1, 'La date de départ est obligatoire.'),
    guest_count: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().positive('Doit être supérieur à 0.').optional(),
    ),
    linen_sets_single: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().nonnegative('Doit être positif ou nul.').optional(),
    ),
    linen_sets_double: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().int().nonnegative('Doit être positif ou nul.').optional(),
    ),
    // Optional: a reservation can be created before the price is known.
    // Empty field -> undefined -> NULL in the database.
    total_amount: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? undefined : v),
      z.coerce.number().nonnegative('Doit être positif ou nul.').optional(),
    ),
    // Emptying the field means "nothing paid yet", not an error.
    paid_amount: z.preprocess(
      (v) => (v === '' || v === null || Number.isNaN(v) ? 0 : v),
      z.coerce.number().nonnegative('Doit être positif ou nul.'),
    ),
    status: z.enum(['pending_contract', 'pending_deposit', 'deposit_paid']),
    notes: z.string().nullable(),
  })
  .refine((d) => d.end_date > d.start_date, {
    message: "La date de départ doit être postérieure à la date d'arrivée.",
    path: ['end_date'],
  })
  // Only meaningful when a total was entered: without it there is nothing to exceed.
  .refine((d) => d.total_amount === undefined || d.paid_amount <= d.total_amount, {
    message: 'Le montant payé ne peut pas dépasser le montant total.',
    path: ['paid_amount'],
  })

// Explicit output type because z.preprocess types its input as unknown,
// which conflicts with zodResolver's generic constraint.
export type ReservationFormData = {
  gite_id: string
  client_name: string
  start_date: string
  end_date: string
  guest_count?: number
  linen_sets_single?: number
  linen_sets_double?: number
  total_amount?: number
  paid_amount: number
  status: 'pending_contract' | 'pending_deposit' | 'deposit_paid'
  notes: string | null
}

/** Default form values, identical for both form layouts. */
export function buildDefaultValues(
  reservation: Reservation | undefined,
  giteId: string,
  defaults?: { start_date?: string; end_date?: string },
): ReservationFormData {
  if (reservation) {
    return {
      gite_id: reservation.gite_id,
      client_name: reservation.client_name,
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      guest_count: reservation.guest_count ?? undefined,
      linen_sets_single: reservation.linen_sets_single ?? undefined,
      linen_sets_double: reservation.linen_sets_double ?? undefined,
      total_amount:
        reservation.total_amount === null ? undefined : Number(reservation.total_amount),
      paid_amount: Number(reservation.paid_amount),
      status: reservation.status,
      notes: reservation.notes,
    }
  }

  return {
    gite_id: giteId,
    client_name: '',
    start_date: defaults?.start_date ?? '',
    end_date: defaults?.end_date ?? '',
    guest_count: undefined,
    linen_sets_single: undefined,
    linen_sets_double: undefined,
    // Left empty on purpose: the field must start blank, not at 0
    total_amount: undefined,
    paid_amount: 0,
    status: 'pending_contract',
    notes: null,
  }
}
