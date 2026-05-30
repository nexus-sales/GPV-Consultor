/**
 * Tests de safeStorage — la capa que evita la pérdida silenciosa
 * de datos cuando localStorage se llena.
 *
 * Nota: el setup global (src/test/setup.ts) sustituye localStorage
 * por un mock de juguete (getItem→null, setItem→noop). Por eso aquí
 * espiamos directamente los métodos de global.localStorage en cada
 * test, en vez de asumir que persiste.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { safeSetItem, safeGetItem, safeRemoveItem } from '../safeStorage'

describe('safeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('safeSetItem', () => {
    it('llama a localStorage.setItem con la clave y el JSON, y devuelve true', () => {
      const spy = vi.spyOn(global.localStorage, 'setItem').mockImplementation(() => {})
      const ok = safeSetItem('test', { a: 1, b: 'dos' })
      expect(ok).toBe(true)
      expect(spy).toHaveBeenCalledWith('test', JSON.stringify({ a: 1, b: 'dos' }))
    })

    it('devuelve false (no lanza) cuando localStorage está lleno', () => {
      vi.spyOn(global.localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })
      expect(() => safeSetItem('x', { big: 'data' })).not.toThrow()
      expect(safeSetItem('x', { big: 'data' })).toBe(false)
    })

    it('devuelve false ante cualquier otro error sin romper', () => {
      vi.spyOn(global.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('error raro')
      })
      expect(() => safeSetItem('x', 1)).not.toThrow()
      expect(safeSetItem('x', 1)).toBe(false)
    })
  })

  describe('safeGetItem', () => {
    it('devuelve el string que localStorage.getItem retorna', () => {
      vi.spyOn(global.localStorage, 'getItem').mockReturnValue('valor')
      expect(safeGetItem('k')).toBe('valor')
    })

    it('devuelve null si la clave no existe', () => {
      vi.spyOn(global.localStorage, 'getItem').mockReturnValue(null)
      expect(safeGetItem('no-existe')).toBe(null)
    })

    it('devuelve null (no lanza) si getItem falla', () => {
      vi.spyOn(global.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('fallo de lectura')
      })
      expect(() => safeGetItem('k')).not.toThrow()
      expect(safeGetItem('k')).toBe(null)
    })
  })

  describe('safeRemoveItem', () => {
    it('llama a removeItem y devuelve true', () => {
      const spy = vi.spyOn(global.localStorage, 'removeItem').mockImplementation(() => {})
      expect(safeRemoveItem('k')).toBe(true)
      expect(spy).toHaveBeenCalledWith('k')
    })

    it('devuelve false (no lanza) si removeItem falla', () => {
      vi.spyOn(global.localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('fallo')
      })
      expect(() => safeRemoveItem('k')).not.toThrow()
      expect(safeRemoveItem('k')).toBe(false)
    })
  })
})
