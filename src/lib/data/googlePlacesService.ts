interface AddressComponent {
  types: string[]
  long_name: string
  short_name: string
}

interface PlacesService {
  textSearch(
    request: { query: string; language: string },
    callback: (results: GooglePlaceResult[] | null, status: string) => void
  ): void
  getDetails(
    request: { placeId: string; fields: string[]; language: string },
    callback: (result: RawPlaceDetail | null, status: string) => void
  ): void
}

interface RawPlaceDetail {
  name?: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  business_status?: string
  address_components?: AddressComponent[]
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          PlacesService: new (attrContainer: HTMLElement) => PlacesService
        }
      }
    }
  }
}

export interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  user_ratings_total?: number
}

export interface GooglePlaceDetail {
  name: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  business_status?: string
  address_components?: AddressComponent[]
  provincia?: string
  city?: string
  postalCode?: string
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY
let placesService: PlacesService | null = null
let scriptLoadingPromise: Promise<void> | null = null

const loadGoogleMapsScript = (): Promise<void> => {
  if (scriptLoadingPromise) return scriptLoadingPromise

  scriptLoadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve()
    if (window.google && window.google.maps) return resolve()

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = (err) => {
      console.error('[GooglePlaces] Error cargando SDK:', err)
      reject(err)
    }
    document.head.appendChild(script)
  })

  return scriptLoadingPromise
}

const getService = async (): Promise<PlacesService | null> => {
  if (placesService) return placesService

  try {
    await loadGoogleMapsScript()
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      const div = document.createElement('div')
      placesService = new window.google.maps.places.PlacesService(div)
      return placesService
    }
  } catch (err) {
    console.error('[GooglePlaces] No se pudo inicializar el servicio:', err)
  }
  return null
}

const statusMessage = (status: string): string => {
  const messages: Record<string, string> = {
    REQUEST_DENIED: 'Clave API inválida o Places API no activada en Google Cloud Console',
    OVER_QUERY_LIMIT: 'Límite de consultas diario alcanzado — inténtalo mañana',
    INVALID_REQUEST: 'Petición inválida — revisa los campos de búsqueda',
    UNKNOWN_ERROR: 'Error del servidor de Google — inténtalo de nuevo',
  }
  return messages[status] ?? `Error inesperado de Google Maps (${status})`
}

export const searchPlaces = async (
  query: string
): Promise<GooglePlaceResult[]> => {
  const service = await getService()
  if (!service) {
    throw new Error('No se pudo cargar el SDK de Google Maps — comprueba la clave API y la conexión')
  }

  return new Promise((resolve, reject) => {
    service.textSearch({ query, language: 'es' }, (results, status) => {
      if (status === 'OK' && results) {
        resolve(
          results.map((r) => ({
            place_id: r.place_id,
            name: r.name,
            formatted_address: r.formatted_address,
            rating: r.rating,
            user_ratings_total: r.user_ratings_total
          }))
        )
      } else if (status === 'ZERO_RESULTS') {
        resolve([])
      } else {
        console.error('[GooglePlaces] Búsqueda fallida:', status)
        reject(new Error(statusMessage(status)))
      }
    })
  })
}

export const getPlaceDetails = async (
  placeId: string
): Promise<GooglePlaceDetail | null> => {
  const service = await getService()
  if (!service) return null

  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId: placeId,
        fields: [
          'name',
          'formatted_phone_number',
          'website',
          'formatted_address',
          'rating',
          'user_ratings_total',
          'business_status',
          'address_components'
        ],
        language: 'es'
      },
      (result, status) => {
        if (status === 'OK' && result) {
          // Extraer componentes de dirección detallados
          const components = result.address_components || []
          const provincia =
            components.find((c) =>
              c.types.includes('administrative_area_level_2')
            )?.long_name || ''
          const city =
            components.find((c) => c.types.includes('locality'))?.long_name ||
            ''
          const postalCode =
            components.find((c) => c.types.includes('postal_code'))
              ?.long_name || ''

          resolve({
            name: result.name || '',
            formatted_phone_number: result.formatted_phone_number,
            international_phone_number: result.international_phone_number,
            website: result.website,
            formatted_address: result.formatted_address,
            rating: result.rating,
            user_ratings_total: result.user_ratings_total,
            business_status: result.business_status,
            address_components: components,
            provincia,
            city,
            postalCode
          })
        } else {
          console.error('[GooglePlaces] Error en detalles:', status)
          resolve(null)
        }
      }
    )
  })
}
