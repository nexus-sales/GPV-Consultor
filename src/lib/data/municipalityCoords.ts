import { normalizeProvince as normProv } from './validators'

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Coordenadas aproximadas (centroides) de islas de Canarias
 */
export const ISLAND_COORDS: Record<string, LatLng> = {
  'gran canaria': { lat: 27.95, lng: -15.6 },
  tenerife: { lat: 28.27, lng: -16.6 },
  lanzarote: { lat: 29.03, lng: -13.63 },
  fuerteventura: { lat: 28.4, lng: -14.0 },
  'la palma': { lat: 28.65, lng: -17.85 },
  'la gomera': { lat: 28.1, lng: -17.2 },
  'el hierro': { lat: 27.75, lng: -18.0 }
}

/**
 * Coordenadas aproximadas de municipios principales de Canarias
 */
export const MUNICIPALITY_COORDS: Record<string, LatLng> = {
  // Las Palmas
  'las palmas de gran canaria': { lat: 28.12, lng: -15.43 },
  telde: { lat: 27.99, lng: -15.41 },
  'santa lucia de tirajana': { lat: 27.91, lng: -15.48 },
  'san bartolome de tirajana': { lat: 27.76, lng: -15.57 },
  arrecife: { lat: 28.96, lng: -13.55 },
  'puerto del rosario': { lat: 28.5, lng: -13.86 },
  arucas: { lat: 28.11, lng: -15.52 },
  aguimes: { lat: 27.9, lng: -15.44 },
  ingenio: { lat: 27.92, lng: -15.44 },
  galdar: { lat: 28.14, lng: -15.65 },
  mogan: { lat: 27.88, lng: -15.72 },

  // Santa Cruz de Tenerife
  'santa cruz de tenerife': { lat: 28.46, lng: -16.25 },
  'san cristobal de la laguna': { lat: 28.48, lng: -16.31 },
  arona: { lat: 28.1, lng: -16.68 },
  adeje: { lat: 28.12, lng: -16.73 },
  'granadilla de abona': { lat: 28.12, lng: -16.57 },
  'la orotava': { lat: 28.39, lng: -16.52 },
  'puerto de la cruz': { lat: 28.41, lng: -16.54 },
  'los realejos': { lat: 28.38, lng: -16.58 },
  realejos: { lat: 28.38, lng: -16.58 },
  'san sebastian de la gomera': { lat: 28.09, lng: -17.11 },
  'santa cruz de la palma': { lat: 28.68, lng: -17.76 },
  valverde: { lat: 27.8, lng: -17.91 }
}

/**
 * Obtiene las coordenadas de una ubicación basada en municipio, isla o provincia
 */
export const getCoordsForLocation = (
  city?: string,
  island?: string,
  province?: string
): LatLng | null => {
  const cleanCity = city?.toLowerCase().trim()
  const cleanIsland = island?.toLowerCase().trim()
  const cleanProvince = province?.toLowerCase().trim()

  // 1. Intentar por ciudad/municipio
  if (cleanCity && MUNICIPALITY_COORDS[cleanCity]) {
    return MUNICIPALITY_COORDS[cleanCity]
  }

  // 2. Intentar por isla
  if (cleanIsland && ISLAND_COORDS[cleanIsland]) {
    return ISLAND_COORDS[cleanIsland]
  }

  // Variaciones de nombres de islas en city/province
  const islandKeys = Object.keys(ISLAND_COORDS)
  const cityIsIsland = islandKeys.find((k) => cleanCity?.includes(k))
  if (cityIsIsland) return ISLAND_COORDS[cityIsIsland]

  // 3. Fallback por provincia
  const officialProvince = cleanProvince
    ? normProv(cleanProvince).toLowerCase()
    : ''
  if (officialProvince === 'las palmas') {
    return ISLAND_COORDS['gran canaria']
  }
  if (officialProvince === 'santa cruz de tenerife') {
    return ISLAND_COORDS['tenerife']
  }

  return null
}
