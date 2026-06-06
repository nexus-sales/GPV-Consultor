/**
 * cacheGuard — limpieza de caché de entidades entre sesiones de usuario.
 *
 * Ejecutar runCacheGuard() síncronamente antes de que DataProvider monte
 * sus hooks, de modo que loadFromStorage() encuentre localStorage ya limpio
 * cuando el usuario activo cambia respecto al último usuario confirmado.
 *
 * gpv_last_user_id: key auxiliar que registra el userId del último perfil
 * GPV confirmado con éxito. AuthContext la escribe en loadUserProfile y la
 * borra en signOut. cacheGuard la lee para comparar con la sesión activa.
 */

export const ENTITY_CACHE_KEYS: readonly string[] = [
  'candidates',         'candidates__deleted',
  'distributors',       'distributors__deleted',
  'leads',              'leads__deleted',
  'visits',             'visits__deleted',
  'tasks',              'tasks__deleted',
  'sales',              'sales__deleted',
  'backofficeContacts', 'backofficeContacts__deleted',
  'gpv_log_history',
]

export const LAST_USER_KEY = 'gpv_last_user_id'

export function clearEntityCache(): void {
  try {
    ENTITY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch {
    // localStorage puede no estar disponible (SSR, entornos de test)
  }
}

/**
 * Lee el userId de la sesión Supabase activa directamente desde localStorage,
 * de forma síncrona y sin necesidad de hooks ni del cliente Supabase.
 *
 * Supabase v2 persiste la sesión en 'sb-<project-ref>-auth-token'.
 * Este mismo patrón ya se usa en AuthContext.signOut para limpiar tokens.
 */
function getCurrentSessionUserId(): string | null {
  try {
    const tokenKey = Object.keys(localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (!tokenKey) return null
    const raw = localStorage.getItem(tokenKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { user?: { id?: string } } | null
    return parsed?.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Compara el usuario de la sesión activa con el último usuario confirmado
 * por loadUserProfile. Si difieren, limpia la caché de entidades para evitar
 * que los hooks de DataProvider inicialicen su estado con datos de otro usuario.
 *
 * Debe llamarse síncronamente antes de que DataProvider renderice
 * (ver DataProviderWrapper.tsx).
 */
export function runCacheGuard(): void {
  try {
    const currentUserId = getCurrentSessionUserId()
    const lastUserId = localStorage.getItem(LAST_USER_KEY)

    if (currentUserId !== lastUserId) {
      clearEntityCache()
    }

    // Actualizar el tracking con quien tiene sesión ahora.
    if (currentUserId) {
      localStorage.setItem(LAST_USER_KEY, currentUserId)
    } else {
      localStorage.removeItem(LAST_USER_KEY)
    }
  } catch {
    // No bloquear el arranque de la app si localStorage no está disponible.
  }
}
