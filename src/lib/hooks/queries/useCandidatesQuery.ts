import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { normaliseCandidates } from '../../data/normalisers'
import { isSupabaseConfigured } from '../../config'
import type { Candidate } from '../../types'

export const CANDIDATES_QUERY_KEY = ['candidates']

export function useCandidatesQuery() {
  return useQuery<Candidate[]>({
    queryKey: CANDIDATES_QUERY_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return []
      
      const { data, error } = await supabase
        .from('candidatesGPV')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (error) throw new Error(error.message)
      return normaliseCandidates(data || [])
    },
    staleTime: 1000 * 60 * 5, // 5 min
  })
}
