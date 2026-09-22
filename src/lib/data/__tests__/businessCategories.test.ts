import { describe, it, expect } from 'vitest'
import {
  BUSINESS_CATEGORIES,
  getCategoriesByGroup,
  toSearchQuery
} from '../businessCategories'

describe('categorías de negocio', () => {
  it('no repite ids', () => {
    const ids = BUSINESS_CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toda categoría tiene etiqueta y término de búsqueda', () => {
    BUSINESS_CATEGORIES.forEach((category) => {
      expect(category.label.trim()).not.toBe('')
      expect(category.query.trim()).not.toBe('')
      expect(category.group.trim()).not.toBe('')
    })
  })

  it('agrupa sin perder ninguna categoría', () => {
    const grouped = getCategoriesByGroup()
    const total = grouped.reduce((sum, g) => sum + g.items.length, 0)
    expect(total).toBe(BUSINESS_CATEGORIES.length)
    // Cada grupo aparece una sola vez
    const names = grouped.map((g) => g.group)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('traducción a término de búsqueda', () => {
  it('traduce la etiqueta al término que entiende Google', () => {
    expect(toSearchQuery('Bar / Cafetería')).toBe('bar cafetería')
    expect(toSearchQuery('Taller mecánico')).toBe('taller mecánico')
  })

  it('acepta también el id de la categoría', () => {
    expect(toSearchQuery('clinica_dental')).toBe('clínica dental')
  })

  it('no distingue mayúsculas en la etiqueta', () => {
    expect(toSearchQuery('restaurante')).toBe('restaurante')
    expect(toSearchQuery('RESTAURANTE')).toBe('restaurante')
  })

  it('deja pasar el texto libre tal cual', () => {
    expect(toSearchQuery('quiosco de prensa')).toBe('quiosco de prensa')
  })

  it('devuelve cadena vacía si no hay nada que buscar', () => {
    expect(toSearchQuery('')).toBe('')
    expect(toSearchQuery('   ')).toBe('')
  })
})
