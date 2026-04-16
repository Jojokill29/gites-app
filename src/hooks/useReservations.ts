import { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { getMonthFetchRange } from '../utils/calendar'
import type { Reservation } from '../types/domain'

interface UseReservationsReturn {
  reservations: Reservation[]
  loading: boolean
  error: string | null
}

export function useReservations(
  giteId: string | undefined,
  year: number,
  month: number,
): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!giteId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Fetch range covers the full grid (including padding days from adjacent months)
    const range = getMonthFetchRange(year, month)
    // end_date > range.start means reservation is still active after grid starts
    // start_date < day after range.end means reservation starts before grid ends
    const dayAfterEnd = format(addDays(new Date(range.end), 1), 'yyyy-MM-dd')

    supabase
      .from('reservations')
      .select('*')
      .eq('gite_id', giteId)
      .gt('end_date', range.start)
      .lt('start_date', dayAfterEnd)
      .order('start_date')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error('Failed to fetch reservations:', fetchError)
          setError(fetchError.message)
        } else {
          setReservations(data ?? [])
        }
        setLoading(false)
      })
  }, [giteId, year, month])

  return { reservations, loading, error }
}
