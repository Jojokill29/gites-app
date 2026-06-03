import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RevenueEntry, TaxStay, MiscEntry, Quarter } from '../types/domain'

type QuarterMap<T> = Record<Quarter, T>

function emptyQuarterMap<T>(init: T): QuarterMap<T> {
  return { 1: init, 2: init, 3: init, 4: init }
}

function emptyQuarterArrays<T>(): QuarterMap<T[]> {
  return { 1: [], 2: [], 3: [], 4: [] }
}

export interface UseFinancesReturn {
  revenuesByQuarter: QuarterMap<number>
  taxesByQuarter: QuarterMap<number>
  miscByQuarter: QuarterMap<number>
  operationCount: number
  revenueEntriesByQuarter: QuarterMap<RevenueEntry[]>
  taxStaysByQuarter: QuarterMap<TaxStay[]>
  miscEntriesByQuarter: QuarterMap<MiscEntry[]>
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useFinances(year: number): UseFinancesReturn {
  const [revenuesByQuarter, setRevenuesByQuarter] = useState<QuarterMap<number>>(emptyQuarterMap(0))
  const [taxesByQuarter, setTaxesByQuarter] = useState<QuarterMap<number>>(emptyQuarterMap(0))
  const [miscByQuarter, setMiscByQuarter] = useState<QuarterMap<number>>(emptyQuarterMap(0))
  const [operationCount, setOperationCount] = useState(0)
  const [revenueEntriesByQuarter, setRevenueEntriesByQuarter] = useState<QuarterMap<RevenueEntry[]>>(emptyQuarterArrays)
  const [taxStaysByQuarter, setTaxStaysByQuarter] = useState<QuarterMap<TaxStay[]>>(emptyQuarterArrays)
  const [miscEntriesByQuarter, setMiscEntriesByQuarter] = useState<QuarterMap<MiscEntry[]>>(emptyQuarterArrays)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    Promise.all([
      supabase
        .from('revenue_entries')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: true }),
      supabase
        .from('tax_stays')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: true }),
      supabase
        .from('misc_entries')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: true }),
    ]).then(([revResult, taxResult, miscResult]) => {
      const firstError = revResult.error ?? taxResult.error ?? miscResult.error
      if (firstError) {
        console.error('Finance fetch error:', firstError)
        setError(firstError.message)
        setIsLoading(false)
        return
      }

      const revenues = (revResult.data ?? []) as RevenueEntry[]
      const taxes = (taxResult.data ?? []) as TaxStay[]
      const miscs = (miscResult.data ?? []) as MiscEntry[]

      // Revenue entries
      const revMap = emptyQuarterMap(0)
      const revByQ = emptyQuarterArrays<RevenueEntry>()
      for (const r of revenues) {
        const q = r.quarter as Quarter
        revMap[q] += Number(r.amount)
        revByQ[q].push(r)
      }
      setRevenuesByQuarter(revMap)
      setRevenueEntriesByQuarter(revByQ)

      // Tax stays (only sum amount when not null)
      const taxMap = emptyQuarterMap(0)
      const taxByQ = emptyQuarterArrays<TaxStay>()
      for (const t of taxes) {
        const q = t.quarter as Quarter
        if (t.amount != null) taxMap[q] += Number(t.amount)
        taxByQ[q].push(t)
      }
      setTaxesByQuarter(taxMap)
      setTaxStaysByQuarter(taxByQ)

      // Misc entries
      const miscMap = emptyQuarterMap(0)
      const miscByQ = emptyQuarterArrays<MiscEntry>()
      for (const m of miscs) {
        const q = m.quarter as Quarter
        miscMap[q] += Number(m.amount)
        miscByQ[q].push(m)
      }
      setMiscByQuarter(miscMap)
      setMiscEntriesByQuarter(miscByQ)

      setOperationCount(revenues.length + taxes.length + miscs.length)
      setIsLoading(false)
    })
  }, [year, fetchKey])

  return {
    revenuesByQuarter,
    taxesByQuarter,
    miscByQuarter,
    operationCount,
    revenueEntriesByQuarter,
    taxStaysByQuarter,
    miscEntriesByQuarter,
    isLoading,
    error,
    refetch,
  }
}
