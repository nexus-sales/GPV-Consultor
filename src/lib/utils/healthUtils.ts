import type { Distributor, Sale, Visit, Task } from '../types'

export interface HealthStatus {
  label: 'Crítico' | 'Riesgo' | 'Excelente' | 'Estable'
  color: 'red' | 'orange' | 'emerald' | 'blue'
  score: number
}

/**
 * Lógica unificada para el Smart Health Radar
 * Un distribuidor es Crítico si han pasado >21 días desde la última visita COMPLETADA
 * Y no tiene visitas programadas a futuro ni tareas pendientes.
 */
export function calculateHealthStatus(
  distId: string | number,
  visits: Visit[],
  sales: Sale[],
  tasks: Task[] = []
): HealthStatus {
  const distVisits = visits
    .filter((v) => String(v.distributorId) === String(distId))
    .sort((a, b) => b.date.localeCompare(a.date))

  const completedVisits = distVisits.filter((v) => v.result === 'completada')
  const lastVisit = completedVisits[0]

  const daysSinceLastVisit = lastVisit
    ? Math.floor(
        (new Date().getTime() - new Date(lastVisit.date).getTime()) /
          (1000 * 3600 * 24)
      )
    : 999

  const hasScheduledVisit = distVisits.some(
    (v) =>
      v.result === 'pendiente' &&
      new Date(v.date).getTime() >= new Date().setHours(0, 0, 0, 0)
  )

  const hasActiveTask = tasks.some(
    (t) =>
      String(t.entityId) === String(distId) &&
      t.entityType === 'distributor' &&
      t.status === 'pending'
  )

  const distSales = sales.filter(
    (s) => String(s.distributorId) === String(distId)
  )
  const hasRecentSales = distSales.length > 0

  // 1. CRÍTICO: >21 días sin visita real Y nada planeado
  if (daysSinceLastVisit > 21 && !hasScheduledVisit && !hasActiveTask) {
    return { label: 'Crítico', color: 'red', score: 10 }
  }

  // 2. RIESGO: >14 días sin visita real
  if (daysSinceLastVisit > 14 && !hasScheduledVisit && !hasActiveTask) {
    return { label: 'Riesgo', color: 'orange', score: 30 }
  }

  // 3. EXCELENTE: Visita reciente (<7 días) Y ventas activas
  if (daysSinceLastVisit <= 7 && hasRecentSales) {
    return { label: 'Excelente', color: 'emerald', score: 90 }
  }

  // 4. ESTABLE: Por defecto
  return { label: 'Estable', color: 'blue', score: 60 }
}
