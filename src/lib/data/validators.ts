/**
 * Validadores y normalizadores de datos
 *
 * Funciones para limpiar, normalizar y validar datos de entrada
 * comunes en formularios (teléfonos, CIF/NIF, provincias, códigos postales, etc.)
 */

// ============================================================================
// TELÉFONOS
// ============================================================================

/**
 * Normaliza un número de teléfono a formato internacional +34
 *
 * Ejemplos:
 * - "666123456" → "+34666123456"
 * - "666 12 34 56" → "+34666123456"
 * - "+34 666 123 456" → "+34666123456"
 * - "0034666123456" → "+34666123456"
 */
export const normalizePhone = (value: string): string => {
  if (!value) return ''

  // Eliminar espacios, guiones, paréntesis
  let clean = value.replace(/[\s\-()]/g, '')

  // Reemplazar 0034 por +34
  clean = clean.replace(/^0034/, '+34')

  // Si empieza con 34 (sin +), añadir el +
  if (clean.match(/^34\d{9}$/)) {
    clean = '+' + clean
  }

  // Si empieza con 6, 7, 8 o 9 y tiene 9 dígitos, añadir +34
  if (clean.match(/^[6789]\d{8}$/)) {
    clean = '+34' + clean
  }

  return clean
}

/**
 * Valida si un teléfono español es válido
 *
 * Acepta móviles (6xx, 7xx) y fijos (8xx, 9xx) de 9 dígitos
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false

  const normalized = normalizePhone(phone)

  // Formato: +34 seguido de 9 dígitos que empiezan por 6, 7, 8 o 9
  return /^\+34[6789]\d{8}$/.test(normalized)
}

/**
 * Formatea un teléfono para mostrar (con espacios)
 *
 * Ejemplos:
 * - "+34666123456" → "+34 666 12 34 56"
 */
export const formatPhone = (phone: string): string => {
  const normalized = normalizePhone(phone)

  if (!normalized.startsWith('+34')) return normalized

  const digits = normalized.slice(3) // Quitar +34

  if (digits.length !== 9) return normalized

  // Formato: +34 666 12 34 56
  return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
}

// ============================================================================
// CIF / NIF / NIE
// ============================================================================

/**
 * Normaliza un CIF/NIF/NIE a formato estándar (mayúsculas, sin espacios/guiones)
 */
export const normalizeTaxId = (value: string): string => {
  if (!value) return ''

  return value.toUpperCase().replace(/[\s\-\.]/g, '')
}

/**
 * Valida un CIF español
 *
 * Formato: Letra (A-Z) + 8 dígitos (último puede ser letra)
 *
 * @see https://es.wikipedia.org/wiki/C%C3%B3digo_de_identificaci%C3%B3n_fiscal
 */
export const validateCIF = (cif: string): boolean => {
  if (!cif) return false

  const normalized = normalizeTaxId(cif)

  // Formato básico: Letra + 7 dígitos + dígito/letra de control
  if (!/^[A-Z]\d{7}[A-Z0-9]$/.test(normalized)) {
    return false
  }

  const letter = normalized[0]
  const numbers = normalized.slice(1, 8)
  const control = normalized[8]

  // Tipos válidos de CIF según primera letra
  const validTypes = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'J',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'U',
    'V',
    'W'
  ]
  if (!validTypes.includes(letter)) {
    return false
  }

  // Calcular dígito de control
  let sum = 0

  for (let i = 0; i < 7; i++) {
    const digit = parseInt(numbers[i], 10)

    if (i % 2 === 0) {
      // Posiciones pares (0, 2, 4, 6): multiplicar por 2 y sumar dígitos
      const doubled = digit * 2
      sum += Math.floor(doubled / 10) + (doubled % 10)
    } else {
      // Posiciones impares (1, 3, 5): sumar directamente
      sum += digit
    }
  }

  const unitDigit = sum % 10
  const expectedDigit = unitDigit === 0 ? 0 : 10 - unitDigit

  // Algunas organizaciones usan letra, otras número
  const controlLetters = 'JABCDEFGHI'
  const expectedLetter = controlLetters[expectedDigit]

  return control === expectedDigit.toString() || control === expectedLetter
}

/**
 * Valida un NIF español
 *
 * Formato: 8 dígitos + letra de control
 */
export const validateNIF = (nif: string): boolean => {
  if (!nif) return false

  const normalized = normalizeTaxId(nif)

  // Formato: 8 dígitos + letra
  if (!/^\d{8}[A-Z]$/.test(normalized)) {
    return false
  }

  const numbers = normalized.slice(0, 8)
  const letter = normalized[8]

  const controlLetters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const expectedLetter = controlLetters[parseInt(numbers, 10) % 23]

  return letter === expectedLetter
}

