/**
 * Tests del motor de merge — el corazón de la fiabilidad de datos.
 *
 * Estos tests protegen contra la pérdida silenciosa de datos en
 * sincronización offline. Si alguno falla, hay riesgo real de
 * que un GPV pierda trabajo de campo.
 */
import { describe, it, expect } from 'vitest'
import {
  safeTimestamp,
  resolveEntity,
  mergeEntities,
  type MergeableEntity,
} from '../mergeEntities'

// Helper para crear entidades de prueba
const entity = (
  id: string,
  updatedAt?: string | null,
  notesHistory: unknown[] = []
): MergeableEntity => ({ id, updatedAt, notesHistory })

describe('safeTimestamp — comparación de fechas a prueba de datos sucios', () => {
  it('devuelve 0 para texto vacío (el bug original)', () => {
    expect(safeTimestamp('')).toBe(0)
  })

  it('devuelve 0 para null y undefined', () => {
    expect(safeTimestamp(null)).toBe(0)
    expect(safeTimestamp(undefined)).toBe(0)
  })

  it('devuelve 0 para fecha malformada en vez de NaN', () => {
    expect(safeTimestamp('no-es-una-fecha')).toBe(0)
    expect(safeTimestamp('2026-13-45')).toBe(0)
  })

  it('parsea correctamente una fecha ISO válida', () => {
    const ts = safeTimestamp('2026-05-30T10:00:00.000Z')
    expect(ts).toBeGreaterThan(0)
    expect(Number.isFinite(ts)).toBe(true)
  })

  it('una fecha más reciente da timestamp mayor', () => {
    const older = safeTimestamp('2026-01-01T00:00:00Z')
    const newer = safeTimestamp('2026-05-30T00:00:00Z')
    expect(newer).toBeGreaterThan(older)
  })
})

describe('resolveEntity — qué versión gana en un conflicto', () => {
  it('gana la versión local si es más reciente', () => {
    const local = entity('1', '2026-05-30T12:00:00Z')
    const remote = entity('1', '2026-05-30T11:00:00Z')
    const { winner, conflict } = resolveEntity(local, remote)
    expect(winner.updatedAt).toBe('2026-05-30T12:00:00Z')
    expect(conflict).toBe(true)
  })

  it('gana la versión remota si es más reciente', () => {
    const local = entity('1', '2026-05-30T10:00:00Z')
    const remote = entity('1', '2026-05-30T11:00:00Z')
    const { winner } = resolveEntity(local, remote)
    expect(winner.updatedAt).toBe('2026-05-30T11:00:00Z')
  })

  it('NO pierde datos cuando la fecha local está vacía (bug crítico)', () => {
    // Antes: new Date('') daba Invalid Date y la comparación fallaba.
    // Ahora: local sin fecha = timestamp 0, gana remoto (que sí tiene fecha).
    const local = entity('1', '')
    const remote = entity('1', '2026-05-30T11:00:00Z')
    const { winner } = resolveEntity(local, remote)
    expect(winner.updatedAt).toBe('2026-05-30T11:00:00Z')
  })

  it('preserva el historial de notas más largo aunque gane el otro lado', () => {
    // Local tiene más notas (añadidas offline) pero remoto es más reciente.
    // Las notas locales NO se deben perder.
    const local = entity('1', '2026-05-30T10:00:00Z', ['n1', 'n2', 'n3'])
    const remote = entity('1', '2026-05-30T11:00:00Z', ['n1'])
    const { winner } = resolveEntity(local, remote)
    expect(winner.updatedAt).toBe('2026-05-30T11:00:00Z') // remoto gana en datos
    expect(winner.notesHistory).toHaveLength(3) // pero conserva notas locales
  })

  it('no marca conflicto si una de las fechas no existe', () => {
    const local = entity('1', '')
    const remote = entity('1', '2026-05-30T11:00:00Z')
    const { conflict } = resolveEntity(local, remote)
    expect(conflict).toBe(false)
  })
})

describe('mergeEntities — fusión de listas local + remoto', () => {
  it('conserva entidades creadas offline (solo en local)', () => {
    const remote = [entity('1', '2026-05-30T10:00:00Z')]
    const local = [
      entity('1', '2026-05-30T10:00:00Z'),
      entity('OFFLINE-2', '2026-05-30T12:00:00Z'), // creada sin conexión
    ]
    const { merged } = mergeEntities(remote, local)
    expect(merged).toHaveLength(2)
    expect(merged.some((e) => e.id === 'OFFLINE-2')).toBe(true)
  })

  it('toma entidades que solo existen en remoto', () => {
    const remote = [
      entity('1', '2026-05-30T10:00:00Z'),
      entity('2', '2026-05-30T10:00:00Z'), // creada por otro usuario en la nube
    ]
    const local = [entity('1', '2026-05-30T10:00:00Z')]
    const { merged } = mergeEntities(remote, local)
    expect(merged).toHaveLength(2)
    expect(merged.some((e) => e.id === '2')).toBe(true)
  })

  it('reporta los IDs en conflicto para poder avisar al usuario', () => {
    const remote = [entity('1', '2026-05-30T11:00:00Z')]
    const local = [entity('1', '2026-05-30T12:00:00Z')] // local más nuevo = conflicto
    const { conflicts } = mergeEntities(remote, local)
    expect(conflicts).toContain('1')
  })

  it('no duplica entidades que están en ambos lados', () => {
    const remote = [entity('1'), entity('2'), entity('3')]
    const local = [entity('1'), entity('2'), entity('3')]
    const { merged } = mergeEntities(remote, local)
    expect(merged).toHaveLength(3)
  })

  it('maneja listas vacías sin romperse', () => {
    expect(mergeEntities([], []).merged).toHaveLength(0)
    expect(mergeEntities([entity('1')], []).merged).toHaveLength(1)
    expect(mergeEntities([], [entity('1')]).merged).toHaveLength(1)
  })
})
