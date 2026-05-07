import type { Distributor } from '../types'

export interface VisitAlert {
  distributorId: string | number
  distributorName: string
  lastVisitDays: number
  severity: 'warning' | 'critical'
  url: string
}

const WARNING_THRESHOLD = 18 // días → aviso preventivo
const CRITICAL_THRESHOLD = 21 // días → radar rojo

/**
 * Devuelve distribuidores activos que llevan ≥18 días sin visita,
 * ordenados de más crítico a menos.
 */
export function checkVisitAlerts(distributors: Distributor[]): VisitAlert[] {
  return distributors
    .filter(
      (d) =>
        d.status === 'active' &&
        d.priorityDrivers?.lastVisitDays != null &&
        d.priorityDrivers.lastVisitDays >= WARNING_THRESHOLD
    )
    .map((d) => ({
      distributorId: d.id,
      distributorName: d.name,
      lastVisitDays: d.priorityDrivers.lastVisitDays as number,
      severity: ((d.priorityDrivers.lastVisitDays as number) >=
      CRITICAL_THRESHOLD
        ? 'critical'
        : 'warning') as VisitAlert['severity'],
      url: `/distributors/${d.id}`
    }))
    .sort((a, b) => b.lastVisitDays - a.lastVisitDays)
}

/**
 * Agrupa las alertas en un resumen legible para la notificación.
 */
export function summariseAlerts(alerts: VisitAlert[]): {
  title: string
  body: string
} {
  const critical = alerts.filter((a) => a.severity === 'critical')
  const warning = alerts.filter((a) => a.severity === 'warning')

  if (critical.length > 0) {
    const names = critical
      .slice(0, 2)
      .map((a) => a.distributorName)
      .join(', ')
    const extra = critical.length > 2 ? ` y ${critical.length - 2} más` : ''
    return {
      title: `⚠️ ${critical.length} distribuidor${critical.length > 1 ? 'es' : ''} sin visita`,
      body: `${names}${extra} llevan más de ${CRITICAL_THRESHOLD} días sin contacto.`
    }
  }

  const names = warning
    .slice(0, 2)
    .map((a) => a.distributorName)
    .join(', ')
  const extra = warning.length > 2 ? ` y ${warning.length - 2} más` : ''
  return {
    title: `🔔 Visitas pendientes esta semana`,
    body: `${names}${extra} se acercan a los ${CRITICAL_THRESHOLD} días sin visita.`
  }
}