/**
 * Valida un NIE español
 *
 * Formato: X/Y/Z + 7 dígitos + letra de control
 */
export const validateNIE = (nie: string): boolean => {
  if (!nie) return false

  const normalized = normalizeTaxId(nie)

  // Formato: X/Y/Z + 7 dígitos + letra
  if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
    return false
  }

  // Reemplazar X→0, Y→1, Z→2 y validar como NIF
  const asNIF = normalized.replace(/^[XYZ]/, (match) => {
    return { X: '0', Y: '1', Z: '2' }[match] || '0'
  })

  return validateNIF(asNIF)
}

/**
 * Valida cualquier identificador fiscal español (CIF, NIF o NIE)
 */
export const validateTaxId = (
  taxId: string
): { valid: boolean; type?: 'CIF' | 'NIF' | 'NIE'; message?: string } => {
  if (!taxId) {
    return { valid: false, message: 'Identificador vacío' }
  }

  const normalized = normalizeTaxId(taxId)

  if (normalized.length < 9) {
    return { valid: false, message: 'Debe tener al menos 9 caracteres' }
  }

  // Detectar tipo y validar
  if (/^[A-Z]\d{7}[A-Z0-9]$/.test(normalized)) {
    if (validateCIF(normalized)) {
      return { valid: true, type: 'CIF' }
    }
    return {
      valid: false,
      type: 'CIF',
      message: 'CIF inválido (dígito de control incorrecto)'
    }
  }

  if (/^\d{8}[A-Z]$/.test(normalized)) {
    if (validateNIF(normalized)) {
      return { valid: true, type: 'NIF' }
    }
    return {
      valid: false,
      type: 'NIF',
      message: 'NIF inválido (letra de control incorrecta)'
    }
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
    if (validateNIE(normalized)) {
      return { valid: true, type: 'NIE' }
    }
    return {
      valid: false,
      type: 'NIE',
      message: 'NIE inválido (letra de control incorrecta)'
    }
  }

  return {
    valid: false,
    message: 'Formato no reconocido (debe ser CIF, NIF o NIE)'
  }
}

// ============================================================================
// PROVINCIAS
// ============================================================================

/**
 * Mapa de variaciones comunes de nombres de provincias a nombres oficiales
 */
const PROVINCE_VARIATIONS: Record<string, string> = {
  // Canarias
  'gran canaria': 'Las Palmas',
  'las palmas de gran canaria': 'Las Palmas',
  tenerife: 'Santa Cruz de Tenerife',
  'santa cruz': 'Santa Cruz de Tenerife',
  'sc tenerife': 'Santa Cruz de Tenerife',
  lanzarote: 'Las Palmas',
  fuerteventura: 'Las Palmas',
  'la palma': 'Santa Cruz de Tenerife',
  'la gomera': 'Santa Cruz de Tenerife',
  'el hierro': 'Santa Cruz de Tenerife',

  // Otras variaciones comunes
  alicante: 'Alicante/Alacant',
  castellon: 'Castellón/Castelló',
  valencia: 'Valencia/València',
  'la coruña': 'A Coruña',
  coruna: 'A Coruña',
  pontevedra: 'Pontevedra',
  orense: 'Ourense',
  guipuzcoa: 'Gipuzkoa',
  guipúzcoa: 'Gipuzkoa',
  vizcaya: 'Bizkaia',
  lerida: 'Lleida',
  gerona: 'Girona'
}

/**
 * Lista de provincias españolas oficiales
 */
export const SPANISH_PROVINCES = [
  'A Coruña',
  'Álava',
  'Albacete',
  'Alicante/Alacant',
  'Almería',
  'Asturias',
  'Ávila',
  'Badajoz',
  'Balears, Illes',
  'Barcelona',
  'Bizkaia',
  'Burgos',
  'Cáceres',
  'Cádiz',
  'Cantabria',
  'Castellón/Castelló',
  'Ceuta',
  'Ciudad Real',
  'Córdoba',
  'Cuenca',
  'Gipuzkoa',
  'Girona',
  'Granada',
  'Guadalajara',
  'Huelva',
  'Huesca',
  'Jaén',
  'La Rioja',
  'Las Palmas',
  'León',
  'Lleida',
  'Lugo',
  'Madrid',
  'Málaga',
  'Melilla',
  'Murcia',
  'Navarra',
  'Ourense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Santa Cruz de Tenerife',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia/València',
  'Valladolid',
  'Zamora',
  'Zaragoza'
]

