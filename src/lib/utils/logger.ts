type LogMethod = 'log' | 'info' | 'warn' | 'error'

type ConsoleMethod = (...args: unknown[]) => void

const isDev = (() => {
  if (
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined'
  ) {
    return Boolean(import.meta.env.DEV)
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production'
  }
  return true
})()

const invokeConsole = (method: LogMethod, ...args: unknown[]): void => {
  if (!isDev) return

  const targetConsole: Console | undefined =
    typeof console === 'undefined' ? undefined : console
  const target: ConsoleMethod | undefined = targetConsole
    ? (Reflect.get(targetConsole, method) as ConsoleMethod | undefined)
    : undefined
  if (!target) return
  target(...args)
}

export const logger = {
  info: (...args: unknown[]) => invokeConsole('info', ...args),
  log: (...args: unknown[]) => invokeConsole('log', ...args),
  warn: (...args: unknown[]) => invokeConsole('warn', ...args),
  error: (...args: unknown[]) => invokeConsole('error', ...args)
}

export const createPrefixedLogger = (prefix: string) => ({
  info: (...args: unknown[]) => logger.info(prefix, ...args),
  log: (...args: unknown[]) => logger.log(prefix, ...args),
  warn: (...args: unknown[]) => logger.warn(prefix, ...args),
  error: (...args: unknown[]) => logger.error(prefix, ...args)
})
