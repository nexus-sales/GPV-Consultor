/**
 * Clasificación de fallos de escritura — Fase 0 de la migración.
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * Hasta ahora, `createEntityStore` trataba igual dos cosas que no lo son:
 *
 *   - "no hay red"               → encolar y reintentar es LO CORRECTO
 *   - "el servidor lo rechazó"   → encolar y reintentar NO ARREGLA NADA
 *
 * Ambas terminaban en la cola con el aviso "Guardado offline", así que una
 * violación de constraint, un permiso denegado o una columna inexistente se
 * anunciaban como "se sincronizará cuando haya conexión" y nunca se
 * sincronizaban. El dato se perdía sin que nadie lo notara.
 *
 * Con Supabase eso apenas se notaba porque PostgREST rechaza poco. Un backend
 * propio rechaza mucho más —validación, tipos, constraints—, de modo que esta
 * distinción hay que tenerla ANTES de migrar, no después.
 *
 * ── Las tres categorías ─────────────────────────────────────────────────────
 *   offline   sin red o servidor inalcanzable  → encolar, reintentar
 *   server    5xx, el servidor falló           → encolar, reintentar
 *   rejected  4xx o error de integridad        → NO encolar, avisar y parar
 */

/** Qué clase de fallo fue, que es lo que decide si reintentar tiene sentido. */
export type WriteFailureKind = 'offline' | 'server' | 'rejected'

export interface ClassifiedWriteFailure {
  kind: WriteFailureKind
  /** Mensaje para la persona, en español y sin jerga de Postgres */
  message: string
  /** Código original (SQLSTATE o PGRST*), para el registro */
  code?: string
  status?: number
  /** Si encolarlo y reintentarlo puede llegar a funcionar */
  retryable: boolean
}

/**
 * Error tal y como lo devuelve hoy PostgREST. La forma es deliberadamente
 * mínima para que el backend propio de la Fase 3 pueda producirla igual.
 */
export interface RawWriteError {
  message?: string
  code?: string
  details?: string
  hint?: string
}

type RawError = RawWriteError

/**
 * Traducción de los códigos que de verdad aparecen en esta app.
 * SQLSTATE de Postgres + códigos de PostgREST.
 */
const CODE_MESSAGES: Record<string, string> = {
  // Integridad — el dato entra en conflicto con lo que ya hay
  '23505':
    'Ya existe un registro con ese valor único (código, NIF o email duplicado).',
  '23503': 'El registro hace referencia a otro que no existe.',
  '23502': 'Falta un campo obligatorio.',
  '23514': 'Un campo no cumple una restricción de la base de datos.',
  // Datos mal formados
  '22001': 'Un texto supera la longitud máxima permitida.',
  '22007': 'Una fecha tiene un formato que la base de datos no acepta.',
  '22P02':
    'Un valor tiene un tipo incorrecto (por ejemplo, texto donde se espera un número).',
  // Permisos y esquema
  '42501': 'No tienes permiso para guardar este registro.',
  '42703': 'El servidor no reconoce una de las columnas enviadas.',
  '42P01': 'El servidor no encuentra la tabla.',
  PGRST204: 'El servidor no reconoce una de las columnas enviadas.',
  PGRST301: 'La sesión ha caducado. Vuelve a iniciar sesión.'
}

/** Prefijos SQLSTATE que son siempre rechazo, aunque el status no lo diga. */
const REJECTING_SQLSTATE_CLASSES = ['22', '23', '42']

const NETWORK_ERROR_PATTERN =
  /failed to fetch|networkerror|network request failed|load failed|err_internet|timeout|aborted/i

const isNetworkError = (error: RawError | null | undefined): boolean =>
  Boolean(error?.message && NETWORK_ERROR_PATTERN.test(error.message))

const isRejectingSqlState = (code?: string): boolean =>
  Boolean(code && REJECTING_SQLSTATE_CLASSES.includes(code.slice(0, 2)))

