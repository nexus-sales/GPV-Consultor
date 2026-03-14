import { brandOptions, pipelineStages, familyLabels } from './config'
import type {
  Candidate,
  Distributor,
  Sale,
  Visit,
  LookupOption,
  StatsSummary,
  ActivitySummary,
  PipelineStageId
} from '../types'

interface BuildStatsOptions {
  candidates?: Candidate[]
  distributors?: Distributor[]
  sales?: Sale[]
  visits?: Visit[]
  lookups?: {
    distributors?: Record<string | number, Distributor>
    brand?: Record<string, LookupOption>
  }
  formatters?: {
    daysDifference?: (isoDate: string) => number
    formatRelativeTime?: (isoDate: string) => string
  }
}

interface SafeActivityItem {
  dateKey: string
  activity: ActivitySummary
}

// Validadores robustos
const isValidString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isValidNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value) && isFinite(value)

const isValidDate = (dateString: unknown): boolean => {
  if (!isValidString(dateString)) return false
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

const safeParseDate = (dateString: unknown): Date => {
  if (isValidDate(dateString)) {
    return new Date(dateString as string)
  }
  return new Date() // Fallback a fecha actual
}

const validateCandidate = (candidate: unknown): candidate is Candidate => {
  if (!candidate || typeof candidate !== 'object') return false
  const c = candidate as Record<string, unknown>

  return (
    isValidString(c.id) &&
    isValidString(c.name) &&
    typeof c.stage === 'string' &&
    (c.stage === 'new' ||
      c.stage === 'contacted' ||
      c.stage === 'evaluation' ||
      c.stage === 'approved' ||
      c.stage === 'rejected')
  )
}

const validateDistributor = (
  distributor: unknown
): distributor is Distributor => {
  if (!distributor || typeof distributor !== 'object') return false
  const d = distributor as Record<string, unknown>

  return (
    isValidString(d.id) &&
    isValidString(d.name) &&
    typeof d.status === 'string' &&
    (d.status === 'active' || d.status === 'pending' || d.status === 'blocked')
  )
}

const validateSale = (sale: unknown): sale is Sale => {
  if (!sale || typeof sale !== 'object') return false
  const s = sale as Record<string, unknown>

  return (
    isValidString(s.id) &&
    isValidString(s.distributorId) &&
    isValidDate(s.date) &&
    isValidString(s.brand) &&
    isValidString(s.family) &&
    isValidNumber(s.operations)
  )
}

const validateVisit = (visit: unknown): visit is Visit => {
  if (!visit || typeof visit !== 'object') return false
  const v = visit as Record<string, unknown>

  return (
    isValidString(v.id) &&
    isValidDate(v.date) &&
    typeof v.type === 'string' &&
    (v.distributorId === null ||
      v.distributorId === undefined ||
      isValidString(v.distributorId)) &&
    (v.candidateId === null ||
      v.candidateId === undefined ||
      isValidString(v.candidateId))
  )
}

const createSafeMetadata = (metadata: unknown): Record<string, string> => {
  if (!metadata || typeof metadata !== 'object') return {}

  const result: Record<string, string> = {}
  const obj = metadata as Record<string, unknown>

  Object.entries(obj).forEach(([key, value]) => {
    if (isValidString(key) && (isValidString(value) || isValidNumber(value))) {
      result[key] = String(value)
    }
  })

  return result
}

const createVisitActivity = (
  visit: Visit,
  distributorsLookup: Record<string | number, Distributor>,
  formatRelativeTime: (date: string) => string
): SafeActivityItem | null => {
  try {
    // Validar datos de entrada
    if (!validateVisit(visit)) {
      return null
    }

    // Buscar distribuidor de forma segura
    let distributorName = ''
    if (visit.distributorId && distributorsLookup[visit.distributorId]) {
      const distributor = distributorsLookup[visit.distributorId]
      if (validateDistributor(distributor)) {
        distributorName = distributor.name
      }
    }

    // Construir descripción de forma segura
    const objective = isValidString(visit.objective)
      ? visit.objective
      : 'Sin objetivo definido'
    const description = distributorName
      ? `${distributorName} • ${objective}`
      : objective

    // Validar y procesar timestamp
    let timestamp = 'Fecha desconocida'
    try {
      timestamp = formatRelativeTime(visit.date)
    } catch {
      // Silently handle error, use default timestamp
    }

    // Determinar prioridad de forma segura
    const priority = visit.result === 'pendiente' ? 'medium' : 'low'

    // Crear metadata segura
    const metadata = createSafeMetadata({
      Resultado: visit.result || 'Sin resultado',
      Duración: `${isValidNumber(visit.durationMinutes) ? visit.durationMinutes : 30} min`
    })

    const activity: ActivitySummary = {
      id: `visit-${visit.id}`,
      type: 'visit',
      title: `Visita ${visit.type || 'general'}`,
      description,
      timestamp,
      priority,
      metadata
    }

    return {
      dateKey: visit.date,
      activity
    }
  } catch {
    return null
  }
}

const createSaleActivity = (
  sale: Sale,
  distributorsLookup: Record<string | number, Distributor>,
  brandLookup: Record<string, LookupOption>,
  formatRelativeTime: (date: string) => string
): SafeActivityItem | null => {
  try {
    // Validar datos de entrada
    if (!validateSale(sale)) {
      return null
    }

    // Buscar distribuidor de forma segura
    let distributorName = ''
    if (distributorsLookup[sale.distributorId]) {
      const distributor = distributorsLookup[sale.distributorId]
      if (validateDistributor(distributor)) {
        distributorName = distributor.name
      }
    }

    // Obtener etiquetas de forma segura
    const brandLabel =
      (sale.brand ? brandLookup[sale.brand]?.label : null) || sale.brand || 'Marca desconocida'
    const familyLabel =
      (sale.family ? familyLabels[sale.family] : null) || sale.family || 'Familia desconocida'

    // Construir título de forma segura
    const operations = isValidNumber(sale.operations) ? sale.operations : 1
    const title = `${operations} operación${operations > 1 ? 'es' : ''} ${brandLabel}`

    // Construir descripción de forma segura
    const description = distributorName
      ? `${distributorName} • ${familyLabel}`
      : familyLabel

    // Validar y procesar timestamp
    let timestamp = 'Fecha desconocida'
    try {
      timestamp = formatRelativeTime(sale.date)
    } catch {
      // Silently handle error, use default timestamp
    }

    // Crear metadata segura
    const metadata = createSafeMetadata({
      Marca: brandLabel,
      Familia: familyLabel,
      Operaciones: operations.toString()
    })

    const activity: ActivitySummary = {
      id: `sale-${sale.id}`,
      type: 'sale',
      title,
      description,
      timestamp,
      priority: 'low',
      metadata
    }

    return {
      dateKey: sale.date,
      activity
    }
  } catch {
    return null
  }
}

export const buildStats = ({
  candidates = [],
  distributors = [],
  sales = [],
  visits = [],
  lookups,
  formatters
}: BuildStatsOptions): StatsSummary => {
  try {
    // Validar y filtrar datos de entrada
    const validCandidates = Array.isArray(candidates)
      ? candidates.filter(validateCandidate)
      : []

    const validDistributors = Array.isArray(distributors)
      ? distributors.filter(validateDistributor)
      : []

    const validSales = Array.isArray(sales) ? sales.filter(validateSale) : []

    const validVisits = Array.isArray(visits)
      ? visits.filter(validateVisit)
      : []

    // Crear lookups seguros
    const distributorsLookup = lookups?.distributors ?? {}
    const brandLookup = lookups?.brand ?? {}

    // Crear formatters seguros con fallbacks
    const safeDaysDifference = (isoDate: string): number => {
      try {
        if (!formatters?.daysDifference) {
          const date = safeParseDate(isoDate)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - date.getTime())
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
        return formatters.daysDifference(isoDate)
      } catch {
        return 0
      }
    }

    const safeFormatRelativeTime = (isoDate: string): string => {
      try {
        if (!formatters?.formatRelativeTime) {
          const date = safeParseDate(isoDate)
          return date.toLocaleDateString('es-ES')
        }
        return formatters.formatRelativeTime(isoDate)
      } catch {
        return 'Fecha no disponible'
      }
    }

    // Calcular estadísticas principales con validación
    const activeDistributors = validDistributors.filter(
      (item) => item.status === 'active'
    ).length

    const pendingDistributors = validDistributors.filter(
      (item) => item.status === 'pending'
    ).length

    const totalOperations = validSales.reduce((acc, sale) => {
      const operations = isValidNumber(sale.operations) ? sale.operations : 0
      return acc + operations
    }, 0)

    const visitsLast7Days = validVisits.filter((visit) => {
      try {
        return safeDaysDifference(visit.date) <= 7
      } catch {
        return false
      }
    }).length

    const candidatesInPipeline = validCandidates.filter(
      (candidate) => candidate.stage !== 'rejected'
    ).length

    // Calcular conteos por etapa del pipeline
    const pipelineCounts = pipelineStages.map((stage) => ({
      stageId: stage.id as PipelineStageId,
      count: validCandidates.filter((candidate) => candidate.stage === stage.id)
        .length
    }))

    // Calcular operaciones por marca
    const operationsByBrand = brandOptions.map((brand) => ({
      brandId: brand.id,
      label: brand.label,
      value: validSales
        .filter((sale) => sale.brand === brand.id)
        .reduce((acc, sale) => {
          const operations = isValidNumber(sale.operations)
            ? sale.operations
            : 0
          return acc + operations
        }, 0)
    }))

    // Crear actividades de visitas de forma segura
    const visitActivities: SafeActivityItem[] = validVisits
      .map((visit) =>
        createVisitActivity(visit, distributorsLookup, safeFormatRelativeTime)
      )
      .filter((item): item is SafeActivityItem => item !== null)

    // Crear actividades de ventas de forma segura
    const salesActivities: SafeActivityItem[] = validSales
      .map((sale) =>
        createSaleActivity(
          sale,
          distributorsLookup,
          brandLookup,
          safeFormatRelativeTime
        )
      )
      .filter((item): item is SafeActivityItem => item !== null)

    // Combinar y procesar actividades de forma segura
    const allActivities = [...visitActivities, ...salesActivities].filter(
      (item) => {
        // Validación exhaustiva de cada item
        return (
          item &&
          typeof item === 'object' &&
          isValidString(item.dateKey) &&
          item.activity &&
          typeof item.activity === 'object' &&
          isValidString(item.activity.id) &&
          isValidString(item.activity.type) &&
          isValidString(item.activity.title) &&
          isValidString(item.activity.description) &&
          isValidString(item.activity.timestamp) &&
          typeof item.activity.priority === 'string' &&
          typeof item.activity.metadata === 'object'
        )
      }
    )

    // Ordenar actividades por fecha de forma segura
    const sortedActivities = allActivities.sort((a, b) => {
      try {
        const dateA = safeParseDate(a.dateKey)
        const dateB = safeParseDate(b.dateKey)
        return dateB.getTime() - dateA.getTime()
      } catch {
        return 0
      }
    })

    // Extraer solo las actividades validadas
    const latestActivities: ActivitySummary[] = sortedActivities
      .map((item) => item.activity)
      .slice(0, 50) // Limitar a 50 actividades máximo para rendimiento

    // Validación final de la estructura de retorno
    const result: StatsSummary = {
      activeDistributors: isValidNumber(activeDistributors)
        ? activeDistributors
        : 0,
      pendingDistributors: isValidNumber(pendingDistributors)
        ? pendingDistributors
        : 0,
      totalOperations: isValidNumber(totalOperations) ? totalOperations : 0,
      visitsLast7Days: isValidNumber(visitsLast7Days) ? visitsLast7Days : 0,
      candidatesInPipeline: isValidNumber(candidatesInPipeline)
        ? candidatesInPipeline
        : 0,
      pipelineCounts: Array.isArray(pipelineCounts) ? pipelineCounts : [],
      operationsByBrand: Array.isArray(operationsByBrand)
        ? operationsByBrand
        : [],
      operationsBySector: [], // Propiedad requerida por StatsSummary
      latestActivities: Array.isArray(latestActivities) ? latestActivities : []
    }

    return result
  } catch {
    // Retorno de emergencia con estructura válida
    return {
      activeDistributors: 0,
      pendingDistributors: 0,
      totalOperations: 0,
      visitsLast7Days: 0,
      candidatesInPipeline: 0,
      pipelineCounts: [],
      operationsByBrand: [],
      operationsBySector: [],
      latestActivities: []
    }
  }
}
