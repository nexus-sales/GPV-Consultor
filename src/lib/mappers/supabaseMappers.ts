// Funciones para mapear datos entre el modelo de la app y Supabase
import type { Distributor, Candidate, Visit, Sale } from '../types'

/**
 * Mapea un objeto de la App a un registro de Supabase.
 * IMPORTANTE: El schema de Supabase usa camelCase (con comillas en PostgreSQL),
 * por lo que NO convertimos a snake_case. Solo limpiamos campos que no deben guardarse.
 */
export function mapToSupabase(
  data: object,
  table: string
): Record<string, unknown> {
  if (!data) return data as Record<string, unknown>

  const mapped: Record<string, unknown> = {
    ...(data as Record<string, unknown>)
  }

  // Mapeos específicos por tabla - solo limpieza, NO conversión de nombres
  switch (table) {
    case 'candidates':
    case 'candidatesGPV':
      // Limpiar objetos relacionales que no son columnas directas
      // 'category' es JSONB, se puede guardar
      break

    case 'visits':
    case 'visitsGPV':
      // La DB usa 'date' y 'type' directamente (camelCase), no necesita conversión
      // 'reminder' es JSONB, se puede guardar
      break

    case 'sales':
    case 'salesGPV':
      // La DB usa 'distributorId', 'sectorId', 'operations', 'date' directamente
      break

    case 'distributors':
    case 'distributorsGPV':
      // La DB usa camelCase: contactPerson, channelType, postalCode, etc.
      // 'category', 'checklist', 'brandPolicy', 'priorityDrivers' son JSONB
      break

    case 'commissionAgreements':
    case 'commissionAgreementsGPV':
      // La DB usa camelCase para los campos de acuerdo de comisiones
      break

    case 'leads':
      // La tabla leads usa snake_case para timestamps
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break
  }

  // Limpieza global de valores problemáticos
  Object.keys(mapped).forEach((key) => {
    // Eliminar undefined
    if (mapped[key] === undefined) delete mapped[key]
    // Eliminar funciones y símbolos
    if (typeof mapped[key] === 'function') delete mapped[key]
    if (typeof mapped[key] === 'symbol') delete mapped[key]
  })

  return mapped
}

export function prepareDistributorForSupabase(distributor: Distributor) {
  return mapToSupabase(distributor, 'distributorsGPV')
}

export function prepareCandidateForSupabase(candidate: Candidate) {
  return mapToSupabase(candidate, 'candidatesGPV')
}

export function prepareVisitForSupabase(visit: Visit) {
  return mapToSupabase(visit, 'visitsGPV')
}

export function prepareSaleForSupabase(sale: Sale) {
  return mapToSupabase(sale, 'salesGPV')
}

export function processCandidateFromSupabase(
  dbData: Record<string, unknown>
): Candidate {
  // El normalizador ya maneja la conversión de snake_case a camelCase al leer
  return dbData as unknown as Candidate
}

export function processVisitFromSupabase(
  dbData: Record<string, unknown>
): Visit {
  return dbData as unknown as Visit
}

export function processDistributorFromSupabase(
  dbData: Record<string, unknown>
): Distributor {
  return dbData as unknown as Distributor
}
