/**
 * Zonas de visita — agrupación de leads por territorio y orden de recorrido.
 *
 * La unidad de zona es el código postal, que es lo que Google devuelve en los
 * detalles del sitio. Cuando un lead no tiene código postal fiable se agrupa
 * por municipio, y como último recurso queda una zona "sin ubicar" explícita:
 * nunca se descarta un lead en silencio.
 *
 * La zona se CALCULA, no se persiste: así no puede quedar desincronizada con
 * la dirección del lead y no hace falta una columna más en la base de datos.
 * Si en una fase posterior se dibujan distritos en el mapa, el cambio se
 * concentra en `resolveZone`.
 */

import type { Lead } from '../types'
import { getCoordsForLocation, type LatLng } from './municipalityCoords'
import { getDistanceKm } from '../../utils/geoUtils'

export const UNZONED_ID = '__sin_ubicar__'

export type ZoneKind = 'postal_code' | 'municipality' | 'unzoned'

export interface Zone {
  /** Identificador estable: el código postal, el municipio normalizado, o UNZONED_ID */
  id: string
  /** Etiqueta para la interfaz */
  label: string
  kind: ZoneKind
}

export interface ZoneGroup extends Zone {
  leads: Lead[]
  /** Leads de la zona cuya posición es aproximada (centroide, no dirección) */
  approximateCount: number
}

const CANARY_POSTAL_CODE = /^3[58]\d{3}$/

/** Un código postal solo vale como zona si tiene forma de código postal canario. */
export const isUsablePostalCode = (value?: string): boolean =>
  CANARY_POSTAL_CODE.test((value ?? '').trim())

const normalise = (value?: string): string =>
  (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Resuelve la zona de un lead. Nunca devuelve null: hay zona para todos. */
export const resolveZone = (lead: Lead): Zone => {
  if (isUsablePostalCode(lead.codigo_postal)) {
    const code = lead.codigo_postal!.trim()
    return {
      id: code,
      label: lead.ciudad ? `${code} · ${lead.ciudad}` : code,
      kind: 'postal_code'
    }
  }

  const municipality = normalise(lead.ciudad)
  if (municipality) {
    return {
      id: `mun:${municipality}`,
      label: `${lead.ciudad} (sin código postal)`,
      kind: 'municipality'
    }
  }

  return { id: UNZONED_ID, label: 'Sin ubicar', kind: 'unzoned' }
}

/**
 * Posición de un lead para ordenar el recorrido.
 *
 * Devuelve también si es exacta: un centroide de municipio sirve para agrupar,
 * pero ordenar por él es engañoso, y la interfaz lo advierte en vez de fingir
 * una precisión que no hay.
 */
export const resolveLeadPosition = (
  lead: Lead
): { position: LatLng | null; approximate: boolean } => {
  if (typeof lead.latitude === 'number' && typeof lead.longitude === 'number') {
    return {
      position: { lat: lead.latitude, lng: lead.longitude },
      approximate: false
    }
  }

  const fallback = getCoordsForLocation(lead.ciudad, lead.isla, lead.provincia)
  return { position: fallback, approximate: Boolean(fallback) }
}

/**
 * Ordena los leads de una zona por recorrido, con el vecino más cercano:
 * se arranca del punto de partida (o del primer lead con posición) y en cada
 * paso se salta al más próximo de los que quedan.
 *
 * No es una ruta óptima — para eso haría falta un solver — pero evita el
 * zigzag de extremo a extremo, que es lo que pide esta fase. Los leads sin
 * posición conocida van al final, en su orden original.
 */
export const orderLeadsByProximity = (
  leads: Lead[],
  startPoint?: LatLng | null
): Lead[] => {
  const located: Array<{ lead: Lead; position: LatLng }> = []
  const unlocated: Lead[] = []

  leads.forEach((lead) => {
    const { position } = resolveLeadPosition(lead)
    if (position) located.push({ lead, position })
    else unlocated.push(lead)
  })

  if (located.length === 0) return [...unlocated]

  const pending = [...located]
  const ordered: Lead[] = []

  let cursor: LatLng = startPoint ?? pending[0].position

  while (pending.length > 0) {
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    pending.forEach((candidate, index) => {
      const distance = getDistanceKm(
        cursor.lat,
        cursor.lng,
        candidate.position.lat,
        candidate.position.lng
      )
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })

    const [next] = pending.splice(bestIndex, 1)
    ordered.push(next.lead)
    cursor = next.position
  }

  return [...ordered, ...unlocated]
}

/** Estados de lead que siguen pendientes de visitar. */
const PENDING_STATES: ReadonlySet<Lead['estado']> = new Set([
  'nuevo',
  'contactado',
  'pendiente',
  'interesado'
])

export const isPendingVisit = (lead: Lead): boolean =>
  PENDING_STATES.has(lead.estado)

/**
 * Agrupa leads por zona y ordena cada grupo por recorrido.
 *
 * Las zonas salen ordenadas por número de leads pendientes (donde más trabajo
 * hay, primero) y "Sin ubicar" siempre al final, para que no estorbe la ruta
 * pero tampoco desaparezca.
 */
export const groupLeadsByZone = (
  leads: Lead[],
  startPoint?: LatLng | null
): ZoneGroup[] => {
  const groups = new Map<string, ZoneGroup>()

  leads.forEach((lead) => {
    const zone = resolveZone(lead)
    const existing = groups.get(zone.id)
    const { approximate } = resolveLeadPosition(lead)

    if (existing) {
      existing.leads.push(lead)
      if (approximate) existing.approximateCount += 1
    } else {
      groups.set(zone.id, {
        ...zone,
        leads: [lead],
        approximateCount: approximate ? 1 : 0
      })
    }
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      leads: orderLeadsByProximity(group.leads, startPoint)
    }))
    .sort((a, b) => {
      if (a.kind === 'unzoned') return 1
      if (b.kind === 'unzoned') return -1
      if (b.leads.length !== a.leads.length)
        return b.leads.length - a.leads.length
      return a.label.localeCompare(b.label, 'es')
    })
}
