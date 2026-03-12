/**
 * Tests para el Logger centralizado
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, createLogger } from '../logger'

describe('Logger', () => {
  // Mock de console para capturar logs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
  const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('logger global', () => {
    it('debería tener método info', () => {
      expect(logger.info).toBeDefined()
      expect(typeof logger.info).toBe('function')
    })

    it('debería tener método warn', () => {
      expect(logger.warn).toBeDefined()
      expect(typeof logger.warn).toBe('function')
    })

    it('debería tener método error', () => {
      expect(logger.error).toBeDefined()
      expect(typeof logger.error).toBe('function')
    })

    it('debería llamar a console.info', () => {
      logger.info('Mensaje informativo')
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a console.warn', () => {
      logger.warn('Advertencia', { codigo: 'W001' })
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a console.error', () => {
      const error = new Error('Error de prueba')
      logger.error('Error ocurrido', error)
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('createLogger', () => {
    it('debería crear un logger con módulo personalizado', () => {
      const customLogger = createLogger('Auth')
      
      expect(customLogger).toBeDefined()
      expect(customLogger.info).toBeDefined()
      
      customLogger.info('Login exitoso')
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })

    it('debería crear loggers independientes', () => {
      const logger1 = createLogger('Module1')
      const logger2 = createLogger('Module2')
      
      logger1.info('Mensaje 1')
      logger2.info('Mensaje 2')
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('formato de logs', () => {
    it('debería formatear mensaje sin datos adicionales', () => {
      logger.info('Mensaje simple')
      
      const callArgs = consoleInfoSpy.mock.calls[0]
      // El logger usa formato: [module] message data
      expect(callArgs[0]).toBe('[GPV]')
      expect(callArgs[1]).toBe('Mensaje simple')
    })

    it('debería formatear mensaje con datos obj', () => {
      const data = { user: 'test', id: 123 }
      logger.info('Con datos', data)
      
      const callArgs = consoleInfoSpy.mock.calls[0]
      expect(callArgs[0]).toBe('[GPV]')
      expect(callArgs[1]).toBe('Con datos')
      expect(callArgs[2]).toEqual(data)
    })

    it('debería formatear mensaje con datos string', () => {
      logger.info('Con dato string', 'dato adicional')
      
      const callArgs = consoleInfoSpy.mock.calls[0]
      expect(callArgs[0]).toBe('[GPV]')
      expect(callArgs[1]).toBe('Con dato string')
      expect(callArgs[2]).toBe('dato adicional')
    })

    it('debería manejar objetos de error correctamente', () => {
      const error = new Error('Test error')
      logger.error('Error capturado', error)
      
      const callArgs = consoleErrorSpy.mock.calls[0]
      expect(callArgs[0]).toBe('[GPV]')
      expect(callArgs[1]).toBe('Error capturado')
      expect(callArgs[2]).toBe(error)
    })
  })

  describe('filtros por entorno', () => {
    it('debería loggear warn y error siempre', () => {
      logger.warn('Warning en cualquier entorno')
      logger.error('Error en cualquier entorno')
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })
})
