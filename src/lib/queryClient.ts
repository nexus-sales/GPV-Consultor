import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache fresco
      gcTime: 1000 * 60 * 30, // 30 minutos guardado en memoria
      retry: 2,
      refetchOnWindowFocus: false // Evitar refetch constante al cambiar de pestaña
    }
  }
})
