import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { normaliseVisits } from '../../data/normalisers'
import { isSupabaseConfigured } from '../../config'
import type { Visit } from '../../types'

export const VISITS_QUERY_KEY = ['visits']

export function useVisitsQuery() {
  return useQuery<Visit[]>({
    queryKey: VISITS_QUERY_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('visitsGPV')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw new Error(error.message)
      return normaliseVisits(data || [])
    },
    staleTime: 1000 * 60 * 5
  })
}
