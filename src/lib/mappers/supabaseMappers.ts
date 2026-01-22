// Funciones para mapear datos entre el modelo de la app y Supabase
import type { Distributor, Candidate, Visit } from '../types'

export function prepareDistributorForSupabase(distributor: Distributor) {
  const {
    priorityScore: __PRIORITY_SCORE,
    priorityLevel: __PRIORITY_LEVEL,
    priorityDrivers: __PRIORITY_DRIVERS,
    ...dbData
  } = distributor
  return {
    ...dbData,
    brands: JSON.stringify(dbData.brands || []),
    checklist: JSON.stringify(dbData.checklist || {}),
    category: JSON.stringify(dbData.category || {})
  }
}

export function processDistributorFromSupabase(
  dbData: Record<string, unknown>
): Distributor {
  type DBData = Omit<
    Distributor,
    | 'brands'
    | 'checklist'
    | 'category'
    | 'priorityScore'
    | 'priorityLevel'
    | 'priorityDrivers'
  > & {
    brands?: string | string[]
    checklist?: string | Record<string, unknown>
    category?: string | Record<string, unknown>
  }
  const safeData: DBData = dbData as DBData
  return {
    ...safeData,
    brands:
      typeof safeData.brands === 'string'
        ? JSON.parse(safeData.brands)
        : safeData.brands || [],
    checklist:
      typeof safeData.checklist === 'string'
        ? JSON.parse(safeData.checklist)
        : safeData.checklist || {},
    category:
      typeof safeData.category === 'string'
        ? JSON.parse(safeData.category)
        : safeData.category || {},
    priorityScore: 0,
    priorityLevel: 'medium',
    priorityDrivers: {
      traffic: 0,
      sales: 0,
      dataQuality: 0,
      salesLast90Days: 0,
      lastSaleDays: null,
      lastVisitDays: null,
      updatedAt: ''
    }
  }
}

export function prepareCandidateForSupabase(candidate: Candidate) {
  return {
    ...candidate,
    taxId: candidate.taxId || '',
    city: candidate.city || '',
    island: candidate.island || '',
    contact: candidate.contact || '',
    notes: candidate.notes || ''
  }
}

export function processCandidateFromSupabase(
  dbData: Record<string, unknown>
): Candidate {
  type DBCandidate = Omit<
    Candidate,
    'taxId' | 'city' | 'island' | 'contact' | 'notes'
  > & {
    taxId?: string
    city?: string
    island?: string
    contact?: string
    notes?: string
  }
  const safeData: DBCandidate = dbData as DBCandidate
  // Asegura que contact siempre sea un objeto Contact válido
  let contact: Candidate['contact'] = { name: '', phone: '', email: '' }
  if (typeof safeData.contact === 'object' && safeData.contact !== null) {
    const c: Partial<Candidate['contact']> =
      (safeData.contact as Partial<Candidate['contact']>) ?? {}
    contact = {
      name: typeof c.name === 'string' ? c.name : '',
      phone: typeof c.phone === 'string' ? c.phone : '',
      email: typeof c.email === 'string' ? c.email : ''
    }
  }
  return {
    ...safeData,
    taxId: safeData.taxId || '',
    city: safeData.city || '',
    island: safeData.island || '',
    contact,
    notes: safeData.notes || ''
  }
}

export function prepareVisitForSupabase(visit: Visit) {
  return {
    ...visit,
    reminder: JSON.stringify(visit.reminder || {})
  }
}

export function processVisitFromSupabase(
  dbData: Record<string, unknown>
): Visit {
  type DBVisit = Omit<Visit, 'reminder'> & {
    reminder?: string | Record<string, unknown>
  }
  const safeData: DBVisit = dbData as DBVisit
  return {
    ...safeData,
    reminder:
      typeof safeData.reminder === 'string'
        ? JSON.parse(safeData.reminder)
        : safeData.reminder || {}
  }
}
