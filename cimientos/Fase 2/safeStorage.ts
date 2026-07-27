// ============================================================
// safeStorage — localStorage a prueba de fallos
// ============================================================
// Problema que resuelve: la app hace ~34 llamadas a
// localStorage.setItem sin capturar QuotaExceededError. Con datos
// reales (cientos de registros con historial en jsonb) se supera
// el límite de ~5MB y el guardado falla EN SILENCIO: el usuario
// cree que guardó y no es así.
//
// Esta capa captura el error, avisa, y nunca rompe el flujo.
// ============================================================

import { createLogger } from '../logger'

const log = createLogger('Storage')

/**
 * Guarda un valor en localStorage de forma segura.
 * Si el almacenamiento está lleno, lo registra y devuelve false
 * en vez de lanzar una excepción que rompa la app.
 *
 * @returns true si se guardó, false si falló.
 */
export function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      log.error(
        `localStorage lleno al guardar "${key}". ` +
          `Los datos siguen en la nube (Supabase), pero la caché local no se actualizó.`
      )
      // Nota: aquí se podría disparar un toast al usuario. Se deja
      // como log para no acoplar la capa de storage a la de UI.
      // El hook que llama puede comprobar el false y avisar.
    } else {
      log.error(`Error guardando "${key}" en localStorage:`, e)
    }
    return false
  }
}

/**
 * Lee un valor crudo (string) de localStorage de forma segura.
 * Devuelve null si no existe o si hay error.
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (e) {
    log.error(`Error leyendo "${key}" de localStorage:`, e)
    return null
  }
}

/**
 * Elimina una clave de localStorage de forma segura.
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (e) {
    log.error(`Error eliminando "${key}" de localStorage:`, e)
    return false
  }
}
