/**
 * Geocodificador ligero usando Nominatim (OpenStreetMap).
 * - Sin API key
 * - Caché en memoria para evitar llamadas duplicadas
 * - Rate-limit de 1 req/s respetado mediante cola
 */

export interface LatLng {
  lat: number
  lng: number
}

const cache = new Map<string, LatLng | null>()
const queue: Array<() => void> = []
let processing = false

function processQueue() {
  if (processing || queue.length === 0) return
  processing = true
  const next = queue.shift()!
  next()
  setTimeout(() => {
    processing = false
    processQueue()
  }, 1100) // 1.1s entre llamadas (Nominatim permite 1 req/s)
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push(() => fn().then(resolve).catch(reject))
    processQueue()
  })
}

/**
 * Geocodifica una dirección completa usando Nominatim.
 * Devuelve null si no se encuentra resultado.
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  return enqueue(async () => {
    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
        countrycodes: 'es'
      })
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'GPV-Canarias/1.0' } }
      )
      if (!res.ok) {
        cache.set(key, null)
        return null
      }
      const data = await res.json()
      if (!data || data.length === 0) {
        cache.set(key, null)
        return null
      }
      const result: LatLng = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
      cache.set(key, result)
      return result
    } catch {
      cache.set(key, null)
      return null
    }
  })
}

/**
 * Construye la query de geocodificación más precisa posible
 * con los datos disponibles del distribuidor/candidato.
 */
export function buildGeoQuery(
  address?: string,
  city?: string,
  postalCode?: string,
  province?: string
): string {
  const parts: string[] = []
  if (address?.trim()) parts.push(address.trim())
  if (postalCode?.trim()) parts.push(postalCode.trim())
  if (city?.trim()) parts.push(city.trim())
  if (province?.trim()) parts.push(province.trim())
  parts.push('Canarias, España')
  return parts.join(', ')
}
