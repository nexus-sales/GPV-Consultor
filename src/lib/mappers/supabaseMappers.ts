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
      // Mapear alias de caché de coordenadas si existen
      if (mapped.latitude !== undefined) mapped.latitude = mapped.latitude
      if (mapped.longitude !== undefined) mapped.longitude = mapped.longitude
      // Aseguramos que el historial de notas sea un objeto (array) para Supabase (jsonb)
      if (mapped.notesHistory && typeof mapped.notesHistory === 'string') {
        try {
          mapped.notesHistory = JSON.parse(mapped.notesHistory)
        } catch {
          mapped.notesHistory = []
        }
      }
      // candidatesGPV usa snake_case para timestamps (igual que leads)
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break

    case 'visits':
    case 'visitsGPV':
      // La DB usa 'date' y 'type' directamente (camelCase), no necesita conversión
      // 'reminder' es JSONB, se puede guardar
      // Los timestamps usan snake_case (createdAt→created_at, updatedAt→updated_at)
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break

    case 'sales':
    case 'salesGPV':
      // La DB usa 'distributorId', 'sectorId', 'operations', 'date' directamente
      // Los timestamps se alinean a snake_case igual que las otras tablas GPV
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break

    case 'distributors':
    case 'distributorsGPV':
      // Mapear alias de caché de coordenadas si existen
      if (mapped.latitude !== undefined) mapped.latitude = mapped.latitude
      if (mapped.longitude !== undefined) mapped.longitude = mapped.longitude
      // Aseguramos que el historial de notas sea un objeto (array) para Supabase (jsonb)
      if (mapped.notesHistory && typeof mapped.notesHistory === 'string') {
        try {
          mapped.notesHistory = JSON.parse(mapped.notesHistory)
        } catch {
          mapped.notesHistory = []
        }
      }
      // distributorsGPV usa snake_case para timestamps (igual que las otras tablas GPV)
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break

    case 'commissionAgreements':
    case 'commissionAgreementsGPV':
      // La DB usa camelCase para los campos de acuerdo de comisiones
      // Solo los timestamps usan snake_case (igual que leads, candidatesGPV, tasksGPV)
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break
    case 'tasks':
    case 'tasksGPV':
      // La DB usa camelCase: dueDate, entityId, entityType, creatorId, etc.
      // Solo los timestamps usan snake_case (igual que leads y candidatesGPV)
      if ('createdAt' in mapped) {
        mapped.created_at = mapped.createdAt
        delete mapped.createdAt
      }
      if ('updatedAt' in mapped) {
        mapped.updated_at = mapped.updatedAt
        delete mapped.updatedAt
      }
      break

    case 'leads':
    case 'leadsGPV':
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

    case 'backofficeContacts':
    case 'backofficeContactsGPV':
      // La tabla usa camelCase nativo para la mayoría de campos
      if (mapped.historialComentarios && typeof mapped.historialComentarios === 'string') {
        try {
          mapped.historialComentarios = JSON.parse(mapped.historialComentarios)
        } catch {
          mapped.historialComentarios = []
        }
      }
      // backofficeContactsGPV usa snake_case para timestamps (igual que las otras tablas GPV)
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

export function prepareTaskForSupabase(task: object) {
  return mapToSupabase(task, 'tasksGPV')
}
