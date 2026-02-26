/**
 * Hook personalizado para acceder a todos los KPIs calculados
 */

import { useMemo } from 'react'
import { useAppData } from '../useAppData'
import {
  calculateAllKPIs,
  calculateVisitorsThisWeek,
  calculateNewActiveDistributors,
  calculateSalesByBrand,
  calculateSalesByFamily,
  calculateConversionRate,
  calculateDataQuality,
  type KPICalculations
} from '../data/kpiCalculations'

export interface UseKPIsResult {
  // Todas las métricas calculadas
  kpis: KPICalculations

  // Funciones para recalcular con diferentes períodos
  calculateForWeek: (weekString: string) => KPICalculations

  // Estado
  isLoading: boolean
}

export const useKPIs = (weekString?: string): UseKPIsResult => {
  const { distributors, candidates, visits, sales } = useAppData()

  // Calcular todos los KPIs
  const kpis = useMemo(() => {
    return calculateAllKPIs(distributors, candidates, visits, sales, weekString)
  }, [distributors, candidates, visits, sales, weekString])

  // Función para recalcular con una semana específica
  const calculateForWeek = (week: string): KPICalculations => {
    return calculateAllKPIs(distributors, candidates, visits, sales, week)
  }

  return {
    kpis,
    calculateForWeek,
    isLoading: false
  }
}

// Hook específico para cada KPI (por si se necesita usar individualmente)

export const useVisitorsThisWeek = (weekString?: string) => {
  const { distributors, candidates, visits } = useAppData()

  return useMemo(() => {
    return calculateVisitorsThisWeek(
      visits,
      distributors,
      candidates,
      weekString
    )
  }, [visits, distributors, candidates, weekString])
}

export const useNewActiveDistributors = (weekString?: string) => {
  const { distributors } = useAppData()

  return useMemo(() => {
    return calculateNewActiveDistributors(distributors, weekString)
  }, [distributors, weekString])
}

export const useSalesByBrand = () => {
  const { sales } = useAppData()

  return useMemo(() => {
    return calculateSalesByBrand(sales)
  }, [sales])
}

export const useSalesByFamily = () => {
  const { sales } = useAppData()

  return useMemo(() => {
    return calculateSalesByFamily(sales)
  }, [sales])
}

export const useConversionRate = (weekString?: string) => {
  const { candidates, distributors, visits } = useAppData()

  return useMemo(() => {
    return calculateConversionRate(candidates, distributors, visits, weekString)
  }, [candidates, distributors, visits, weekString])
}

export const useDataQuality = () => {
  const { distributors, candidates } = useAppData()

  return useMemo(() => {
    return calculateDataQuality(distributors, candidates)
  }, [distributors, candidates])
}
