import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Invoice, Quarter } from '../types/domain'
import { LABELS } from '../constants/labels'

// Fixed date ranges per quarter (no need for date-fns here — they never change)
const QUARTER_RANGES: Record<Quarter, { start: string; end: string }> = {
  1: { start: '01-01', end: '03-31' },
  2: { start: '04-01', end: '06-30' },
  3: { start: '07-01', end: '09-30' },
  4: { start: '10-01', end: '12-31' },
}

export interface UseInvoicesReturn {
  invoices: Invoice[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useInvoices(year: number, quarter: Quarter): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => setFetchKey((k) => k + 1), [])

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const { start, end } = QUARTER_RANGES[quarter]
    const startDate = `${year}-${start}`
    const endDate = `${year}-${end}`

    supabase
      .from('invoices')
      .select('*')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .order('invoice_date', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) {
          console.error('Invoices fetch error:', err)
          setError(LABELS.errorLoadData)
          setIsLoading(false)
          return
        }
        setInvoices(data ?? [])
        setIsLoading(false)
      })
  }, [year, quarter, fetchKey])

  return { invoices, isLoading, error, refetch }
}
