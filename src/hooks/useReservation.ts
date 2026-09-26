import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reservation } from '../types/domain'

interface UseReservationReturn {
  reservation: Reservation | null
  loading: boolean
  /** True when the row does not exist (deleted, or a stale link). */
  notFound: boolean
  error: string | null
  refetch: () => void
}

/** Load a single reservation by id — used by the mobile detail and form screens. */
export function useReservation(id: string | undefined): UseReservationReturn {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setNotFound(true)
      return
    }

    setLoading(true)
    setError(null)
    setNotFound(false)

    supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error('Failed to fetch the reservation:', fetchError)
          setError(fetchError.message)
        } else if (!data) {
          setNotFound(true)
        } else {
          // SQL CHECK constraint guarantees status is one of the 3 known values
          setReservation(data as Reservation)
        }
        setLoading(false)
      })
  }, [id, fetchKey])

  return { reservation, loading, notFound, error, refetch }
}
