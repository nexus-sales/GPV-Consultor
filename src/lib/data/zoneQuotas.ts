/**
 * Cupo semanal de visitas por zona.
 *
 * ── Alcance deliberado ─────────────────────────────────────────────────────
 * El objetivo se guarda SOLO en este navegador (localStorage). Es una decisión
 * consciente hasta que exista el backend propio: por eso la interfaz lo llama
 * "objetivo local" y no "objetivo del equipo". No prometas coordinación entre
 * usuarios sobre este módulo — no la hay, y esa promesa vacía fue exactamente
 * lo que hundió a los equipos D2D y a las solicitudes de upgrade.
 *
 * Solo se persiste el OBJETIVO (un número por zona). El progreso NO se guarda:
 * se calcula a partir de las citas reales de la semana, así que no puede
 * desincronizarse ni quedar "pegado" si algo falla a mitad.
 */

import { startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { safeGetItem, safeSetItem } from './safeStorage'
import type { Lead, Visit } from '../types'
import { resolveZone } from './zones'

// Nombre de la clave de localStorage, no un secreto: la regla generic-api-key
// de gitleaks salta por el sufijo _KEY con una cadena asignada. gitleaks:allow
export const ZONE_QUOTAS_KEY = 'gpv_zone_quotas_v1'

export type ZoneQuotaMap = Record<string, number>

export const getZoneQuotas = (): ZoneQuotaMap => {
  try {
    const raw = safeGetItem(ZONE_QUOTAS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}

    // Se filtra lo que no sea un objetivo válido en vez de confiar en el JSON
    return Object.entries(
      parsed as Record<string, unknown>
    ).reduce<ZoneQuotaMap>((acc, [zoneId, value]) => {
      const target = Number(value)
      if (Number.isFinite(target) && target > 0)
        acc[zoneId] = Math.floor(target)
      return acc
    }, {})
  } catch {
    return {}
  }
}

export const getZoneQuota = (zoneId: string): number =>
  getZoneQuotas()[zoneId] ?? 0

/** Fija el objetivo de una zona. Con 0 (o menos) se elimina el objetivo. */
export const setZoneQuota = (zoneId: string, target: number): ZoneQuotaMap => {
  const quotas = getZoneQuotas()

  if (!Number.isFinite(target) || target <= 0) delete quotas[zoneId]
  else quotas[zoneId] = Math.floor(target)

  safeSetItem(ZONE_QUOTAS_KEY, quotas)
  return quotas
}

export interface WeekRange {
  start: Date
  end: Date
}

/** Semana natural en curso (lunes a domingo, con el locale de la app). */
export const getCurrentWeek = (reference: Date = new Date()): WeekRange => ({
  start: startOfWeek(reference, { locale: es }),
  end: endOfWeek(reference, { locale: es })
})

/**
 * Citas concertadas esta semana para los leads de una zona.
 *
 * Se cuenta sobre las visitas reales —no sobre un contador guardado—, de modo
 * que el progreso siempre refleja lo que hay en la agenda.
 */
export const countWeeklyAppointments = (
  zoneId: string,
  leads: Lead[],
  visits: Visit[],
  week: WeekRange = getCurrentWeek()
): number => {
  const zoneLeadIds = new Set(
    leads
      .filter((lead) => resolveZone(lead).id === zoneId)
      .map((lead) => String(lead.id))
  )

  if (zoneLeadIds.size === 0) return 0

  return visits.filter((visit) => {
    if (!visit.leadId || !zoneLeadIds.has(String(visit.leadId))) return false
    if (visit.result === 'cancelada') return false

    const date = new Date(visit.date)
    if (Number.isNaN(date.getTime())) return false
    return date >= week.start && date <= week.end
  }).length
}

export interface ZoneQuotaProgress {
  target: number
  achieved: number
  /** Porcentaje 0-100, acotado; 0 si no hay objetivo fijado */
  percent: number
  met: boolean
  hasTarget: boolean
}

export const getZoneQuotaProgress = (
  zoneId: string,
  leads: Lead[],
  visits: Visit[],
  week: WeekRange = getCurrentWeek()
): ZoneQuotaProgress => {
  const target = getZoneQuota(zoneId)
  const achieved = countWeeklyAppointments(zoneId, leads, visits, week)

  return {
    target,
    achieved,
    percent:
      target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0,
    met: target > 0 && achieved >= target,
    hasTarget: target > 0
  }
}
