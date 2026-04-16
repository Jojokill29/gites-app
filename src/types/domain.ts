import type { Database } from './database'

// Shorthand types for table rows
export type Gite = Database['public']['Tables']['gites']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type TaxEntry = Database['public']['Tables']['tax_entries']['Row']
export type MiscEntry = Database['public']['Tables']['misc_entries']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']

// Reservation status enum
export type ReservationStatus = Reservation['status']
