/**
 * Módulo completo de KPIs según especificación §5
 *
 * Implementa todos los cálculos de métricas:
 * - Visitados semana
 * - Nuevos activos
 * - Ventas por marca
 * - Mix familias
 * - Conversión candidato→activo
 * - Calidad de datos
 */

import type {
  Distributor,
  Candidate,
  Visit,
  Sale,
  SectorId,
  Lead
} from '../types'
import { brandOptions, familyLabels } from './config'
import { normalizeProvince } from './validators'

export interface KPICalculations {
  // Visitados en la semana
  visitorsThisWeek: {
    distributors: number
    candidates: number
    total: number
  }

  // Nuevos activos en la semana
  newActiveDistributors: {
    count: number
    list: Array<{ id: string | number; name: string; createdAt: string }>
  }

  // Ventas por marca
  salesByBrand: Array<{
    brand: string
    operations: number
    percentage: number
  }>

  // Mix de familias
  salesByFamily: Array<{
    family: string
    label: string
    operations: number
    percentage: number
  }>

  // Ventas por Sector
  salesBySector: Array<{
    sectorId: SectorId
    operations: number
    percentage: number
  }>

  // Conversión candidato→activo
  conversionRate: {
    visitedCandidates: number
    convertedToActive: number
    rate: number // Porcentaje
  }

  // Embudo lead→cliente
  leadConversionFunnel: {
    total: number
    contactados: number
    interesados: number
    clientes: number
    descartados: number
    conversionRate: number // % total→cliente
    contactRate: number // % total→contactado+
  }

  // Calidad de datos
  dataQuality: {
    totalRecords: number
    completeRecords: number
    incompleteRecords: number
    qualityPercentage: number
    missingFieldsByRecord: Array<{
      id: string | number
      name: string
      missingFields: string[]
      completeness: number
    }>
  }
}

/**
 * Obtiene el rango de fechas de una semana específica (ISO 8601)
 */
export const getWeekDateRange = (
  weekString?: string
): { startDate: Date; endDate: Date } => {
  if (!weekString) {
    // Si no se especifica, usar los últimos 7 días terminando hoy al final del día
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - 7)
    startDate.setHours(0, 0, 0, 0)
    return { startDate, endDate }
  }

  // Parsear formato ISO "2025-W41"
  const [year, week] = weekString.split('-W').map(Number)

  // ISO 8601: la semana 1 contiene el 4 de enero.
  // El lunes de esa semana = Jan 4 retrocedido hasta el lunes de su semana.
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Dom=0→7, Lun=1..Sab=6
  const week1Monday = new Date(year, 0, 4 - dayOfWeek + 1)
  week1Monday.setHours(0, 0, 0, 0)

  // Calcular el lunes de la semana solicitada
  const startDate = new Date(week1Monday)
  startDate.setDate(week1Monday.getDate() + (week - 1) * 7)

  // El fin de la semana es el domingo siguiente al final del día
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}

/**
 * KPI 1: Visitados en la semana
 */
export const calculateVisitorsThisWeek = (
  visits: Visit[],
  distributors: Distributor[],
  candidates: Candidate[],
  weekString?: string
): KPICalculations['visitorsThisWeek'] => {
  const { startDate, endDate } = getWeekDateRange(weekString)

  // Filtrar visitas de la semana
  const weekVisits = visits.filter((visit) => {
    const visitDate = new Date(visit.date)
    return visitDate >= startDate && visitDate <= endDate
  })

  // IDs únicos visitados
  const visitedDistributorIds = new Set<string | number>()
  const visitedCandidateIds = new Set<string | number>()

  weekVisits.forEach((visit) => {
    if (visit.distributorId) {
      visitedDistributorIds.add(visit.distributorId)
    }
    if (visit.candidateId) {
      visitedCandidateIds.add(visit.candidateId)
    }
  })

  return {
    distributors: visitedDistributorIds.size,
    candidates: visitedCandidateIds.size,
    total: visitedDistributorIds.size + visitedCandidateIds.size
  }
}

/**
 * KPI 2: Nuevos activos en la semana
 */
export const calculateNewActiveDistributors = (
  distributors: Distributor[],
  weekString?: string
): KPICalculations['newActiveDistributors'] => {
  const { startDate, endDate } = getWeekDateRange(weekString)

  const newActives = distributors.filter((dist) => {
    const createdDate = new Date(dist.createdAt)
    return (
      createdDate >= startDate &&
      createdDate <= endDate &&
      dist.status === 'active'
    )
  })

  return {
    count: newActives.length,
    list: newActives.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt
    }))
  }
}

/**
 * KPI 3: Ventas por marca
 */
