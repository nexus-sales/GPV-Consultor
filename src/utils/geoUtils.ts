/**
 * Utilidades para el manejo de datos geográficos y normalización en filtros
 */

/**
 * Distancia en kilómetros entre dos coordenadas (fórmula del semiverseno).
 *
 * Vive aquí para que la usen tanto el Radar como el agrupado por zonas; antes
 * había una copia dentro de Radar.tsx.
 */
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Radio de la Tierra en km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const normalizeForFilter = (val?: string): string => {
  return (val || '').trim().toLowerCase()
}

/**
 * Interesa isla desde municipio u otras propiedades si no está definida
 */
export const matchIslandWithInference = (
  recordIsland: string | undefined,
  recordCity: string | undefined,
  targetIslandId: string,
  municipalityOptions: Array<{ id: string; label: string; islandId?: string }>
): boolean => {
  const normalizedTarget = normalizeForFilter(targetIslandId)

  // 1. Match directo si hay isla definida
  if (recordIsland && normalizeForFilter(recordIsland) === normalizedTarget) {
    return true
  }

  // 2. Inferencia por municipio
  if (recordCity) {
    const mun = municipalityOptions.find(
      (m) =>
        normalizeForFilter(m.label) === normalizeForFilter(recordCity) ||
        normalizeForFilter(m.id) === normalizeForFilter(recordCity)
    )
    if (
      mun &&
      mun.islandId &&
      normalizeForFilter(mun.islandId) === normalizedTarget
    ) {
      return true
    }
  }

  return false
}

/**
 * Match de municipio permitiendo búsqueda por ID o Etiqueta
 */
export const matchMunicipality = (
  recordCity: string | undefined,
  targetMunicipalityId: string,
  municipalityOptions: Array<{ id: string; label: string }>
): boolean => {
  const normalizedCity = normalizeForFilter(recordCity)
  const normalizedTarget = normalizeForFilter(targetMunicipalityId)

  if (normalizedCity === normalizedTarget) return true

  const mun = municipalityOptions.find((m) => m.id === targetMunicipalityId)
  if (mun && normalizeForFilter(mun.label) === normalizedCity) return true

  return false
}
