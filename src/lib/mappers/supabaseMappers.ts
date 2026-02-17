// Funciones para mapear datos entre el modelo de la app y Supabase
import type { Distributor, Candidate, Visit, Sale } from '../types'

/**
 * Mapea un objeto de la App a un registro de Supabase.
 * IMPORTANTE: El schema de Supabase usa camelCase (con comillas en PostgreSQL),
 * por lo que NO convertimos a snake_case. Solo limpiamos campos que no deben guardarse.
 */
export function mapToSupabase(data: any, table: string) {
  if (!data) return data

  const mapped: any = { ...data }

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
  }

  // Limpieza global de valores problemáticos
  Object.keys(mapped).forEach(key => {
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

export function processCandidateFromSupabase(dbData: any): Candidate {
  // El normalizador ya maneja la conversión de snake_case a camelCase al leer
  return dbData as Candidate
}

export function processVisitFromSupabase(dbData: any): Visit {
  return dbData as Visit
}

export function processDistributorFromSupabase(dbData: any): Distributor {
  return dbData as Distributor
}
