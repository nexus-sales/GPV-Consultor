/**
 * persistChange — el único sitio donde se decide qué pasa tras una escritura.
 *
 * ── Por qué existe ─────────────────────────────────────────────────────────
 * Cada operación de escritura repetía el mismo bloque en seis ficheros: tres
 * puntos de encolado (error del servidor, sin conexión, y el `catch`
 * envolvente), más su notificación. Doce copias del mismo razonamiento, todas
 * con la misma confusión de fondo: tratar "no hay red" igual que "el servidor
 * lo rechazó".
 *
 * ── Por qué esta forma, y no otra ──────────────────────────────────────────
 * `write()` es una función que el llamante aporta y que devuelve
 * `{ error, status, rowsAffected }`. Esa firma no menciona Supabase por
 * ningún lado: es la forma mínima que cualquier transporte puede producir.
 *
 * En la Fase 3 de la migración, los llamantes cambian el cuerpo de ese
 * closure —de `supabase.from(t).upsert(row)` a una llamada `fetch` contra la
 * API propia— y ESTE fichero no se toca. Es la costura por la que entra el
 * backend nuevo: un solo punto donde se interpretan los resultados de
 * escritura de toda la aplicación.
 */

import type React from 'react'
import {
  classifyWriteFailure,
  WriteRejectedError,
  type RawWriteError
} from './writeErrors'
import { generateId } from './helpers'
import type { Notification } from '../types'

export type PersistOperation = 'create' | 'update' | 'delete'

/** Lo que devuelve un intento de escritura, venga de donde venga. */
export interface RemoteWriteResult {
  error?: RawWriteError | null
  /** Código HTTP, si el transporte lo expone */
  status?: number
  /**
   * Filas afectadas, si se sabe. Un 0 con éxito no es un éxito: el servidor
   * aceptó la petición pero no encontró nada que tocar (id inexistente, fila
   * ya borrada). Se trata como pendiente, no como hecho.
   */
  rowsAffected?: number
}

export type PersistNotifier = (
  type: 'success' | 'warning' | 'error',
  title: string,
  description: string
) => void

export interface PersistChangeParams {
  /** Nombre legible de la entidad, en singular: "Contacto", "Acuerdo" */
  label: string
  operation: PersistOperation
  /** Conexión declarada por el navegador */
  isOnline: boolean
  /** Si hay backend configurado al que escribir */
  isConfigured: boolean
  /** El intento de escritura. Lo aporta el llamante; aquí no se sabe contra qué. */
  write: () => Promise<RemoteWriteResult>
  /** Cómo dejar la operación pendiente de reintento */
  enqueue: () => void
  /** Cómo deshacer la actualización optimista si el servidor la rechaza */
  rollback?: () => void
  notify: PersistNotifier
  /** Se ejecuta solo cuando la escritura se confirma */
  onSuccess?: () => void
  /** Para operaciones frecuentes (arrastrar una tarjeta) donde un aviso por éxito sería ruido */
  silentSuccess?: boolean
  log?: { error: (message: string, detail?: unknown) => void }
}

const VERBS: Record<
  PersistOperation,
  { done: string; infinitive: string; pending: string }
> = {
  create: { done: 'creado', infinitive: 'crear', pending: 'Guardado offline' },
  update: {
    done: 'actualizado',
    infinitive: 'actualizar',
    pending: 'Actualización offline'
  },
  delete: {
    done: 'eliminado',
    infinitive: 'eliminar',
    pending: 'Eliminación offline'
  }
}

/**
 * Ejecuta una escritura y reparte el resultado en tres caminos:
 *
 *   sin red / sin backend  → encolar, avisar de que queda pendiente
 *   rechazo del servidor   → deshacer, avisar del motivo real, LANZAR
 *   fallo transitorio      → encolar, reintentar más tarde
 *
 * Lanza `WriteRejectedError` únicamente en el caso del rechazo, y solo
 * después de habérselo mostrado a la persona: quien espere la promesa puede
 * reaccionar, y quien no la espere ya está informado igualmente.
 */
export async function persistChange({
  label,
  operation,
  isOnline,
  isConfigured,
  write,
  enqueue,
  rollback,
  notify,
  onSuccess,
  silentSuccess = false,
  log
}: PersistChangeParams): Promise<void> {
  const verb = VERBS[operation]

  const queueAndWarn = (reason: string) => {
    enqueue()
    notify('warning', verb.pending, reason)
  }

  // Sin backend alcanzable: ni se intenta
  if (!isOnline || !isConfigured) {
    queueAndWarn(`${label} se sincronizará cuando haya conexión.`)
    return
  }

  let result: RemoteWriteResult
  try {
    result = await write()
  } catch (thrown) {
    // El transporte lanzó — fetch caído, DNS, CORS. No es un rechazo del
    // servidor: no llegó a haber respuesta. A la cola.
    const failure = classifyWriteFailure({
      error: {
        message: thrown instanceof Error ? thrown.message : String(thrown)
      },
      isOnline
    })
    log?.error(`${operation} ${failure.kind}`, thrown)
    queueAndWarn(`${label}: ${failure.message}`)
    return
  }

  if (!result.error) {
    // Éxito sin filas afectadas: el servidor no encontró nada que tocar.
    if (result.rowsAffected === 0) {
      log?.error(
        `${operation} sin filas afectadas`,
        `${label}: el servidor no encontró el registro`
      )
      enqueue()
      return
    }

    onSuccess?.()
    if (!silentSuccess) {
      notify(
        'success',
        `${label} ${verb.done}`,
        `Los cambios se guardaron correctamente.`
      )
    }
    return
  }

  const failure = classifyWriteFailure({
    error: result.error,
    status: result.status,
    isOnline
  })
  log?.error(
    `${operation} ${failure.kind} [${failure.code ?? 'sin codigo'}]`,
    result.error.message
  )

  if (failure.kind === 'rejected') {
    rollback?.()
    notify(
      'error',
      `No se pudo ${verb.infinitive} ${label.toLowerCase()}`,
      failure.message
    )
    throw new WriteRejectedError(
      failure,
      `${verb.infinitive} ${label.toLowerCase()}`
    )
  }

  queueAndWarn(`${label}: ${failure.message}`)
}

/**
 * Construye el `notify` de persistChange a partir del `setNotifications` de
 * useSyncQueue.
 *
 * Los hooks que no usan createEntityStore montaban ese objeto de notificación
 * a mano en cada rama de cada operación. Aquí se hace una vez.
 */
export const createNotifier = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
): PersistNotifier => {
  return (type, title, description) => {
    setNotifications((prev) => [
      ...prev,
      {
        id: generateId('notif'),
        type,
        title,
        description,
        timestamp: new Date().toISOString(),
        read: false
      }
    ])
  }
}