export const calculateSalesByBrand = (
  sales: Sale[]
): KPICalculations['salesByBrand'] => {
  const brandCounts: Record<string, number> = {}

  sales.forEach((sale) => {
    if (sale.brand) {
      brandCounts[sale.brand] =
        (brandCounts[sale.brand] || 0) + (sale.operations || 1)
    }
  })

  const total = Object.values(brandCounts).reduce((a, b) => a + b, 0)

  return Object.entries(brandCounts)
    .map(([brand, operations]) => {
      const option = brandOptions.find((o) => o.id === brand)
      return {
        brand: option?.label || brand,
        operations,
        percentage:
          total > 0 ? Math.round((operations / total) * 100 * 10) / 10 : 0
      }
    })
    .sort((a, b) => b.operations - a.operations)
}

/**
 * KPI: Ventas por Sector
 */
export const calculateSalesBySector = (
  sales: Sale[]
): KPICalculations['salesBySector'] => {
  const sectorCounts: Record<string, number> = {}

  sales.forEach((sale) => {
    // Mapear el label del sector (SaleSector) al ID del sector (SectorId)
    let sId: SectorId = 'telco'
    const sectorLabel = sale.sector as string

    if (sectorLabel === 'Alarma' || sectorLabel === 'Alarmas') sId = 'alarms'
    else if (sectorLabel === 'Energía') sId = 'energy'
    else if (sectorLabel === 'Telefonía') sId = 'telco'
    else sId = sectorLabel.toLowerCase()

    sectorCounts[sId] = (sectorCounts[sId] || 0) + (sale.operations || 1)
  })

  const total = Object.values(sectorCounts).reduce((a, b) => a + b, 0)

  return Object.entries(sectorCounts)
    .map(([sectorId, operations]) => ({
      sectorId: sectorId as SectorId,
      operations,
      percentage:
        total > 0 ? Math.round((operations / total) * 100 * 10) / 10 : 0
    }))
    .sort((a, b) => b.operations - a.operations)
}

/**
 * KPI 4: Mix de familias
 */
export const calculateSalesByFamily = (
  sales: Sale[]
): KPICalculations['salesByFamily'] => {
  const familyCounts: Record<string, number> = {}

  sales.forEach((sale) => {
    if (sale.family) {
      familyCounts[sale.family] =
        (familyCounts[sale.family] || 0) + (sale.operations || 1)
    }
  })

  const total = Object.values(familyCounts).reduce((a, b) => a + b, 0)

  return Object.entries(familyCounts)
    .map(([family, operations]) => ({
      family,
      label: familyLabels[family] || family,
      operations,
      percentage:
        total > 0 ? Math.round((operations / total) * 100 * 10) / 10 : 0
    }))
    .sort((a, b) => b.operations - a.operations)
}

/**
 * KPI 5: Conversión candidato→activo
 */
export const calculateConversionRate = (
  candidates: Candidate[],
  distributors: Distributor[],
  visits: Visit[],
  weekString?: string
): KPICalculations['conversionRate'] => {
  const { startDate, endDate } = getWeekDateRange(weekString)

  // Candidatos visitados en el período
  const visitedCandidateIds = new Set<string | number>()
  visits
    .filter((visit) => {
      const visitDate = new Date(visit.date)
      return visit.candidateId && visitDate >= startDate && visitDate <= endDate
    })
    .forEach((visit) => {
      if (visit.candidateId) {
        visitedCandidateIds.add(visit.candidateId)
      }
    })

  // Distribuidores convertidos (que antes eran candidatos)
  // Asumimos que un distribuidor es "convertido" si su ID coincide con un candidato visitado
  const convertedIds = distributors
    .filter((dist) => dist.status === 'active')
    .map((d) => d.id)
    .filter((id) => visitedCandidateIds.has(id))

  const visitedCount = visitedCandidateIds.size
  const convertedCount = convertedIds.length
  const rate =
    visitedCount > 0
      ? Math.round((convertedCount / visitedCount) * 100 * 10) / 10
      : 0

  return {
    visitedCandidates: visitedCount,
    convertedToActive: convertedCount,
    rate
  }
}

/**
 * KPI 6: Calidad de datos
 */
