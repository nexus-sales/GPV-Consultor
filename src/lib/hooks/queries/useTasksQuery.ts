import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabaseClient'
import { isSupabaseConfigured } from '../../config'
import type { Task } from '../../types'

export const TASKS_QUERY_KEY = ['tasks']

export function useTasksQuery() {
  return useQuery<Task[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return []
      
      const { data, error } = await supabase
        .from('tasksGPV')
        .select('*')
        .order('createdAt', { ascending: false })
        
      if (error) throw new Error(error.message)
      return (data || []) as Task[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
