import type { EntityId, Visit } from '../types'

export type VisitSourceModule =
  | 'backoffice'
  | 'candidates'
  | 'distributors'
  | 'radar'
  | 'call_center'
  | 'visits'

export type VisitLocationQuality = 'verified' | 'partial' | 'missing'

export type ScheduleSeverity = 'info' | 'warning' | 'critical'

export interface VisitScheduleIssue {
  severity: ScheduleSeverity
  code:
    | 'missing_time'
    | 'missing_location'
    | 'time_overlap'
    | 'travel_risk'
    | 'duplicate_entity'
  title: string
  message: string
}

export interface VisitScheduleTarget {
  id?: EntityId
  sourceModule?: VisitSourceModule
  distributorId?: EntityId | null
  candidateId?: EntityId | null
  backofficeContactId?: EntityId | null
  assignedUserId?: EntityId | null
  date?: string
  scheduledTime?: string
  durationMinutes?: number
  lat?: number
  lng?: number
  location?: string
}

export interface VisitSchedulePlan {
  canSave: boolean
  locationQuality: VisitLocationQuality
  issues: VisitScheduleIssue[]
}

const AVERAGE_KMH = 35
const TRAVEL_BUFFER_MINUTES = 10

function parseMinutes(time?: string): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function getEndMinutes(visit: Pick<VisitScheduleTarget, 'scheduledTime' | 'durationMinutes'>) {
  const start = parseMinutes(visit.scheduledTime)
  if (start === null) return null
  return start + (visit.durationMinutes || 30)
}

function sameEntity(a: VisitScheduleTarget, b: VisitScheduleTarget): boolean {
  return Boolean(
    (a.distributorId && b.distributorId && String(a.distributorId) === String(b.distributorId)) ||
      (a.candidateId && b.candidateId && String(a.candidateId) === String(b.candidateId)) ||
      (a.backofficeContactId &&
        b.backofficeContactId &&
        String(a.backofficeContactId) === String(b.backofficeContactId))
  )
}

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null
  const left = new Date(a).getTime()
  const right = new Date(b).getTime()
  if (Number.isNaN(left) || Number.isNaN(right)) return null
  return Math.abs(left - right) / 86_400_000
}

function distanceKm(a: VisitScheduleTarget, b: VisitScheduleTarget): number | null {
  if (
    typeof a.lat !== 'number' ||
    typeof a.lng !== 'number' ||
    typeof b.lat !== 'number' ||
    typeof b.lng !== 'number'
  ) {
    return null
  }

  const toRad = (value: number) => (value * Math.PI) / 180
  const earthKm = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * earthKm * Math.asin(Math.sqrt(h))
}

function isActiveVisit(visit: Visit): boolean {
  return visit.result !== 'cancelada' && visit.statusOperative !== 'finalizada'
}

export function inferVisitSource(target: VisitScheduleTarget): VisitSourceModule {
  if (target.sourceModule) return target.sourceModule
  if (target.backofficeContactId) return 'backoffice'
  if (target.candidateId) return 'candidates'
  if (target.distributorId) return 'distributors'
  return 'visits'
}

export function resolveLocationQuality(target: VisitScheduleTarget): VisitLocationQuality {
  if (typeof target.lat === 'number' && typeof target.lng === 'number') return 'verified'
  if (target.location?.trim()) return 'partial'
  return 'missing'
}

export function evaluateVisitSchedule(
  target: VisitScheduleTarget,
  existingVisits: Visit[]
): VisitSchedulePlan {
  const issues: VisitScheduleIssue[] = []
  const locationQuality = resolveLocationQuality(target)
  const targetStart = parseMinutes(target.scheduledTime)
  const targetEnd = getEndMinutes(target)

  if (targetStart === null || targetEnd === null) {
    issues.push({
      severity: 'warning',
      code: 'missing_time',
      title: 'Hora pendiente',
      message:
        'La visita se guardara como propuesta. Para fijarla en calendario hace falta hora programada.'
    })
  }

  if (locationQuality === 'missing') {
    issues.push({
      severity: 'warning',
      code: 'missing_location',
      title: 'Ubicacion incompleta',
      message:
        'No hay coordenadas ni direccion validada. Antes de confirmar ruta conviene completar la ubicacion.'
    })
  }

  for (const visit of existingVisits.filter(isActiveVisit)) {
    if (target.id && String(visit.id) === String(target.id)) continue
    if (target.assignedUserId && visit.assignedUserId && String(target.assignedUserId) !== String(visit.assignedUserId)) {
      continue
    }

    if (sameEntity(target, visit) && daysBetween(target.date, visit.date) !== null) {
      const distanceDays = daysBetween(target.date, visit.date)
      if (distanceDays !== null && distanceDays <= 7) {
        issues.push({
          severity: 'warning',
          code: 'duplicate_entity',
          title: 'Visita reciente para el mismo contacto',
          message: `Ya existe una visita activa para este contacto cerca de esta fecha (${visit.date}${visit.scheduledTime ? ` ${visit.scheduledTime}` : ''}).`
        })
      }
    }

    if (visit.date !== target.date || targetStart === null || targetEnd === null) continue

    const visitStart = parseMinutes(visit.scheduledTime)
    const visitEnd = getEndMinutes(visit)
    if (visitStart === null || visitEnd === null) continue

    const overlaps = targetStart < visitEnd && targetEnd > visitStart
    if (overlaps) {
      issues.push({
        severity: 'critical',
        code: 'time_overlap',
        title: 'Solape horario',
        message: `Coincide con otra visita de ${visitStartToText(visit)}. Cambia la hora o guarda solo como propuesta.`
      })
      continue
    }

    const km = distanceKm(target, visit)
    if (km === null) continue

    const travelMinutes = Math.ceil((km / AVERAGE_KMH) * 60) + TRAVEL_BUFFER_MINUTES
    const gapBefore = targetStart >= visitEnd ? targetStart - visitEnd : null
    const gapAfter = visitStart >= targetEnd ? visitStart - targetEnd : null
    const riskyBefore = gapBefore !== null && gapBefore < travelMinutes
    const riskyAfter = gapAfter !== null && gapAfter < travelMinutes

    if (riskyBefore || riskyAfter) {
      issues.push({
        severity: 'warning',
        code: 'travel_risk',
        title: 'Desplazamiento justo',
        message: `Hay ${Math.round(km)} km aproximados con otra visita del dia. Reserva al menos ${travelMinutes} min de margen.`
      })
    }
  }

  return {
    canSave: !issues.some((issue) => issue.severity === 'critical'),
    locationQuality,
    issues
  }
}

function visitStartToText(visit: Visit): string {
  const label = visit.objective || visit.location || 'calendario'
  return `${visit.scheduledTime || 'sin hora'} (${label})`
}
