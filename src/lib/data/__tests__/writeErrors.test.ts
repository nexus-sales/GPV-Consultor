import { describe, it, expect } from 'vitest'
import {
  classifyWriteFailure,
  WriteRejectedError,
  isWriteRejectedError
} from '../writeErrors'

describe('clasificación de fallos de escritura', () => {
  describe('sin conexión', () => {
    it('el navegador sin red manda, aunque el error parezca otra cosa', () => {
      const f = classifyWriteFailure({
        error: { message: 'whatever', code: '23505' },
        status: 409,
        isOnline: false
      })
      expect(f.kind).toBe('offline')
      expect(f.retryable).toBe(true)
    })

    it('reconoce los errores de transporte con el navegador "en línea"', () => {
      const mensajes = [
        'TypeError: Failed to fetch',
        'NetworkError when attempting to fetch resource',
        'Network request failed',
        'Load failed',
        'The operation timed out',
        'The user aborted a request'
      ]
      mensajes.forEach((message) => {
        const f = classifyWriteFailure({ error: { message }, isOnline: true })
        expect(f.kind, message).toBe('offline')
      })
    })
  })

  describe('rechazo del servidor', () => {
    it('las violaciones de integridad no son reintentables', () => {
      const f = classifyWriteFailure({
        error: { message: 'duplicate key', code: '23505' },
        status: 409,
        isOnline: true
      })
      expect(f.kind).toBe('rejected')
      expect(f.retryable).toBe(false)
      expect(f.message).toContain('único')
    })

    it('traduce los códigos conocidos a lenguaje comprensible', () => {
      const casos: Array<[string, RegExp]> = [
        ['23503', /no existe/i],
        ['23502', /obligatorio/i],
        ['22001', /longitud/i],
        ['22P02', /tipo incorrecto/i],
        ['42501', /permiso/i],
        ['42703', /columnas/i],
        ['PGRST204', /columnas/i]
      ]
      casos.forEach(([code, patron]) => {
        const f = classifyWriteFailure({
          error: { message: 'x', code },
          status: 400,
          isOnline: true
        })
        expect(f.kind, code).toBe('rejected')
        expect(f.message, code).toMatch(patron)
      })
    })

    it('cualquier código de la clase 23 es rechazo, aunque no esté catalogado', () => {
      const f = classifyWriteFailure({
        error: { message: 'x', code: '23999' },
        isOnline: true
      })
      expect(f.kind).toBe('rejected')
    })

    it('un 4xx sin código también es rechazo', () => {
      const f = classifyWriteFailure({
        error: { message: 'Bad Request' },
        status: 400,
        isOnline: true
      })
      expect(f.kind).toBe('rejected')
      expect(f.retryable).toBe(false)
    })

    it('401 y 403 hablan de sesión y permisos', () => {
      ;[401, 403].forEach((status) => {
        const f = classifyWriteFailure({
          error: { message: 'no' },
          status,
          isOnline: true
        })
        expect(f.kind).toBe('rejected')
        expect(f.message).toMatch(/permiso|sesión/i)
      })
    })
  })

  describe('fallo del servidor', () => {
    it('los 5xx se reintentan', () => {
      ;[500, 502, 503].forEach((status) => {
        const f = classifyWriteFailure({
          error: { message: 'boom' },
          status,
          isOnline: true
        })
        expect(f.kind, String(status)).toBe('server')
        expect(f.retryable).toBe(true)
      })
    })
  })

  describe('ante la duda, encolar', () => {
    it('sin status ni código conocido no se descarta el dato', () => {
      const f = classifyWriteFailure({
        error: { message: 'algo raro' },
        isOnline: true
      })
      expect(f.kind).toBe('offline')
      expect(f.retryable).toBe(true)
    })

    it('status 0 (petición que nunca salió) se trata como red', () => {
      const f = classifyWriteFailure({
        error: { message: 'x' },
        status: 0,
        isOnline: true
      })
      expect(f.kind).toBe('offline')
    })

    it('nunca marca como reintentable un rechazo', () => {
      const rechazos = ['23505', '23503', '42501', 'PGRST204']
      rechazos.forEach((code) => {
        const f = classifyWriteFailure({
          error: { message: 'x', code },
          isOnline: true
        })
        expect(f.retryable, code).toBe(false)
      })
    })
  })
})

describe('WriteRejectedError', () => {
  it('conserva código y estado, y se reconoce con el type guard', () => {
    const failure = classifyWriteFailure({
      error: { message: 'dup', code: '23505' },
      status: 409,
      isOnline: true
    })
    const error = new WriteRejectedError(failure, 'Crear distribuidor')

    expect(isWriteRejectedError(error)).toBe(true)
    expect(error.code).toBe('23505')
    expect(error.status).toBe(409)
    expect(error.kind).toBe('rejected')
    expect(error.message).toContain('Crear distribuidor')
    // Ya se mostró al usuario: el guardián global debe poder silenciarlo
    expect(error.reported).toBe(true)
  })

  it('el type guard no confunde otros errores', () => {
    expect(isWriteRejectedError(new Error('normal'))).toBe(false)
    expect(isWriteRejectedError(null)).toBe(false)
    expect(isWriteRejectedError({ kind: 'rejected' })).toBe(false)
  })
})
