import type { Database } from './database'
import type { StatusKey } from '../constants/statuses'

// Shorthand types for table rows
export type Gite = Database['public']['Tables']['gites']['Row']
export type MiscEntry = Database['public']['Tables']['misc_entries']['Row']
export type RevenueEntry = Database['public']['Tables']['revenue_entries']['Row']
export type TaxStay = Database['public']['Tables']['tax_stays']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']

// Finance types
export type Quarter = 1 | 2 | 3 | 4
export type GiteLabel = 'Petit gite' | 'Grand gite' | 'Annexe'

// Narrow status from string to the 3 known values (SQL CHECK constraint guarantees this)
export type ReservationStatus = StatusKey

export type Reservation = Omit<
  Database['public']['Tables']['reservations']['Row'],
  'status'
> & {
  status: ReservationStatus
}
