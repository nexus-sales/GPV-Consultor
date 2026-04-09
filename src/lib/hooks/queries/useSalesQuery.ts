import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { normaliseSales } from '../../data/normalisers'
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
        .order('fechaCierre', { ascending: false })

      if (error) throw new Error(error.message)
      return normaliseSales(data || [])
    },
    staleTime: 1000 * 60 * 5
  })
}
