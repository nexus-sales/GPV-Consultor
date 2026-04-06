import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { isSupabaseConfigured } from '../../config'
import type { Sale } from '../../types'

export const SALES_QUERY_KEY = ['sales']

export function useSalesQuery() {
  return useQuery<Sale[]>({
    queryKey: SALES_QUERY_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return []
      
      const { data, error } = await supabase
        .from('salesGPV')
        .select('*')
        .order('createdAt', { ascending: false })
        
      if (error) throw new Error(error.message)
      return (data || []) as Sale[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
