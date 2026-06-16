import * as Sentry from '@sentry/react'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
}

const isDev = import.meta.env.DEV
const MAX_LOG_HISTORY = 50
const logHistory: LogEntry[] = []

class Logger {
  private module: string

  constructor(module: string = 'GPV') {
    this.module = module
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    data?: unknown
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    // En producción, solo logueamos warnings y errores
    if (!isDev && level === 'debug') return
    if (!isDev && level === 'info') return

    const entry = this.formatEntry(level, message, data)

    // Store in history
    logHistory.push(entry)
    if (logHistory.length > MAX_LOG_HISTORY) {
      logHistory.shift()
    }

    const consoleMethod =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'info'
            ? console.info
            : console.debug
    consoleMethod(`[${entry.module}]`, message, data || '')

    if (!isDev && level === 'error') {
      try {
        if (data instanceof Error) {
          Sentry.captureException(data)
        } else {
          Sentry.captureException(new Error(message), { extra: { data } })
        }
      } catch {
        // Sentry nunca bloquea el logger
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: unknown): void {
    this.log('error', message, error)
  }

  /**
   * Crea una instancia de logger para un módulo específico
   */
  create(module: string): Logger {
    return new Logger(module)
  }
}

// Logger global para la aplicación
export const logger = new Logger('GPV')

// Exportar factory para crear loggers específicos
export const createLogger = (module: string): Logger => new Logger(module)

// Exportar logger con prefijo para compatibilidad
export const createPrefixedLogger = createLogger

// Exportar función para obtener el historial de logs
export const getLogHistory = (limit: number = MAX_LOG_HISTORY): LogEntry[] => {
  return logHistory.slice(-limit)
}

export default logger