export const calculateDataQuality = (
  distributors: Distributor[],
  candidates: Candidate[]
): KPICalculations['dataQuality'] => {
  const allRecords = [
    ...distributors.map((d) => ({
      id: d.id,
      name: d.name,
      type: 'distributor' as const,
      record: d
    })),
    ...candidates.map((c) => ({
      id: c.id,
      name: c.name,
      type: 'candidate' as const,
      record: c
    }))
  ]

  const requiredFields = [
    'name',
    'phone',
    'email',
    'province',
    'city',
    'contactPerson'
  ]

  const missingFieldsByRecord = allRecords.map((item) => {
    const missing: string[] = []
    const recordData = item.record as unknown as Record<string, unknown>

    requiredFields.forEach((field) => {
      if (
        !recordData[field] ||
        recordData[field] === '' ||
        recordData[field] === null
      ) {
        missing.push(field)
      }
    })

    const completeness = Math.round(
      ((requiredFields.length - missing.length) / requiredFields.length) * 100
    )

    return {
      id: item.id,
      name: item.name,
      missingFields: missing,
      completeness
    }
  })

  const completeRecords = missingFieldsByRecord.filter(
    (r) => r.missingFields.length === 0
  )
  const incompleteRecords = missingFieldsByRecord.filter(
    (r) => r.missingFields.length > 0
  )

  const qualityPercentage =
    allRecords.length > 0
      ? Math.round((completeRecords.length / allRecords.length) * 100 * 10) / 10
      : 0

  return {
    totalRecords: allRecords.length,
    completeRecords: completeRecords.length,
    incompleteRecords: incompleteRecords.length,
    qualityPercentage,
    missingFieldsByRecord: incompleteRecords
  }
}

/**
 * KPI: Embudo de conversión lead→cliente
 */
export const calculateLeadConversionFunnel = (
  leads: Lead[]
): KPICalculations['leadConversionFunnel'] => {
  const total = leads.length
  const contactados = leads.filter(
    (l) =>
      l.estado === 'contactado' ||
      l.estado === 'pendiente' ||
      l.estado === 'interesado' ||
      l.estado === 'cliente'
  ).length
  const interesados = leads.filter(
    (l) => l.estado === 'interesado' || l.estado === 'cliente'
  ).length
  const clientes = leads.filter((l) => l.estado === 'cliente').length
  const descartados = leads.filter(
    (l) => l.estado === 'rechazado' || l.estado === 'descartado'
  ).length

  return {
    total,
    contactados,
    interesados,
    clientes,
    descartados,
    conversionRate: total > 0 ? Math.round((clientes / total) * 1000) / 10 : 0,
    contactRate: total > 0 ? Math.round((contactados / total) * 1000) / 10 : 0
  }
}

/**
 * Distribuidores por sector (basado en distributor.sectors, no ventas)
 */
export const calculateDistributorsBySector = (
  distributors: Distributor[]
): Array<{ sectorId: SectorId; count: number; percentage: number }> => {
  const counts: Record<string, number> = {}
  distributors.forEach((d) => {
    ;(d.sectors || []).forEach((sId) => {
      counts[sId] = (counts[sId] || 0) + 1
    })
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts)
    .map(([sectorId, count]) => ({
      sectorId: sectorId as SectorId,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Distribuidores por marca (basado en distributor.brands)
 */
export const calculateDistributorsByBrand = (
  distributors: Distributor[]
): Array<{
  brand: string
  label: string
  count: number
  percentage: number
}> => {
  const counts: Record<string, number> = {}
  distributors.forEach((d) => {
    ;(d.brands || []).forEach((brandId) => {
      counts[brandId] = (counts[brandId] || 0) + 1
    })
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts)
    .map(([brand, count]) => {
      const option = brandOptions.find((o) => o.id === brand)
      return {
        brand,
        label: option?.label || brand,
        count,
        percentage: Math.round((count / total) * 100)
      }
    })
    .sort((a, b) => b.count - a.count)
}

/**
 * Distribuidores por provincia
 */
export const calculateDistributorsByProvince = (
  distributors: Distributor[]
): Array<{ name: string; value: number }> => {
  const counts: Record<string, number> = {}
  distributors.forEach((d) => {
    const rawProvince = d.province?.trim()
    if (rawProvince) {
      const normalized = normalizeProvince(rawProvince)
      counts[normalized] = (counts[normalized] || 0) + 1
    }
  })
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Calcula todos los KPIs de una vez
 */
export const calculateAllKPIs = (
  distributors: Distributor[],
  candidates: Candidate[],
  visits: Visit[],
  sales: Sale[],
  weekString?: string,
  leads: Lead[] = []
): KPICalculations => {
  return {
    visitorsThisWeek: calculateVisitorsThisWeek(
      visits,
      distributors,
      candidates,
      weekString
    ),
    newActiveDistributors: calculateNewActiveDistributors(
      distributors,
      weekString
    ),
    salesByBrand: calculateSalesByBrand(sales),
    salesBySector: calculateSalesBySector(sales),
    salesByFamily: calculateSalesByFamily(sales),
    conversionRate: calculateConversionRate(
      candidates,
      distributors,
      visits,
      weekString
    ),
    leadConversionFunnel: calculateLeadConversionFunnel(leads),
    dataQuality: calculateDataQuality(distributors, candidates)
  }
}
