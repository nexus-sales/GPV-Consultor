/**
 * Utilidades para el manejo de datos geográficos y normalización en filtros
 */

export const normalizeForFilter = (val?: string): string => {
  return (val || '').trim().toLowerCase();
};

/**
 * Interesa isla desde municipio u otras propiedades si no está definida
 */
export const matchIslandWithInference = (
  recordIsland: string | undefined,
  recordCity: string | undefined,
  targetIslandId: string,
  municipalityOptions: Array<{ id: string; label: string; islandId?: string }>
): boolean => {
  const normalizedTarget = normalizeForFilter(targetIslandId);
  
  // 1. Match directo si hay isla definida
  if (recordIsland && normalizeForFilter(recordIsland) === normalizedTarget) {
    return true;
  }

  // 2. Inferencia por municipio
  if (recordCity) {
    const mun = municipalityOptions.find(m => 
      normalizeForFilter(m.label) === normalizeForFilter(recordCity) || 
      normalizeForFilter(m.id) === normalizeForFilter(recordCity)
    );
    if (mun && mun.islandId && normalizeForFilter(mun.islandId) === normalizedTarget) {
      return true;
    }
  }

  return false;
};

/**
 * Match de municipio permitiendo búsqueda por ID o Etiqueta
 */
export const matchMunicipality = (
  recordCity: string | undefined,
  targetMunicipalityId: string,
  municipalityOptions: Array<{ id: string; label: string }>
): boolean => {
  const normalizedCity = normalizeForFilter(recordCity);
  const normalizedTarget = normalizeForFilter(targetMunicipalityId);

  if (normalizedCity === normalizedTarget) return true;

  const mun = municipalityOptions.find(m => m.id === targetMunicipalityId);
  if (mun && normalizeForFilter(mun.label) === normalizedCity) return true;

  return false;
};
