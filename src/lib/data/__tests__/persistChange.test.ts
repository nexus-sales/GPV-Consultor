import { describe, it, expect, vi } from 'vitest'
import { persistChange } from '../persistChange'
import { isWriteRejectedError } from '../writeErrors'

/** Monta los parámetros con espías, dejando sobrescribir lo que interese. */
const setup = (
  overrides: Partial<Parameters<typeof persistChange>[0]> = {}
) => {
  const enqueue = vi.fn()
  const rollback = vi.fn()
  const notify = vi.fn()
  const onSuccess = vi.fn()

  const params = {
    label: 'Contacto',
    operation: 'create' as const,
    isOnline: true,
    isConfigured: true,
    write: vi.fn().mockResolvedValue({ error: null }),
    enqueue,
    rollback,
    notify,
    onSuccess,
    ...overrides
  }

  return { params, enqueue, rollback, notify, onSuccess }
}

const typesOf = (notify: ReturnType<typeof vi.fn>) =>
  notify.mock.calls.map((call) => call[0])

describe('persistChange', () => {
  describe('sin backend alcanzable', () => {
    it('sin conexión encola sin intentar escribir', async () => {
      const { params, enqueue, notify } = setup({ isOnline: false })
      await persistChange(params)

      expect(params.write).not.toHaveBeenCalled()
      expect(enqueue).toHaveBeenCalledOnce()
      expect(typesOf(notify)).toEqual(['warning'])
    })

    it('sin backend configurado también encola', async () => {
      const { params, enqueue } = setup({ isConfigured: false })
      await persistChange(params)

      expect(params.write).not.toHaveBeenCalled()
      expect(enqueue).toHaveBeenCalledOnce()
    })
  })

  describe('escritura confirmada', () => {
    it('avisa del éxito y ejecuta onSuccess, sin encolar ni deshacer', async () => {
      const { params, enqueue, rollback, notify, onSuccess } = setup()
      await persistChange(params)

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(enqueue).not.toHaveBeenCalled()
      expect(rollback).not.toHaveBeenCalled()
      expect(typesOf(notify)).toEqual(['success'])
    })

    it('silentSuccess omite el aviso pero no el onSuccess', async () => {
      const { params, notify, onSuccess } = setup({ silentSuccess: true })
      await persistChange(params)

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(notify).not.toHaveBeenCalled()
    })

    it('éxito sin filas afectadas NO es éxito: encola y no avisa', async () => {
      const { params, enqueue, notify, onSuccess } = setup({
        operation: 'delete',
        write: vi.fn().mockResolvedValue({ error: null, rowsAffected: 0 })
      })
      await persistChange(params)

      expect(enqueue).toHaveBeenCalledOnce()
      expect(onSuccess).not.toHaveBeenCalled()
      expect(notify).not.toHaveBeenCalled()
    })

    it('con filas afectadas sí es éxito', async () => {
      const { params, onSuccess, enqueue } = setup({
        write: vi.fn().mockResolvedValue({ error: null, rowsAffected: 1 })
      })
      await persistChange(params)

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(enqueue).not.toHaveBeenCalled()
    })
  })

  describe('rechazo del servidor', () => {
    const rejection = {
      error: { message: 'duplicate key', code: '23505' },
      status: 409
    }

    it('deshace, avisa del motivo real y lanza — sin encolar', async () => {
      const { params, enqueue, rollback, notify } = setup({
        write: vi.fn().mockResolvedValue(rejection)
      })

      await expect(persistChange(params)).rejects.toSatisfy(
        isWriteRejectedError
      )

      expect(rollback).toHaveBeenCalledOnce()
      expect(enqueue).not.toHaveBeenCalled()
      expect(typesOf(notify)).toEqual(['error'])
      // El motivo llega traducido, no como código de Postgres
      expect(notify.mock.calls[0][2]).toContain('único')
    })

    it('el error lleva el verbo de la operación', async () => {
      const { params } = setup({
        operation: 'delete',
        write: vi.fn().mockResolvedValue(rejection)
      })

      await expect(persistChange(params)).rejects.toThrow(/eliminar contacto/i)
    })

    it('sin rollback aportado, no revienta', async () => {
      const { params } = setup({
        rollback: undefined,
        write: vi.fn().mockResolvedValue(rejection)
      })

      await expect(persistChange(params)).rejects.toSatisfy(
        isWriteRejectedError
      )
    })
  })

  describe('fallo transitorio', () => {
    it('un 5xx encola y no lanza', async () => {
      const { params, enqueue, rollback, notify } = setup({
        write: vi.fn().mockResolvedValue({
          error: { message: 'boom' },
          status: 503
        })
      })

      await expect(persistChange(params)).resolves.toBeUndefined()
      expect(enqueue).toHaveBeenCalledOnce()
      expect(rollback).not.toHaveBeenCalled()
      expect(typesOf(notify)).toEqual(['warning'])
    })

    it('si el transporte lanza, encola en vez de propagar', async () => {
      const { params, enqueue, rollback } = setup({
        write: vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
      })

      await expect(persistChange(params)).resolves.toBeUndefined()
      expect(enqueue).toHaveBeenCalledOnce()
      expect(rollback).not.toHaveBeenCalled()
    })

    it('un error desconocido se encola, nunca se descarta', async () => {
      const { params, enqueue } = setup({
        write: vi.fn().mockResolvedValue({ error: { message: 'algo raro' } })
      })

      await persistChange(params)
      expect(enqueue).toHaveBeenCalledOnce()
    })
  })

  it('nunca encola y deshace a la vez: son caminos excluyentes', async () => {
    const casos = [
      { error: null },
      { error: { message: 'x', code: '23505' }, status: 409 },
      { error: { message: 'x' }, status: 500 }
    ]

    for (const resultado of casos) {
      const { params, enqueue, rollback } = setup({
        write: vi.fn().mockResolvedValue(resultado)
      })
      await persistChange(params).catch(() => {})

      expect(
        enqueue.mock.calls.length && rollback.mock.calls.length,
        JSON.stringify(resultado)
      ).toBe(0)
    }
  })
})
