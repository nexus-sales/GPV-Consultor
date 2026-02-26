import type {
  Distributor,
  PriorityDrivers,
  PriorityLevel,
  Sale,
  Visit
} from '../types'
import { daysDifference, normaliseDate } from './helpers'

const clamp = (value: number, min = 0, max = 1): number => {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

const ZONE_TRAFFIC_INDEX: Record<string, number> = {
  'las palmas de gran canaria': 0.95,
  telde: 0.78,
  'san cristobal de la laguna': 0.82,
  'la laguna': 0.8,
  'santa cruz de tenerife': 0.88,
  arona: 0.74,
  adeje: 0.7,
  arrecife: 0.68,
  'puerto del rosario': 0.65,
  'granadilla de abona': 0.64,
  ingenio: 0.62,
  galdar: 0.58
}

const PROVINCE_BASELINE: Record<string, number> = {
  'las palmas': 0.82,
  'santa cruz de tenerife': 0.8
}

const BASE_TERRITORY_SCORE = 0.5
const SALES_NORMALISER = 10 // 10 operaciones ~ 100 % componente ventas
const LAST_VISIT_MAX_DAYS = 90

const resolveTerritoryScore = (distributor: Distributor): number => {
  const rawCity = distributor.city?.toLowerCase().trim() ?? ''
  if (rawCity && ZONE_TRAFFIC_INDEX[rawCity] != null) {
    return clamp(ZONE_TRAFFIC_INDEX[rawCity])
  }

  const provinceKey = distributor.province?.toLowerCase().trim() ?? ''
  if (provinceKey && PROVINCE_BASELINE[provinceKey] != null) {
    return clamp(PROVINCE_BASELINE[provinceKey])
  }

  const fallback =
    distributor.salesYtd > 0 ? clamp(distributor.salesYtd / 25, 0, 1) : 0
  return clamp(BASE_TERRITORY_SCORE + fallback * 0.35)
}

const computeRecentSales = (
  distributor: Distributor,
  sales: Sale[]
): {
  normalised: number
  totalOperations: number
  lastSaleDays: number | null
} => {
  let totalOperations = 0
  let lastSaleDays: number | null = null

  sales.forEach((sale) => {
    if (String(sale.distributorId) !== String(distributor.id)) return
    const diff = daysDifference(sale.date)
    lastSaleDays = lastSaleDays == null ? diff : Math.min(diff, lastSaleDays)
    if (diff <= 120) {
      totalOperations += sale.operations || 0
    }
  })

  return {
    totalOperations,
    normalised: clamp(totalOperations / SALES_NORMALISER),
    lastSaleDays
  }
}

const computeVisitRecency = (
  distributor: Distributor,
  visits: Visit[]
): number | null => {
  let lastVisit: number | null = null

  visits.forEach((visit) => {
    if (String(visit.distributorId) !== String(distributor.id)) return
    const diff = daysDifference(visit.date)
    lastVisit = lastVisit == null ? diff : Math.min(diff, lastVisit)
  })

  return lastVisit
}

interface PriorityComputationContext {
  sales: Sale[]
  visits: Visit[]
}

interface PriorityComputationResult {
  score: number
  level: PriorityLevel
  drivers: PriorityDrivers
}

export const calculateDistributorPriority = (
  distributor: Distributor,
  { sales, visits }: PriorityComputationContext
): PriorityComputationResult => {
  const territoryScore = resolveTerritoryScore(distributor)
  const salesMetrics = computeRecentSales(distributor, sales)
  const visitDiff = computeVisitRecency(distributor, visits)

  const completionScore = clamp(distributor.completion ?? 0)

  // Penalización ligera si no hay visitas recientes (más de 90 días)
  const visitModifier =
    visitDiff != null && visitDiff > LAST_VISIT_MAX_DAYS ? 0.85 : 1

  const weightedScore =
    territoryScore * 0.4 +
    salesMetrics.normalised * 0.35 +
    completionScore * 0.25

  const score = Math.round(clamp(weightedScore * visitModifier) * 100)

  const level: PriorityLevel =
    score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'

  const drivers: PriorityDrivers = {
    traffic: Number(territoryScore.toFixed(2)),
    sales: Number((salesMetrics.normalised * visitModifier).toFixed(2)),
    dataQuality: Number(completionScore.toFixed(2)),
    salesLast90Days: salesMetrics.totalOperations,
    lastSaleDays: salesMetrics.lastSaleDays,
    lastVisitDays: visitDiff,
    updatedAt: normaliseDate(new Date())
  }

  return {
    score,
    level,
    drivers
  }
}
