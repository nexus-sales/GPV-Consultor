// Funciones para mapear datos entre el modelo de la app y Supabase
import type { Distributor, Candidate, Visit, Sale } from '../types'

/**
 * Mapea un objeto de la App (camelCase) a un registro de Supabase (snake_case)
 */
export function mapToSupabase(data: any, table: string) {
  if (!data) return data

  const mapped: any = { ...data }

  // Mapeos comunes
  if (mapped.createdAt) {
    mapped.created_at = mapped.createdAt
    delete mapped.createdAt
  }
  if (mapped.updatedAt) {
    mapped.updated_at = mapped.updatedAt
    delete mapped.updatedAt
  }

  // Mapeos específicos por tabla
  switch (table) {
    case 'candidates':
    case 'candidatesGPV':
      if (mapped.channelCode) {
        mapped.channel_code = mapped.channelCode
        delete mapped.channelCode
      }
      if (mapped.pendingData !== undefined) {
        mapped.pending_data = mapped.pendingData
        delete mapped.pendingData
      }
      if (mapped.brandPolicy) {
        mapped.brand_policy = mapped.brandPolicy
        delete mapped.brandPolicy
      }
      if (mapped.categoryId) {
        mapped.category_id = mapped.categoryId
        delete mapped.categoryId
      }
      // Limpiar objetos relacionales que no son columnas
      if (mapped.category) delete mapped.category

      // Asegurar request correcta para contact en JSON
      if (mapped.contact) {
        // En supabase si la columna es jsonb, pasamos objeto literal
        // si es text, pasamos string. Asumimos jsonb por defecto para objetos complejos en nuevas tablas
      }
      break

    case 'visits':
    case 'visitsGPV':
      if (mapped.distributorId) {
        mapped.distributor_id = mapped.distributorId
        delete mapped.distributorId
      }
      if (mapped.candidateId) {
        mapped.candidate_id = mapped.candidateId
        delete mapped.candidateId
      }
      if (mapped.durationMinutes) {
        mapped.duracion_min = mapped.durationMinutes
        delete mapped.durationMinutes
      }
      // Mapeo crítico para fechas de visitas
      if (mapped.date && !mapped.visit_date) {
        mapped.visit_date = mapped.date
        delete mapped.date
      }
      if (mapped.type) {
        mapped.visit_type = mapped.type
        // Mantener también 'type' si el backend lo usa, o borrar si da error.
        // Por seguridad en migraciones:
        delete mapped.type
      }
      break

    case 'sales':
    case 'salesGPV':
      if (mapped.distributorId) {
        mapped.distributor_id = mapped.distributorId
        delete mapped.distributorId
      }
      if (mapped.sectorId) {
        mapped.sector_id = mapped.sectorId
        delete mapped.sectorId
      }
      if (mapped.operations) {
        mapped.operaciones = mapped.operations
        delete mapped.operations
      }
      // Mapeo crítico para fechas de ventas
      if (mapped.date && !mapped.sale_date) {
        mapped.sale_date = mapped.date
        delete mapped.date
      }
      break

    case 'distributors':
    case 'distributorsGPV':
      if (mapped.contactPerson) {
        mapped.contact_person = mapped.contactPerson
        delete mapped.contactPerson
      }
      if (mapped.contactPersonBackup) {
        mapped.contact_person_backup = mapped.contactPersonBackup
        delete mapped.contactPersonBackup
      }
      if (mapped.channelType) {
        mapped.channel_type = mapped.channelType
        delete mapped.channelType
      }

      // Limpiar objetos complejos que se mapearon a columnas FK
      if (mapped.categoryId) {
        mapped.category_id = mapped.categoryId
        delete mapped.categoryId
      }
      if (mapped.category) delete mapped.category

      // Campos virtuales o calculados
      if (mapped.checklistComplete !== undefined) delete mapped.checklistComplete
      if (mapped.fiscalName) {
        mapped.fiscal_name = mapped.fiscalName
        delete mapped.fiscalName
      }
      if (mapped.fiscalAddress) {
        mapped.fiscal_address = mapped.fiscalAddress
        delete mapped.fiscalAddress
      }
      if (mapped.postalCode) {
        mapped.postal_code = mapped.postalCode
        delete mapped.postalCode
      }
      if (mapped.brands) {
        // Si brands es array y DB espera text[], ok. Si espera jsonb...
        // La mayoría de las veces Supabase maneja arrays nativos de PG bien.
      }
      // Brand Policy y otros
      if (mapped.brandPolicy) {
        mapped.brand_policy = mapped.brandPolicy
        delete mapped.brandPolicy
      }

      // Limpiar datos calculados/complejos
      // 'completion' es calculado? Si está en DB, dejarlo.
      // 'checklist' podría ser JSONB column
      // 'priorityDrivers' -> priority_drivers JSONB? Asumimos que sí, mapToSupabase lo deja
      // Pero 'priorityDrivers' en types es PriorityDrivers, en DB snake_case `priority_drivers`?
      if (mapped.priorityDrivers) {
        mapped.priority_drivers = mapped.priorityDrivers
        delete mapped.priorityDrivers
      }

      // 'sectors'? Supabase text[] ok, pero si es jsonb... default OK
      break
  }

  // Limpieza global de objetos 'undefined' o 'function'
  Object.keys(mapped).forEach(key => {
    if (mapped[key] === undefined) delete mapped[key];
    // Evitarfunciones, símbolos
    if (typeof mapped[key] === 'function') delete mapped[key];
  });

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
