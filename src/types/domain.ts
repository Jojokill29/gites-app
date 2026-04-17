import type { Database } from './database'
import type { StatusKey } from '../constants/statuses'

// Shorthand types for table rows
export type Gite = Database['public']['Tables']['gites']['Row']
export type TaxEntry = Database['public']['Tables']['tax_entries']['Row']
export type MiscEntry = Database['public']['Tables']['misc_entries']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']

// Narrow status from string to the 3 known values (SQL CHECK constraint guarantees this)
export type ReservationStatus = StatusKey

export type Reservation = Omit<
  Database['public']['Tables']['reservations']['Row'],
  'status'
> & {
  status: ReservationStatus
}
