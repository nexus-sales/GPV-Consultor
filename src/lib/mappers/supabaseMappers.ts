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
      break

    case 'commissionAgreements':
    case 'commissionAgreementsGPV':
      // La DB usa camelCase para los campos de acuerdo de comisiones
      break
    case 'tasks':
    case 'tasksGPV':
      // La DB usa camelCase: dueDate, entityId, entityType, creatorId, etc.
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

    case 'backofficeContacts':
    case 'backofficeContactsGPV':
      // La tabla usa camelCase nativo, no necesita conversión
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