/**
 * Decide qué clase de fallo fue.
 *
 * Ante la duda, clasifica como `offline`: encolar de más es recuperable
 * (el dato queda en la cola y se puede revisar), mientras que descartar un
 * dato que solo fallaba por falta de red sería una pérdida real.
 */
export const classifyWriteFailure = (params: {
  error?: RawError | null
  status?: number
  isOnline: boolean
}): ClassifiedWriteFailure => {
  const { error, status, isOnline } = params
  const code = error?.code || undefined

  // 1. Sin red declarada por el navegador, o error de transporte
  if (!isOnline || isNetworkError(error)) {
    return {
      kind: 'offline',
      message: 'Sin conexión. Se guardará cuando vuelva la red.',
      code,
      status,
      retryable: true
    }
  }

  // 2. Códigos de integridad o esquema: rechazo seguro, no importa el status
  if (isRejectingSqlState(code) || (code && code in CODE_MESSAGES)) {
    return {
      kind: 'rejected',
      message: CODE_MESSAGES[code!] ?? 'El servidor rechazó el registro.',
      code,
      status,
      retryable: false
    }
  }

  // 3. Por código de estado HTTP
  if (typeof status === 'number' && status > 0) {
    if (status >= 500) {
      return {
        kind: 'server',
        message: 'El servidor tuvo un problema. Se reintentará.',
        code,
        status,
        retryable: true
      }
    }
    if (status >= 400) {
      return {
        kind: 'rejected',
        message:
          status === 401 || status === 403
            ? 'No tienes permiso o la sesión ha caducado.'
            : 'El servidor rechazó el registro.',
        code,
        status,
        retryable: false
      }
    }
  }

  // 4. Sin status utilizable y sin código conocido: se trata como red.
  //    Encolar de más se puede revisar; descartar un dato bueno, no.
  return {
    kind: 'offline',
    message: 'No se pudo contactar con el servidor. Se reintentará.',
    code,
    status,
    retryable: true
  }
}

/**
 * Error que se lanza cuando el servidor rechaza una escritura.
 *
 * Lleva `reported: true` porque, para cuando se lanza, el fallo YA se ha
 * mostrado a la persona. Esa marca permite que el guardián global no vuelva
 * a anunciarlo si nadie esperaba la promesa — ver `installWriteErrorGuard`.
 */
export class WriteRejectedError extends Error {
  readonly kind = 'rejected' as const
  readonly code?: string
  readonly status?: number
  /** El fallo ya se comunicó al usuario en el momento de producirse */
  readonly reported = true

  constructor(failure: ClassifiedWriteFailure, context?: string) {
    super(context ? `${context}: ${failure.message}` : failure.message)
    this.name = 'WriteRejectedError'
    this.code = failure.code
    this.status = failure.status
  }
}

export const isWriteRejectedError = (
  value: unknown
): value is WriteRejectedError => value instanceof WriteRejectedError

/**
 * Guardián global para las llamadas que no esperan la promesa.
 *
 * Hay una docena de sitios que llaman a `updateCandidate(...)` o `addSale(...)`
 * sin `await` — legítimo cuando no interesa el resultado. Si una de esas
 * escrituras se rechaza, la promesa queda sin capturar.
 *
 * El fallo ya se le mostró a la persona en el momento (por eso `reported`),
 * así que aquí solo se silencia el ruido: evita el error no capturado en
 * consola y que Sentry lo cuente como incidente nuevo. Cualquier otro rechazo
 * sin capturar sigue propagándose con normalidad.
 */
export const installWriteErrorGuard = (): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  const handler = (event: PromiseRejectionEvent) => {
    if (isWriteRejectedError(event.reason)) {
      event.preventDefault()
    }
  }

  window.addEventListener('unhandledrejection', handler)
  return () => window.removeEventListener('unhandledrejection', handler)
}