/**
 * Normaliza un nombre de provincia a su forma oficial
 *
 * Ejemplos:
 * - "gran canaria" → "Las Palmas"
 * - "tenerife" → "Santa Cruz de Tenerife"
 * - "la coruña" → "A Coruña"
 */
export const normalizeProvince = (value: string): string => {
  if (!value) return ''

  const normalized = value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos para comparación

  // Buscar en variaciones
  const variant = Object.keys(PROVINCE_VARIATIONS).find((key) => {
    const keyNormalized = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return keyNormalized === normalized
  })

  if (variant) {
    return PROVINCE_VARIATIONS[variant]
  }

  // Buscar coincidencia directa (case-insensitive)
  const direct = SPANISH_PROVINCES.find((prov) => {
    const provNormalized = prov
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return provNormalized === normalized
  })

  return direct || value // Si no se encuentra, devolver el valor original
}

/**
 * Valida si una provincia es válida
 */
export const validateProvince = (province: string): boolean => {
  if (!province) return false

  const normalized = normalizeProvince(province)
  return SPANISH_PROVINCES.includes(normalized)
}

// ============================================================================
// CÓDIGOS POSTALES
// ============================================================================

/**
 * Normaliza un código postal español (5 dígitos)
 */
export const normalizePostalCode = (value: string): string => {
  if (!value) return ''

  // Eliminar espacios y mantener solo dígitos
  const digits = value.replace(/\D/g, '')

  // Rellenar con ceros a la izquierda si es necesario
  return digits.padStart(5, '0').slice(0, 5)
}

/**
 * Valida un código postal español
 *
 * Debe ser 5 dígitos entre 01000 y 52999
 */
export const validatePostalCode = (postalCode: string): boolean => {
  if (!postalCode) return false

  const normalized = normalizePostalCode(postalCode)

  if (!/^\d{5}$/.test(normalized)) {
    return false
  }

  const num = parseInt(normalized, 10)
  return num >= 1000 && num <= 52999
}

/**
 * Obtiene la provincia de un código postal
 */
export const getProvinceFromPostalCode = (
  postalCode: string
): string | null => {
  const normalized = normalizePostalCode(postalCode)

  if (!validatePostalCode(normalized)) {
    return null
  }

  const provinceCode = parseInt(normalized.slice(0, 2), 10)

  const provinceMap: Record<number, string> = {
    1: 'Álava',
    2: 'Albacete',
    3: 'Alicante/Alacant',
    4: 'Almería',
    5: 'Ávila',
    6: 'Badajoz',
    7: 'Balears, Illes',
    8: 'Barcelona',
    9: 'Burgos',
    10: 'Cáceres',
    11: 'Cádiz',
    12: 'Castellón/Castelló',
    13: 'Ciudad Real',
    14: 'Córdoba',
    15: 'A Coruña',
    16: 'Cuenca',
    17: 'Girona',
    18: 'Granada',
    19: 'Guadalajara',
    20: 'Gipuzkoa',
    21: 'Huelva',
    22: 'Huesca',
    23: 'Jaén',
    24: 'León',
    25: 'Lleida',
    26: 'La Rioja',
    27: 'Lugo',
    28: 'Madrid',
    29: 'Málaga',
    30: 'Murcia',
    31: 'Navarra',
    32: 'Ourense',
    33: 'Asturias',
    34: 'Palencia',
    35: 'Las Palmas',
    36: 'Pontevedra',
    37: 'Salamanca',
    38: 'Santa Cruz de Tenerife',
    39: 'Cantabria',
    40: 'Segovia',
    41: 'Sevilla',
    42: 'Soria',
    43: 'Tarragona',
    44: 'Teruel',
    45: 'Toledo',
    46: 'Valencia/València',
    47: 'Valladolid',
    48: 'Bizkaia',
    49: 'Zamora',
    50: 'Zaragoza',
    51: 'Ceuta',
    52: 'Melilla'
  }

  return provinceMap[provinceCode] || null
}

// ============================================================================
// EMAIL
// ============================================================================

/**
 * Normaliza un email (lowercase, trim)
 */
export const normalizeEmail = (value: string): string => {
  if (!value) return ''

  return value.toLowerCase().trim()
}

/**
 * Valida un email con regex básico
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false

  const normalized = normalizeEmail(email)

  // Regex básico pero efectivo
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}
