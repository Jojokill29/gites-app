import { useCallback, useEffect, useState } from 'react'
import { parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Reservation, AnnexStay, MiscEntry, Quarter } from '../types/domain'

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

/** Unified stay row for the StaysTable (reservation or annex operation) */
export type StayRow = {
  id: string
  source: 'reservation' | 'annex'
  client_name: string
  start_date: string
  end_date: string
  gite_id: string | null // null for annex stays
  adult_count: number | null
  paid_amount: number
  tax_amount: number | null
  reservation?: Reservation
  annexStay?: AnnexStay
}

export interface UseFinancesReturn {
  revenuesByQuarter: QuarterMap<number>
  taxesByQuarter: QuarterMap<number>
  miscByQuarter: QuarterMap<number>
  reservationCount: number
  staysByQuarter: QuarterMap<StayRow[]>
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
  const [staysByQuarter, setStaysByQuarter] = useState<QuarterMap<StayRow[]>>(emptyQuarterArrays)
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
      supabase
        .from('reservations')
        .select('*')
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .order('start_date'),
      supabase
        .from('annex_stays')
        .select('*')
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .order('start_date'),
      supabase
        .from('misc_entries')
        .select('*')
        .eq('year', year)
        .order('created_at'),
    ]).then(([resResult, annexResult, miscResult]) => {
      const firstError = resResult.error ?? annexResult.error ?? miscResult.error
      if (firstError) {
        console.error('Finance fetch error:', firstError)
        setError(firstError.message)
        setIsLoading(false)
        return
      }

      const reservations = (resResult.data ?? []) as Reservation[]
      const annexStays = (annexResult.data ?? []) as AnnexStay[]

      // Build unified stay rows + aggregates
      const revMap = emptyQuarterMap(0)
      const taxMap = emptyQuarterMap(0)
      const staysMap = emptyQuarterArrays<StayRow>()

      for (const r of reservations) {
        const q = quarterFromDate(r.start_date)
        revMap[q] += Number(r.paid_amount)
        taxMap[q] += Number(r.tax_amount ?? 0)
        staysMap[q].push({
          id: r.id,
          source: 'reservation',
          client_name: r.client_name,
          start_date: r.start_date,
          end_date: r.end_date,
          gite_id: r.gite_id,
          adult_count: r.adult_count,
          paid_amount: Number(r.paid_amount),
          tax_amount: r.tax_amount != null ? Number(r.tax_amount) : null,
          reservation: r,
        })
      }

      for (const a of annexStays) {
        const q = quarterFromDate(a.start_date)
        revMap[q] += Number(a.paid_amount)
        taxMap[q] += Number(a.tax_amount ?? 0)
        staysMap[q].push({
          id: a.id,
          source: 'annex',
          client_name: a.client_name,
          start_date: a.start_date,
          end_date: a.end_date,
          gite_id: null,
          adult_count: a.adult_count,
          paid_amount: Number(a.paid_amount),
          tax_amount: a.tax_amount != null ? Number(a.tax_amount) : null,
          annexStay: a,
        })
      }

      // Sort each quarter by start_date
      for (const q of [1, 2, 3, 4] as Quarter[]) {
        staysMap[q].sort((a, b) => a.start_date.localeCompare(b.start_date))
      }

      setRevenuesByQuarter(revMap)
      setTaxesByQuarter(taxMap)
      setStaysByQuarter(staysMap)
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
    staysByQuarter,
    miscEntriesByQuarter,
    isLoading,
    error,
    refetch,
  }
}
