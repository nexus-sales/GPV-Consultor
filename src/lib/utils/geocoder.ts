import { saveLS } from '../../utils/storage'

export interface LatLng {
  lat: number
  lng: number
}

const GEO_CACHE_KEY = 'gpv_geo_cache_v1'

// Restore cache from localStorage so ZERO_RESULTS are not re-queried on reload
const cache = new Map<string, LatLng | null>(
  (() => {
    try {
      return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) ?? '[]') as [string, LatLng | null][]
    } catch {
      return []
    }
  })()
)

function persistCache() {
  saveLS(GEO_CACHE_KEY, [...cache.entries()])
}

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
      persistCache()
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
      persistCache()
      return result
    } else {
      if (data.status !== 'ZERO_RESULTS') {
        console.error(`[Google Geocode] Error: ${data.status}`, data.error_message)
      }
      cache.set(key, null)
      persistCache()
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
