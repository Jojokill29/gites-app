import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Reservation } from '../types/domain'

interface UseUpcomingReservationsReturn {
  reservations: Reservation[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Every stay that is not over yet, all gites, oldest arrival first.
 * Feeds the mobile "Réservations" screen; the filters on that screen work on
 * this single result rather than issuing one query per filter.
 */
export function useUpcomingReservations(): UseUpcomingReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    const todayStr = format(new Date(), 'yyyy-MM-dd')

    supabase
      .from('reservations')
      .select('*')
      .gte('end_date', todayStr)
      .order('start_date')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error('Failed to fetch upcoming reservations:', fetchError)
          setError(fetchError.message)
        } else {
          // SQL CHECK constraint guarantees status is one of the 3 known values
          setReservations((data ?? []) as Reservation[])
        }
        setLoading(false)
      })
  }, [fetchKey])

  return { reservations, loading, error, refetch }
}
