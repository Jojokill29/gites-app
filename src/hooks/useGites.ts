import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Gite } from '../types/domain'

interface UseGitesReturn {
  gites: Gite[]
  loading: boolean
  error: string | null
}

export function useGites(): UseGitesReturn {
  const [gites, setGites] = useState<Gite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGites() {
      const { data, error: fetchError } = await supabase
        .from('gites')
        .select('*')
        .order('display_order', { ascending: true })

      if (fetchError) {
        console.error('Failed to fetch gites:', fetchError)
        setError(fetchError.message)
      } else {
        setGites(data)
      }
      setLoading(false)
    }

    fetchGites()
  }, [])

  return { gites, loading, error }
}
