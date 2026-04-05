/**
 * Helpers para pre-selección inteligente de marcas según canal y external_code
 */

export interface ChannelBrandDefaults {
  suggested: string[]
  description: string
  icon: string
}

/**
 * Defaults de marcas según canal
 *
 * - exclusive: Todas las marcas (distribuidor exclusivo)
 * - non_exclusive: Sin preselección (selección libre)
 * - d2d: Libre (door-to-door sin restricciones)
 */
export const CHANNEL_BRAND_DEFAULTS: Record<string, ChannelBrandDefaults> = {
  exclusive: {
    suggested: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'],
    description: 'Canal exclusivo: todas las marcas habilitadas',
    icon: '🔒'
  },
  non_exclusive: {
    suggested: [],
    description: 'Multi-marca: selección libre de marcas',
    icon: '🌐'
  },
  d2d: {
    suggested: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'],
    description: 'Door-to-door: todas las marcas',
    icon: '🚪'
  },
  collaborator: {
    suggested: [],
    description: 'Colaborador externo: selección libre',
    icon: '🤝'
  },
  commercial: {
    suggested: [],
    description: 'Comercial interno: selección libre',
    icon: '👤'
  }
}

/**
 * Detecta brandPolicy según external_code
 */
export const detectBrandPolicyByCode = (
  externalCode?: string
): {
  allowed?: string[]
  blocked?: string[]
  conditional?: string[]
  note?: string
} | null => {
  if (!externalCode) return null

  // ESPSB: Todas las marcas sin restricciones
  if (externalCode === 'ESPSB') {
    return {
      allowed: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'],
      blocked: [],
      conditional: [],
      note: 'Código especial sin bloqueos. Todas las marcas disponibles.'
    }
  }

  // LWMY: Lowi, Silbö y Vodafone (red completa)
  if (externalCode === 'LWMY') {
    return {
      allowed: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'],
      blocked: [],
      conditional: [],
      note: 'Red completa LWMY: Lowi, Silbö y Vodafone habilitados.'
    }
  }

  // EXISTENTE_VF: Lowi bloqueado (cliente con Vodafone activo)
  if (externalCode === 'EXISTENTE_VF') {
    return {
      allowed: ['silbo', 'vodafone_resid', 'vodafone_soho'],
      blocked: ['lowi'],
      conditional: [],
      note: 'Cliente con activo Vodafone: Lowi no ofertable.'
    }
  }

  // PVPTE: Pendiente de datos, requiere completitud
  if (externalCode === 'PVPTE') {
    return {
      allowed: ['silbo', 'lowi'],
      blocked: [],
      conditional: ['vodafone_resid', 'vodafone_soho'],
      note: 'Pendiente validar datos. Vodafone requiere autorización adicional.'
    }
  }

  return null
}

/**
 * Combina sugerencias de canal con restricciones de external_code
 */
export const getSuggestedBrands = (
  channelId?: string,
  externalCode?: string
): {
  brands: string[]
  reason: string
  source: 'channel' | 'external_code' | 'combined'
} => {
  const policyFromCode = detectBrandPolicyByCode(externalCode)
  const defaultsFromChannel = channelId
    ? CHANNEL_BRAND_DEFAULTS[channelId]
    : null

  // Si hay policy por external_code, tiene prioridad
  if (policyFromCode?.allowed && policyFromCode.allowed.length > 0) {
    return {
      brands: policyFromCode.allowed,
      reason: policyFromCode.note || `Según código externo: ${externalCode}`,
      source: 'external_code'
    }
  }

  // Si no, usar defaults del canal
  if (defaultsFromChannel) {
    return {
      brands: defaultsFromChannel.suggested,
      reason: `${defaultsFromChannel.icon} ${defaultsFromChannel.description}`,
      source: 'channel'
    }
  }

  // Fallback: sin preselección
  return {
    brands: [],
    reason: 'Sin configuración específica para este canal',
    source: 'combined'
  }
}

/**
 * Valida si las marcas seleccionadas son coherentes con el canal
 */
export const validateBrandChannelCoherence = (
  selectedBrands: string[],
  channelId: string
): {
  valid: boolean
  warnings: string[]
} => {
  const warnings: string[] = []
  const defaults = CHANNEL_BRAND_DEFAULTS[channelId]

  if (!defaults) {
    return { valid: true, warnings: [] }
  }

  // Canal exclusivo: recomendar todas las marcas pero permitir desmarcar
  if (channelId === 'exclusive') {
    const recommendedBrands = [
      'silbo',
      'lowi',
      'vodafone_resid',
      'vodafone_soho'
    ]
    const missingRecommended = recommendedBrands.filter(
      (b) => !selectedBrands.includes(b)
    )
    if (missingRecommended.length > 0) {
      warnings.push(
        `Canal exclusivo: Marcas recomendadas no seleccionadas: ${missingRecommended.join(', ')}`
      )
    }
  }

  if (channelId === 'non_exclusive' && selectedBrands.length > 1) {
    warnings.push(
      'Multi-marca: Solicita upgrade a tienda exclusiva para más marcas'
    )
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}
