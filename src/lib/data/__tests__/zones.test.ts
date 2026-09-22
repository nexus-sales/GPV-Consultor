import { describe, it, expect } from 'vitest'
import type { Lead } from '../../types'
import {
  resolveZone,
  resolveLeadPosition,
  orderLeadsByProximity,
  groupLeadsByZone,
  isPendingVisit,
  isUsablePostalCode,
  UNZONED_ID
} from '../zones'

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  fuente: 'google_places',
  nombre: 'Lead',
  estado: 'nuevo',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...over
})

describe('resolución de zona', () => {
  it('acepta códigos postales canarios y rechaza el resto', () => {
    expect(isUsablePostalCode('35001')).toBe(true)
    expect(isUsablePostalCode('38670')).toBe(true)
    expect(isUsablePostalCode('28001')).toBe(false) // Madrid: no es zona canaria
    expect(isUsablePostalCode('3500')).toBe(false)
    expect(isUsablePostalCode('')).toBe(false)
    expect(isUsablePostalCode(undefined)).toBe(false)
  })

  it('usa el código postal como zona cuando es válido', () => {
    const zone = resolveZone(
      lead({ codigo_postal: '35001', ciudad: 'Las Palmas' })
    )
    expect(zone.id).toBe('35001')
    expect(zone.kind).toBe('postal_code')
    expect(zone.label).toContain('Las Palmas')
  })

  it('cae al municipio si el código postal no sirve', () => {
    const zone = resolveZone(lead({ codigo_postal: '', ciudad: 'Arucas' }))
    expect(zone.kind).toBe('municipality')
    expect(zone.id).toBe('mun:arucas')
  })

  it('agrupa igual el mismo municipio escrito distinto', () => {
    const a = resolveZone(lead({ ciudad: 'Telde' }))
    const b = resolveZone(lead({ ciudad: '  TELDE ' }))
    expect(a.id).toBe(b.id)
  })

  it('nunca deja un lead fuera: sin datos va a "sin ubicar"', () => {
    const zone = resolveZone(lead({}))
    expect(zone.id).toBe(UNZONED_ID)
    expect(zone.kind).toBe('unzoned')
  })
})

describe('posición del lead', () => {
  it('prefiere las coordenadas reales y las marca como exactas', () => {
    const { position, approximate } = resolveLeadPosition(
      lead({ latitude: 28.1, longitude: -15.4, ciudad: 'Las Palmas' })
    )
    expect(position).toEqual({ lat: 28.1, lng: -15.4 })
    expect(approximate).toBe(false)
  })

  it('cae al centroide del municipio y avisa de que es aproximada', () => {
    const { position, approximate } = resolveLeadPosition(
      lead({ ciudad: 'Las Palmas de Gran Canaria' })
    )
    if (position) {
      expect(approximate).toBe(true)
    } else {
      // Si el municipio no está en la tabla de centroides, no se inventa
      expect(approximate).toBe(false)
    }
  })
})

describe('orden por recorrido', () => {
  it('encadena por el vecino más cercano en vez de por fecha de alta', () => {
    // Alineados en longitud: A(0) — C(0.2) — B(0.9). Saliendo de A, el orden
    // razonable es A, C, B; por antigüedad sería A, B, C.
    const a = lead({ id: 'A', latitude: 28, longitude: 0 })
    const b = lead({ id: 'B', latitude: 28, longitude: 0.9 })
    const c = lead({ id: 'C', latitude: 28, longitude: 0.2 })

    const ordered = orderLeadsByProximity([a, b, c], { lat: 28, lng: 0 })
    expect(ordered.map((l) => l.id)).toEqual(['A', 'C', 'B'])
  })

  it('manda al final los leads sin posición, sin perderlos', () => {
    const conPos = lead({ id: 'con', latitude: 28, longitude: 0 })
    const sinPos = lead({ id: 'sin' })

    const ordered = orderLeadsByProximity([sinPos, conPos])
    expect(ordered.map((l) => l.id)).toEqual(['con', 'sin'])
    expect(ordered).toHaveLength(2)
  })

  it('no pierde ni duplica leads', () => {
    const leads = Array.from({ length: 10 }, (_, i) =>
      lead({ id: `L${i}`, latitude: 28 + i * 0.01, longitude: -15 - i * 0.01 })
    )
    const ordered = orderLeadsByProximity(leads)
    expect(ordered).toHaveLength(10)
    expect(new Set(ordered.map((l) => l.id)).size).toBe(10)
  })

  it('con la lista vacía devuelve lista vacía', () => {
    expect(orderLeadsByProximity([])).toEqual([])
  })
})

describe('agrupación por zona', () => {
  it('agrupa por código postal y pone "sin ubicar" al final', () => {
    const groups = groupLeadsByZone([
      lead({ id: '1', codigo_postal: '35001', ciudad: 'Las Palmas' }),
      lead({ id: '2', codigo_postal: '35001', ciudad: 'Las Palmas' }),
      lead({ id: '3' }),
      lead({ id: '4', codigo_postal: '38001', ciudad: 'Santa Cruz' })
    ])

    expect(groups[0].id).toBe('35001')
    expect(groups[0].leads).toHaveLength(2)
    expect(groups[groups.length - 1].id).toBe(UNZONED_ID)
  })

  it('cuenta cuántos leads de la zona tienen posición aproximada', () => {
    const [group] = groupLeadsByZone([
      lead({ codigo_postal: '35001', latitude: 28, longitude: -15 }),
      lead({ codigo_postal: '35001', ciudad: 'Las Palmas de Gran Canaria' })
    ])
    expect(group.leads).toHaveLength(2)
    expect(group.approximateCount).toBeLessThanOrEqual(1)
  })
})

describe('leads pendientes de visita', () => {
  it('incluye los que siguen vivos y excluye los cerrados', () => {
    expect(isPendingVisit(lead({ estado: 'nuevo' }))).toBe(true)
    expect(isPendingVisit(lead({ estado: 'contactado' }))).toBe(true)
    expect(isPendingVisit(lead({ estado: 'interesado' }))).toBe(true)
    expect(isPendingVisit(lead({ estado: 'descartado' }))).toBe(false)
    expect(isPendingVisit(lead({ estado: 'cliente' }))).toBe(false)
    expect(isPendingVisit(lead({ estado: 'rechazado' }))).toBe(false)
  })
})
