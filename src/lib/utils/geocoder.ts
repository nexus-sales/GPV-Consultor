/**
 * Geocodificador usando Google Maps Geocoding API.
 * - Utiliza la API Key de Google Maps
 * - Caché en memoria para evitar llamadas duplicadas
 */

export interface LatLng {
  lat: number
  lng: number
}

const cache = new Map<string, LatLng | null>()

/**
 * Geocodifica una dirección completa usando Google Geocoding API.
 * Devuelve null si no se encuentra resultado.
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY

  if (!apiKey) {
    console.warn('[Geocoder] Falta VITE_GOOGLE_PLACES_KEY en el entorno.')
    return null
  }

  try {
    const params = new URLSearchParams({
      address: address,
      key: apiKey,
      language: 'es',
      region: 'es'
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`
    )
    
    if (!res.ok) {
      cache.set(key, null)
      return null
    }

    const data = await res.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      const result: LatLng = {
        lat: location.lat,
        lng: location.lng
      }
      cache.set(key, result)
      return result
    } else {
      if (data.status !== 'ZERO_RESULTS') {
        console.error(`[Google Geocode] Error: ${data.status}`, data.error_message)
      }
      cache.set(key, null)
      return null
    }
  } catch (err) {
    console.error('[Google Geocode] Excepción:', err)
    cache.set(key, null)
    return null
  }
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
