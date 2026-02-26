import type { Distributor } from '../types'

/**
 * Resultado de validación de acceso a marca
 */
export interface BrandValidationResult {
  allowed: boolean
  reason?: string
  severity?: 'error' | 'warning' | 'info'
}

/**
 * Valida si un distribuidor puede acceder a una marca específica
 *
 * Reglas implementadas:
 * 1. Lowi bloqueado si external_code = 'EXISTENTE_VF' (cliente con Vodafone activo)
 * 2. Marcas deben estar en brandPolicy.allowed si está definido
 * 3. Marcas no deben estar en brandPolicy.blocked
 */
export const validateBrandAccess = (
  distributor: Distributor,
  brandId: string
): BrandValidationResult => {
  // Regla 1: Bloqueo Lowi por external_code EXISTENTE_VF
  if (
    brandId === 'lowi' &&
    (distributor.externalCode === 'EXISTENTE_VF' ||
      distributor.code === 'EXISTENTE_VF')
  ) {
    return {
      allowed: false,
      reason: 'Cliente con activo Vodafone; Lowi no ofertable',
      severity: 'error'
    }
  }

  // Regla 2: Validar contra brandPolicy si existe
  const brandPolicy = distributor.brandPolicy

  if (brandPolicy?.blocked && brandPolicy.blocked.includes(brandId)) {
    return {
      allowed: false,
      reason:
        brandPolicy.messages?.[brandId] ||
        `${brandId} no disponible para este distribuidor`,
      severity: 'error'
    }
  }

  if (brandPolicy?.allowed && brandPolicy.allowed.length > 0) {
    if (!brandPolicy.allowed.includes(brandId)) {
      return {
        allowed: false,
        reason: `${brandId} no está habilitado para este distribuidor`,
        severity: 'error'
      }
    }
  }

  // Regla 3: Marcas condicionales (requieren validación adicional)
  if (brandPolicy?.conditional && brandPolicy.conditional.includes(brandId)) {
    return {
      allowed: true,
      reason:
        brandPolicy.messages?.[brandId] ||
        `${brandId} requiere autorización adicional`,
      severity: 'warning'
    }
  }

  return { allowed: true }
}

/**
 * Obtiene todas las marcas disponibles para un distribuidor
 */
export const getAvailableBrands = (
  distributor: Distributor,
  allBrands: Array<{ id: string; label: string }>
): Array<{ id: string; label: string; validation: BrandValidationResult }> => {
  return allBrands.map((brand) => ({
    ...brand,
    validation: validateBrandAccess(distributor, brand.id)
  }))
}

/**
 * Verifica si un distribuidor puede registrar ventas
 */
export const canRegisterSales = (
  distributor: Distributor
): BrandValidationResult => {
  const completion = distributor.completion ?? 0

  if (completion < 0.7) {
    return {
      allowed: false,
      reason: `Completitud insuficiente: ${Math.round(completion * 100)}%. Se requiere al menos 70% para registrar ventas.`,
      severity: 'error'
    }
  }

  return { allowed: true }
}
