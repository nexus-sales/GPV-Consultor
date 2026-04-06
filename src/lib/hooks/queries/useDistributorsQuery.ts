import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { normaliseDistributors } from '../../data/normalisers'
import { isSupabaseConfigured } from '../../config'
import type { Distributor } from '../../types'

export const DISTRIBUTORS_QUERY_KEY = ['distributors']

export function useDistributorsQuery() {
  return useQuery<Distributor[]>({
    queryKey: DISTRIBUTORS_QUERY_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return []
      
      const { data, error } = await supabase
        .from('distributorsGPV')
        .select('*')
        .order('name')
        
      if (error) throw new Error(error.message)
      return normaliseDistributors(data || [])
    },
    staleTime: 1000 * 60 * 5, // 5 min
  })
}
