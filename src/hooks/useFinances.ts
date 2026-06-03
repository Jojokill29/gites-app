import { useCallback, useEffect, useState } from 'react'
import { parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Reservation, MiscEntry, Quarter } from '../types/domain'

type QuarterMap<T> = Record<Quarter, T>

function emptyQuarterMap<T>(init: T): QuarterMap<T> {
  return { 1: init, 2: init, 3: init, 4: init }
}

function emptyQuarterArrays<T>(): QuarterMap<T[]> {
  return { 1: [], 2: [], 3: [], 4: [] }
}

/** Derive quarter (1-4) from an ISO date string using parseISO */
function quarterFromDate(dateStr: string): Quarter {
  const month = parseISO(dateStr).getMonth() // 0-11
  return (Math.floor(month / 3) + 1) as Quarter
}

export interface UseFinancesReturn {
  revenuesByQuarter: QuarterMap<number>
  taxesByQuarter: QuarterMap<number>
  miscByQuarter: QuarterMap<number>
  reservationCount: number
  reservationsByQuarter: QuarterMap<Reservation[]>
  miscEntriesByQuarter: QuarterMap<MiscEntry[]>
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useFinances(year: number): UseFinancesReturn {
  const [revenuesByQuarter, setRevenuesByQuarter] = useState<QuarterMap<number>>(emptyQuarterMap(0))
  const [taxesByQuarter, setTaxesByQuarter] = useState<QuarterMap<number>>(emptyQuarterMap(0))
  const [miscByQuarter, setMiscByQuarter] = useState<QuarterMap<number>>(emptyQuarterMap(0))
  const [reservationCount, setReservationCount] = useState(0)
  const [reservationsByQuarter, setReservationsByQuarter] = useState<QuarterMap<Reservation[]>>(emptyQuarterArrays)
  const [miscEntriesByQuarter, setMiscEntriesByQuarter] = useState<QuarterMap<MiscEntry[]>>(emptyQuarterArrays)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`

    Promise.all([
      // Reservations for the year (all fields)
      supabase
        .from('reservations')
        .select('*')
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .order('start_date'),
      // Misc entries for the year
      supabase
        .from('misc_entries')
        .select('*')
        .eq('year', year)
        .order('created_at'),
    ]).then(([resResult, miscResult]) => {
      const firstError = resResult.error ?? miscResult.error
      if (firstError) {
        console.error('Finance fetch error:', firstError)
        setError(firstError.message)
        setIsLoading(false)
        return
      }

      // Process reservations
      const reservations = (resResult.data ?? []) as Reservation[]
      const revMap = emptyQuarterMap(0)
      const taxMap = emptyQuarterMap(0)
      const resByQ = emptyQuarterArrays<Reservation>()
      for (const r of reservations) {
        const q = quarterFromDate(r.start_date)
        revMap[q] += Number(r.paid_amount)
        taxMap[q] += Number(r.tax_amount ?? 0)
        resByQ[q].push(r)
      }
      setRevenuesByQuarter(revMap)
      setTaxesByQuarter(taxMap)
      setReservationsByQuarter(resByQ)
      setReservationCount(reservations.length)

      // Process misc entries
      const miscs = (miscResult.data ?? []) as MiscEntry[]
      const miscMap = emptyQuarterMap(0)
      const miscEntries = emptyQuarterArrays<MiscEntry>()
      for (const m of miscs) {
        const q = m.quarter as Quarter
        miscMap[q] += Number(m.amount)
        miscEntries[q].push(m)
      }
      setMiscByQuarter(miscMap)
      setMiscEntriesByQuarter(miscEntries)

      setIsLoading(false)
    })
  }, [year, fetchKey])

  return {
    revenuesByQuarter,
    taxesByQuarter,
    miscByQuarter,
    reservationCount,
    reservationsByQuarter,
    miscEntriesByQuarter,
    isLoading,
    error,
    refetch,
  }
}
