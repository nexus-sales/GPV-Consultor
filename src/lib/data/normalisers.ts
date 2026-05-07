import type {
  Candidate,
  Checklist,
  Distributor,
  DistributorStatus,
  Lead,
  Preferences,
  PriorityDrivers,
  PriorityLevel,
  Sale,
  SaleSector,
  SaleStatus,
  User,
  Visit,
  VisitReminder,
  CommissionHistoryEntry
} from '../types'
import { pipelineStages, brandOptions, type ChannelType } from './config'
import { DEFAULT_PREFERENCES } from './defaults'
import {
  getInitials,
  generateId,
  normaliseDate,
  sanitisePhone
} from './helpers'
import { resolveCategory, deriveBrandsForChannel } from './taxonomy'
import {
  resolveReminderWithDefaults,
  shiftReminderForVisitDate
} from './reminders'
import {
  emailPattern,
  spanishMobilePattern,
  postalCodePattern,
  taxIdPattern
} from './patterns'

type UnknownRecord = Record<string, unknown>

function safeParseJSON<T>(value: unknown, defaultValue: T): T {
  if (!value) return defaultValue
  if (typeof value === 'object') return value as T
  if (typeof value !== 'string') return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

export type RawDistributor = UnknownRecord & {
  id?: string
  code?: string
  external_code?: string
  nombre_pdv?: string
  name?: string
  contactPerson?: string
  contact_person?: string
  responsable?: string
  contact_name?: string
  contactPersonBackup?: string
  contact_person_backup?: string
  responsableSecundario?: string
  responsable_backup?: string
  provincia?: string
  province?: string
  poblacion?: string
  city?: string
  postalCode?: string
  postal_code?: string
  cp?: string
  email?: string
  telefono?: string
  phone?: string
  brands?: string[]
  brands_enabled?: string[]
  channel_type?: string
  channelType?: ChannelType
  taxId?: string
  tax_id?: string
  cif?: string
  fiscalName?: string
  fiscal_name?: string
  razonSocial?: string
  fiscalAddress?: string
  fiscal_address?: string
  direccionFiscal?: string
  operational_status?: string
  status?: string
  pendingData?: boolean
  pending_data?: boolean
  completion?: number
  salesYtd?: number
  sales_ytd?: number
  sales?: number
  fecha_alta?: string
  created_at?: string
  createdAt?: string
  notes?: string
  upgradeRequested?: boolean
  upgrade_requested?: boolean
  priorityScore?: number
  priority_score?: number
  priorityLevel?: PriorityLevel
  priority_level?: PriorityLevel
  priorityDrivers?: Partial<PriorityDrivers>
  priority_drivers?: Partial<PriorityDrivers>
}

export type DistributorInput = RawDistributor | Distributor

export type RawCandidate = UnknownRecord & {
  id?: string
  nombre?: string
  name?: string
  poblacion?: string
  city?: string
  island?: string
  isla?: string
  provincia?: string
  province?: string
  postalCode?: string
  postal_code?: string
  cp?: string
  taxId?: string
  tax_id?: string
  address?: string
  direccion?: string
  channelCode?: string
  channel_code?: string
  propuesta_nomenclatura?: string
  category_id?: string
  categoryId?: string
  stage?: string
  source?: string
  notes?: string
  notes_history?: unknown
  notesHistory?: unknown
  lastContactAt?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  operator?: string
  gpvProposal?: boolean
  gpv_proposal?: boolean
  position?: number
  pendingData?: boolean
  pending_data?: boolean
  contacto?: {
    nombre?: string
    name?: string
    movil?: string
    phone?: string
    email?: string
  }
  contact?: {
    name?: string
    phone?: string
    email?: string
  }
}

export type CandidateInput = RawCandidate | Candidate

export type RawVisit = UnknownRecord & {
  id?: string
  distributor_id?: string
  distributorId?: string
  candidate_id?: string
  candidateId?: string
  visit_date?: string
  date?: string
  scheduled_time?: string
  scheduledTime?: string
  visit_type?: string
  type?: string
  objetivo?: string
  objective?: string
  resumen?: string
  summary?: string
  proximos_pasos?: string
  nextSteps?: string
  resultado?: string
  result?: string
  duracion_min?: number
  durationMinutes?: number
  reminder?: Partial<VisitReminder>
  reminder_minutes?: number
  reminderMinutes?: number
  reminder_channel?: string
  reminder_enabled?: boolean
}

export type VisitInput = RawVisit | Visit

export type RawSale = UnknownRecord & {
  id?: string
  distributor_id?: string
  distributorId?: string
  distributorCode?: string
  distributorName?: string
  sale_date?: string
  fechaCierre?: string
  fechaOferta?: string
  fechaActivacion?: string
  fechaBaja?: string
  date?: string
  brand?: string
  sector?: string
  sectorId?: string
  family?: string
  operaciones?: number
  operations?: number
  status?: string
  notes?: string
  observaciones?: string
  modo?: string
  tipoDocumento?: string
  nombreCliente?: string
  documento?: string
  createdAt?: string
  updatedAt?: string
}

export type SaleInput = RawSale | Sale

export type RawLead = UnknownRecord & {
  id?: string
  fuente?: string
  nombre?: string
  name?: string
  telefono?: string
  phone?: string
  email?: string
  web?: string
  website?: string
  direccion?: string
  address?: string
  ciudad?: string
  city?: string
  poblacion?: string
  provincia?: string
  province?: string
  island?: string
  isla?: string
  sector?: string
  rating?: number
  reviews_count?: number
  place_id?: string
  estado?: string
  notas?: string
  notes?: string
  asignado_a?: string
  converted_at?: string
  convertedAt?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

export type LeadInput = RawLead | Lead

export type RawUser = UnknownRecord & {
  id?: string
  fullName?: string
  name?: string
  email?: string
  mail?: string
  role?: string
  position?: string
  region?: string
  zone?: string
  permissions?: string
  permission?: string
  phone?: string
  mobile?: string
  avatarInitials?: string
  lastLogin?: string
  last_login?: string
  createdAt?: string
  created_at?: string
  activity?: Array<UnknownRecord>
}

export type UserInput = RawUser | User | null | undefined

export type RawPreferences = UnknownRecord & {
  privacyEmail?: string
  privacy_email?: string
  allowDataExports?: boolean
  allow_data_exports?: boolean
}

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value == null) return ''
  return String(value).trim()
}

export type PreferencesInput = RawPreferences | Preferences | null | undefined

export const evaluateDistributorChecklist = (
  candidate: unknown = {}
): Checklist => {
  const source = (candidate ?? {}) as UnknownRecord
  const taxId = toStringValue(source.taxId ?? source.cif).toUpperCase()
  const fiscalName = toStringValue(source.fiscalName ?? source.razonSocial)
  const fiscalAddress = toStringValue(
    source.fiscalAddress ?? source.direccionFiscal
  )
  const email = toStringValue(source.email)
  const phone = sanitisePhone(toStringValue(source.phone))
  const postalCode = toStringValue(source.postalCode)

  return {
    taxId: taxIdPattern.test(taxId),
    fiscalName: Boolean(fiscalName),
    fiscalAddress: Boolean(fiscalAddress),
    email: emailPattern.test(email),
    phone: spanishMobilePattern.test(phone),
    postalCode: postalCodePattern.test(postalCode)
  }
}

export const computeDistributorCompletion = (
  candidate: UnknownRecord = {},
  checklist: Checklist = evaluateDistributorChecklist(candidate)
): number => {
  const checks = [
    Boolean(toStringValue(candidate.name)),
    Boolean(toStringValue(candidate.contactPerson)),
    Boolean(toStringValue(candidate.province)),
    Boolean(toStringValue(candidate.city)),
    checklist.taxId,
    checklist.email,
    checklist.phone,
    checklist.fiscalAddress,
    Array.isArray(candidate.brands) ? candidate.brands.length > 0 : false,
    candidate.status === 'active'
  ]

  const total = checks.length || 1
  const fulfilled = checks.filter(Boolean).length
  return Math.min(1, Math.max(0, Number((fulfilled / total).toFixed(2))))
}

import type { Activity } from '../types'

export const normaliseActivityLog = (
  items: Array<UnknownRecord> = []
): Activity[] =>
  items.filter(Boolean).map((activity, index) => ({
    id: toStringValue(activity.id) || generateId(`activity-${index}`),
    type: (activity.type as Activity['type']) || 'information',
    title: toStringValue(activity.title) || 'Actividad registrada',
    description: toStringValue(activity.detail) || '',
    timestamp: toStringValue(activity.timestamp) || new Date().toISOString(),
    priority: (activity.priority as Activity['priority']) || 'medium',
    metadata: (activity.metadata as Record<string, string | number>) || {}
  }))

export const normaliseUser = (user: UserInput): User | null => {
  if (!user) return null

  const source = user as RawUser

  const fullName = toStringValue(source.fullName ?? source.name)
  const email = (toStringValue(source.email ?? source.mail) || '').toLowerCase()
  const rawRole = toStringValue(source.role ?? source.position)
  const role: User['role'] = (['admin', 'manager', 'gpv'].includes(rawRole)
    ? rawRole
    : 'gpv') as User['role']
  const region = toStringValue(source.region ?? source.zone)
  const permissions = toStringValue(source.permissions ?? source.permission)
  const phone = toStringValue(source.phone ?? source.mobile)
  const lastLogin =
    toStringValue(source.lastLogin ?? source.last_login) ||
    new Date().toISOString()
  const createdAt =
    toStringValue(source.createdAt ?? source.created_at) ||
    new Date().toISOString()

  const safeName = fullName || 'Usuario sin nombre'
  const initials =
    toStringValue(
      source.avatarInitials || getInitials(safeName || email)
    ).slice(0, 2) || 'SC'

  return {
    id: source.id ?? generateId('user'),
    fullName: safeName,
    email,
    role,
    region,
    permissions: permissions || 'Supervisor',
    phone,
    avatarInitials: initials,
    lastLogin,
    createdAt,
    activity: normaliseActivityLog(source.activity ?? [])
  }
}

export const normalisePreferences = (prefs: PreferencesInput): Preferences => {
  const source = (prefs ?? DEFAULT_PREFERENCES) as PreferencesInput &
    RawPreferences
  const email = toStringValue(
    source.privacyEmail ??
    source.privacy_email ??
    DEFAULT_PREFERENCES.privacyEmail
  )
  const allowDataExports =
    source.allowDataExports ??
    source.allow_data_exports ??
    DEFAULT_PREFERENCES.allowDataExports

  return {
    privacyEmail: email || DEFAULT_PREFERENCES.privacyEmail,
    allowDataExports: Boolean(allowDataExports)
  }
}

/**
 * Normaliza el valor del campo status de un distribuidor.
 * Acepta variantes en español/inglés, mayúsculas/minúsculas y tipos boolean/número.
 */
function normaliseDistributorStatus(rawStatus: unknown): DistributorStatus {
  const s = String(rawStatus ?? '')
    .toLowerCase()
    .trim()
  if (
    [
      'active',
      'activo',
      'activa',
      '1',
      'true',
      'yes',
      'sí',
      'si',
      'alta'
    ].includes(s)
  )
    return 'active'
  if (
    [
      'blocked',
      'bloqueado',
      'bloqueada',
      'inactive',
      'inactivo',
      'inactiva',
      'archived',
      'baja',
      'cancelled'
    ].includes(s)
  )
    return 'blocked'
  return 'pending'
}

export const normaliseDistributors = (
  items: Array<DistributorInput> = []
): Distributor[] =>
  items.map((item, index) => {
    const source = item as RawDistributor
    const rawCode = toStringValue(source.code ?? source.external_code)
    const code = rawCode ? rawCode.toUpperCase() : `PVP-${index + 1}`
    const category = resolveCategory(code)

    const rawBrands = (Array.isArray(source.brands)
      ? source.brands
      : Array.isArray(source.brands_enabled)
        ? source.brands_enabled
        : []
    ).filter((b: string) => b !== 'silbo' && b !== 'silbö')
    const channelType = (source.channelType ??
      source.channel_type ??
      'non_exclusive') as ChannelType
    const brands = deriveBrandsForChannel(rawBrands, channelType, category)

    const taxId = toStringValue(
      source.taxId ?? source.tax_id ?? source.cif
    ).toUpperCase()
    const fiscalName = toStringValue(
      source.fiscalName ?? source.fiscal_name ?? source.razonSocial
    )
    const fiscalAddress = toStringValue(
      source.fiscalAddress ?? source.fiscal_address ?? source.direccionFiscal
    )
    const email = toStringValue(source.email)
    const phoneRaw = toStringValue(source.telefono ?? source.phone)
    const postalCode = toStringValue(
      source.postalCode ?? source.postal_code ?? source.cp
    )

    const distributorBase = {
      name:
        toStringValue(source.nombre_pdv ?? source.name) ||
        'Distribuidor sin nombre',
      contactPerson: toStringValue(
        source.contactPerson ??
        source.contact_person ??
        source.responsable ??
        source.contact_name
      ),
      contactPersonBackup: toStringValue(
        source.contactPersonBackup ??
        source.contact_person_backup ??
        source.responsableSecundario ??
        source.responsable_backup
      ),
      province: toStringValue(source.provincia ?? source.province),
      island: toStringValue(source.island ?? source.isla),
      city: toStringValue(source.poblacion ?? source.city),
      postalCode,
      email,
      phone: phoneRaw,
      brands,
      status: normaliseDistributorStatus(
        source.status ?? source.operational_status
      )
    }

    const checklist = evaluateDistributorChecklist({
      ...distributorBase,
      taxId,
      fiscalName,
      fiscalAddress
    })
    const completion =
      source.completion ??
      computeDistributorCompletion(distributorBase, checklist)

    return {
      id: source.id ?? generateId('dist'),
      code,
      category,
      categoryId: category.id,
      pendingData:
        category.pendingData ||
        Boolean(source.pendingData ?? source.pending_data),
      brandPolicy: category.brandPolicy,
      name: distributorBase.name,
      contactPerson: distributorBase.contactPerson,
      contactPersonBackup: distributorBase.contactPersonBackup,
      channelType,
      brands,
      sectors: Array.isArray(source.sectors) ? source.sectors : ['telco'],
      status: distributorBase.status,
      province: distributorBase.province,
      island: distributorBase.island,
      city: distributorBase.city,
      postalCode,
      phone: phoneRaw,
      email,
      createdAt: normaliseDate(
        source.fecha_alta ?? source.created_at ?? source.createdAt
      ),
      address: toStringValue(source.address ?? source.direccion) || undefined,
      notes: toStringValue(source.notes),
      notesHistory: safeParseJSON(source.notesHistory ?? source.notes_history, []),
      taxId,
      fiscalName,
      fiscalAddress,
      upgradeRequested: Boolean(
        source.upgradeRequested ?? source.upgrade_requested ?? false
      ),
      checklist,
      checklistComplete: Object.values(checklist).every(Boolean),
      completion,
      salesYtd: Number(
        source.salesYtd ?? source.sales_ytd ?? source.sales ?? 0
      ),
      priorityScore: Number(source.priorityScore ?? source.priority_score ?? 0),
      priorityLevel:
        (source.priorityLevel as PriorityLevel) ??
        (source.priority_level as PriorityLevel) ??
        'medium',
      priorityDrivers: {
        traffic: Number(
          source.priorityDrivers?.traffic ??
          source.priority_drivers?.traffic ??
          0
        ),
        sales: Number(
          source.priorityDrivers?.sales ?? source.priority_drivers?.sales ?? 0
        ),
        dataQuality: Number(
          source.priorityDrivers?.dataQuality ??
          source.priority_drivers?.dataQuality ??
          0
        ),
        salesLast90Days: Number(
          source.priorityDrivers?.salesLast90Days ??
          source.priority_drivers?.salesLast90Days ??
          0
        ),
        lastSaleDays:
          source.priorityDrivers?.lastSaleDays != null
            ? Number(source.priorityDrivers?.lastSaleDays)
            : source.priority_drivers?.lastSaleDays != null
              ? Number(source.priority_drivers?.lastSaleDays)
              : null,
        lastVisitDays:
          source.priorityDrivers?.lastVisitDays != null
            ? Number(source.priorityDrivers?.lastVisitDays)
            : source.priority_drivers?.lastVisitDays != null
              ? Number(source.priority_drivers?.lastVisitDays)
              : null,
        updatedAt:
          toStringValue(
            source.priorityDrivers?.updatedAt ??
            source.priority_drivers?.updatedAt
          ) || normaliseDate(new Date())
      }
    }
  })

export const normaliseCandidates = (
  items: Array<CandidateInput> = []
): Candidate[] => {
  const stageGroups = new Map<
    string,
    Array<{
      candidate: Candidate
      rawPosition: number | null
      fallbackOrder: number
    }>
  >()
  const pipelineStageIds = pipelineStages.map((stage) => stage.id)

  items.forEach((item, index) => {
    const source = item as RawCandidate
    const rawCode = toStringValue(
      source.channelCode ?? source.channel_code ?? source.propuesta_nomenclatura
    )
    const channelCode = rawCode ? rawCode.toUpperCase() : ''
    // Favorecer categoryId explícito si existe, si no, derivar por código
    const incomingCategoryId = toStringValue(
      source.categoryId || source.category_id
    )
    const category =
      incomingCategoryId && incomingCategoryId !== 'general'
        ? resolveCategory(incomingCategoryId) // resolveCategory también funciona enviando el ID si el matcher coincide o si lo modificamos un poco
        : resolveCategory(channelCode)
    const stage = (source.stage ?? 'new') as Candidate['stage']

    const candidate: Candidate = {
      id: source.id ?? generateId('cand'),
      name:
        toStringValue(source.nombre ?? source.name) || 'Candidato sin nombre',
      taxId: toStringValue(source.taxId ?? source.tax_id ?? ''),
      city: toStringValue(source.poblacion ?? source.city),
      province: toStringValue(source.provincia ?? source.province),
      island: toStringValue(source.island ?? source.isla),
      channelCode,
      category,
      categoryId: category.id,
      pendingData:
        category.pendingData ||
        Boolean(source.pendingData ?? source.pending_data),
      brandPolicy: category.brandPolicy,
      contact: {
        name: toStringValue(source.contacto?.nombre ?? source.contact?.name),
        phone: toStringValue(source.contacto?.movil ?? source.contact?.phone),
        email: toStringValue(source.contacto?.email ?? source.contact?.email)
      },
      stage,
      source: toStringValue(source.source) || 'Autoregistro',
      notes: toStringValue(source.notes),
      notesHistory: safeParseJSON(source.notesHistory ?? source.notes_history, []),
      createdAt: normaliseDate(
        source.created_at ?? source.createdAt ?? new Date()
      ),
      updatedAt: normaliseDate(
        source.updated_at ?? source.updatedAt ?? new Date()
      ),
      lastContactAt: source.lastContactAt
        ? normaliseDate(source.lastContactAt as string)
        : undefined,
      operator: toStringValue(source.operator),
      gpvProposal: Boolean(source.gpvProposal ?? source.gpv_proposal ?? false),
      position: 0,
      priority: 'medium'
    }

    const rawPosition = Number.isFinite(source.position)
      ? Number(source.position)
      : null
    const entry = {
      candidate,
      rawPosition,
      fallbackOrder: index
    }

    if (!stageGroups.has(stage)) {
      stageGroups.set(stage, [])
    }
    stageGroups.get(stage)?.push(entry)
  })

  const assembleStage = (stageId: string) => {
    const entries = stageGroups.get(stageId)
    if (!entries || !entries.length) return [] as Candidate[]

    const sorted = [...entries].sort((a, b) => {
      if (a.rawPosition != null && b.rawPosition != null) {
        return a.rawPosition - b.rawPosition
      }
      if (a.rawPosition != null) return -1
      if (b.rawPosition != null) return 1
      return a.fallbackOrder - b.fallbackOrder
    })

    return sorted.map((entry, position) => ({
      ...entry.candidate,
      position
    }))
  }

  const result: Candidate[] = []

  pipelineStageIds.forEach((stageId) => {
    result.push(...assembleStage(stageId))
    stageGroups.delete(stageId)
  })

  stageGroups.forEach((_, stageId) => {
    result.push(...assembleStage(stageId))
  })

  return result
}

export const reindexCandidates = (list: Candidate[] = []): Candidate[] => {
  const stageGroups = new Map<
    string,
    Array<{ candidate: Candidate; fallbackOrder: number }>
  >()
  const pipelineStageIds = pipelineStages.map((stage) => stage.id)

  list.forEach((candidate, index) => {
    const stage = candidate.stage ?? 'new'
    if (!stageGroups.has(stage)) {
      stageGroups.set(stage, [])
    }
    stageGroups.get(stage)?.push({ candidate, fallbackOrder: index })
  })

  const assembleStage = (stageId: string) => {
    const entries = stageGroups.get(stageId)
    if (!entries || !entries.length) return [] as Candidate[]

    const sorted = [...entries].sort((a, b) => {
      const aPos = Number.isFinite(a.candidate.position)
        ? Number(a.candidate.position)
        : null
      const bPos = Number.isFinite(b.candidate.position)
        ? Number(b.candidate.position)
        : null

      if (aPos != null && bPos != null) return aPos - bPos
      if (aPos != null) return -1
      if (bPos != null) return 1
      return a.fallbackOrder - b.fallbackOrder
    })

    return sorted.map((entry, position) => ({
      ...entry.candidate,
      stage: stageId as Candidate['stage'],
      position
    }))
  }

  const result: Candidate[] = []

  pipelineStageIds.forEach((stageId) => {
    result.push(...assembleStage(stageId))
    stageGroups.delete(stageId)
  })

  stageGroups.forEach((_, stageId) => {
    result.push(...assembleStage(stageId))
  })

  return result
}

export const insertCandidateIntoStage = (
  list: Candidate[] = [],
  candidate: Candidate,
  stage: Candidate['stage'],
  index = Number.POSITIVE_INFINITY
): Candidate[] => {
  const stageCounters: Record<string, number> = {}
  const output: Candidate[] = []
  let inserted = false

  list.forEach((item) => {
    const itemStage = item.stage ?? 'new'
    const count = stageCounters[itemStage] ?? 0

    if (itemStage === stage && !inserted && count >= index) {
      output.push({ ...candidate, stage })
      inserted = true
    }

    output.push(item)
    stageCounters[itemStage] = count + 1
  })

  if (!inserted) {
    output.push({ ...candidate, stage })
  }

  return output
}

export const normaliseVisits = (items: Array<VisitInput> = []): Visit[] =>
  items.map((visit) => {
    const source = visit as RawVisit
    const visitDate = normaliseDate(source.visit_date ?? source.date)
    const reminderEnabled =
      typeof source.reminder?.enabled === 'string'
        ? source.reminder.enabled === 'true'
        : source.reminder?.enabled
    const rawEnabled =
      reminderEnabled ??
      (typeof source.reminder_enabled === 'string'
        ? source.reminder_enabled === 'true'
        : source.reminder_enabled)
    const rawMinutes =
      source.reminder?.minutesBefore ??
      source.reminder_minutes ??
      source.reminderMinutes
    const rawChannel = source.reminder?.channel ?? source.reminder_channel

    const reminder = resolveReminderWithDefaults(visitDate, {
      ...source.reminder,
      minutesBefore:
        typeof rawMinutes === 'string' ? Number(rawMinutes) : rawMinutes,
      channel: (typeof rawChannel === 'string' ? rawChannel : undefined) as
        | VisitReminder['channel']
        | undefined,
      enabled: rawEnabled != null ? Boolean(rawEnabled) : undefined
    })
    const alignedReminder = shiftReminderForVisitDate(visitDate, reminder)
    const scheduledTime =
      toStringValue(source.scheduledTime ?? source.scheduled_time) || undefined
    return {
      id: source.id ?? generateId('visit'),
      distributorId: source.distributor_id ?? source.distributorId ?? null,
      candidateId: source.candidate_id ?? source.candidateId ?? null,
      date: visitDate,
      scheduledTime,
      type: (source.visit_type ??
        source.type ??
        'presentacion') as Visit['type'],
      objective: toStringValue(source.objetivo ?? source.objective),
      summary: toStringValue(source.resumen ?? source.summary),
      nextSteps: toStringValue(source.proximos_pasos ?? source.nextSteps),
      result: (source.resultado ??
        source.result ??
        'pendiente') as Visit['result'],
      durationMinutes: source.duracion_min ?? source.durationMinutes ?? 30,
      createdAt: normaliseDate(new Date()),
      reminder: alignedReminder,
      notesHistory: safeParseJSON(source.notesHistory ?? source.notes_history, [])
    }
  })

export const normaliseSales = (items: Array<SaleInput> = []): Sale[] =>
  items
    .filter((sale) => {
      const brand = (sale as RawSale).brand ?? ''
      return brand !== 'silbo' && brand !== 'silbö'
    })
    .map((sale) => {
    const source = sale as RawSale
    return {
      id: source.id ?? generateId('sale'),
      distributorId: source.distributor_id ?? source.distributorId ?? '',
      distributorCode: toStringValue(source.distributorCode) || undefined,
      distributorName: toStringValue(source.distributorName) || undefined,
      date: normaliseDate(
        source.sale_date ?? source.fechaCierre ?? source.date
      ),
      fechaOferta: source.fechaOferta || undefined,
      fechaCierre: source.fechaCierre || undefined,
      fechaActivacion: source.fechaActivacion || undefined,
      fechaBaja: source.fechaBaja || undefined,
      brand: source.brand ?? '',
      sector: (source.sector as SaleSector) || 'Telefonía',
      sectorId:
        source.sectorId ||
        brandOptions.find((b) => b.id === source.brand)?.sectorId ||
        'telco',
      family: source.family ?? 'convergente',
      operations: source.operaciones ?? source.operations ?? 1,
      status: (source.status as SaleStatus) || 'Activado',
      notes: toStringValue(source.observaciones ?? source.notes),
      modo: source.modo as Sale['modo'] | undefined,
      tipoDocumento: source.tipoDocumento as Sale['tipoDocumento'] | undefined,
      nombreCliente: toStringValue(source.nombreCliente) || undefined,
      documento: toStringValue(source.documento) || undefined,
      observaciones: toStringValue(source.observaciones) || undefined,
      createdAt: normaliseDate(source.createdAt ?? new Date()),
      updatedAt: source.updatedAt || undefined
    }
  })

export const normaliseLeads = (items: Array<LeadInput> = []): Lead[] =>
  items.map((item) => {
    const source = item as RawLead
    return {
      id: source.id ?? generateId('lead'),
      fuente: (source.fuente as Lead['fuente']) || 'manual',
      nombre: toStringValue(source.nombre ?? source.name) || 'Lead sin nombre',
      telefono: toStringValue(source.telefono ?? source.phone) || undefined,
      email: toStringValue(source.email) || undefined,
      web: toStringValue(source.web ?? source.website) || undefined,
      direccion: toStringValue(source.direccion ?? source.address) || undefined,
      ciudad: toStringValue(source.ciudad ?? source.city ?? source.poblacion) || undefined,
      provincia:
        toStringValue(source.provincia ?? source.province) || undefined,
      isla: toStringValue(source.island ?? source.isla) || undefined,
      sector: toStringValue(source.sector) || undefined,
      rating: source.rating != null ? Number(source.rating) : undefined,
      reviews_count:
        source.reviews_count != null ? Number(source.reviews_count) : 0,
      place_id: toStringValue(source.place_id),
      estado: (source.estado as Lead['estado']) || 'nuevo',
      notas: toStringValue(source.notas ?? source.notes),
      asignado_a: toStringValue(source.asignado_a),
      convertedAt:
        source.converted_at || source.convertedAt
          ? normaliseDate(
            (source.converted_at ?? source.convertedAt) as string | Date
          )
          : undefined,
      createdAt: normaliseDate(
        source.created_at ?? source.createdAt ?? new Date()
      ),
      updatedAt: normaliseDate(
        source.updated_at ?? source.updatedAt ?? new Date()
      )
    }
  })

// ─── Commission Agreements Normalisers ────────────────────────────────────────

import type { CommissionAgreement, CommissionTier } from '../types'

type CommissionAgreementInput = UnknownRecord & {
  id?: string
  distributor_id?: string
  distributorId?: string
  sector?: string
  operator?: string
  resi_type?: string
  resiType?: string
  resi_amount?: string
  resiAmount?: string
  resi_levels?: string
  resiLevels?: string
  resi_tiers?: CommissionTier[] | string
  resiTiers?: CommissionTier[] | string
  resi_rappel?: string
  resiRappel?: string
  pyme_type?: string
  pymeType?: string
  pyme_amount?: string
  pymeAmount?: string
  pyme_levels?: string
  pymeLevels?: string
  pyme_tiers?: CommissionTier[] | string
  pymeTiers?: CommissionTier[] | string
  pyme_rappel?: string
  pymeRappel?: string
  notes?: string
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  history?: CommissionHistoryEntry[] | string
}

export const normaliseCommissionAgreements = (
  items: Array<CommissionAgreementInput> = []
): CommissionAgreement[] =>
  items.map((source) => {
    const parseTiers = (
      raw: CommissionTier[] | string | undefined
    ): CommissionTier[] => {
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      try {
        return JSON.parse(raw)
      } catch {
        return []
      }
    }

    const parseHistory = (
      raw: CommissionHistoryEntry[] | string | undefined
    ): CommissionHistoryEntry[] | undefined => {
      if (!raw) return undefined
      if (Array.isArray(raw)) return raw
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as CommissionHistoryEntry[]) : undefined
      } catch {
        return undefined
      }
    }

    const toStringValue = (val: unknown): string => {
      if (val == null) return ''
      return String(val)
    }

    return {
      id: toStringValue(source.id || generateId('comm')),
      distributorId: toStringValue(
        source.distributor_id ?? source.distributorId ?? ''
      ),
      sector: toStringValue(source.sector ?? ''),
      operator: toStringValue(source.operator ?? ''),
      resiType: (toStringValue(
        source.resi_type ?? source.resiType ?? 'adoc'
      ) as CommissionAgreement['resiType']) as 'adoc' | 'fijo' | 'porcentaje',
      resiAmount: toStringValue(source.resi_amount ?? source.resiAmount ?? ''),
      resiLevels: toStringValue(source.resi_levels ?? source.resiLevels ?? ''),
      resiTiers: parseTiers(source.resi_tiers ?? source.resiTiers),
      resiRappel: toStringValue(source.resi_rappel ?? source.resiRappel ?? ''),
      pymeType: (toStringValue(
        source.pyme_type ?? source.pymeType ?? 'adoc'
      ) as CommissionAgreement['pymeType']) as 'adoc' | 'fijo' | 'porcentaje',
      pymeAmount: toStringValue(source.pyme_amount ?? source.pymeAmount ?? ''),
      pymeLevels: toStringValue(source.pyme_levels ?? source.pymeLevels ?? ''),
      pymeTiers: parseTiers(source.pyme_tiers ?? source.pymeTiers),
      pymeRappel: toStringValue(source.pyme_rappel ?? source.pymeRappel ?? ''),
      notes: toStringValue(source.notes ?? ''),
      createdAt: normaliseDate(source.created_at ?? source.createdAt ?? new Date()),
      updatedAt: normaliseDate(source.updated_at ?? source.updatedAt ?? new Date()),
      history: parseHistory(source.history)
    }
  })

// ─── Tasks Normalisers ────────────────────────────────────────────────────────

import type { Task, TaskStatus, TaskPriority, EntityId } from '../types'

type TaskInput = UnknownRecord & {
  id?: EntityId
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | Date
  dueDate?: string | Date
  entity_id?: EntityId
  entityId?: EntityId
  entity_type?: 'distributor' | 'candidate'
  entityType?: 'distributor' | 'candidate'
  creator_id?: EntityId
  creatorId?: EntityId
  completed_at?: string | Date
  completedAt?: string | Date
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
}

export const normaliseTasks = (
  items: Array<TaskInput> = []
): Task[] =>
  items.map((source) => {
    const toStringValue = (val: unknown): string => {
      if (val == null) return ''
      return String(val)
    }

    const toEntityId = (val: unknown): EntityId => {
      if (val == null) return ''
      return String(val)
    }

    return {
      id: toEntityId(source.id || generateId('task')),
      title: toStringValue(source.title ?? 'Nueva Tarea'),
      description: toStringValue(source.description ?? ''),
      status: (toStringValue(
        source.status ?? 'pending'
      ) as TaskStatus),
      priority: (toStringValue(
        source.priority ?? 'medium'
      ) as TaskPriority),
      dueDate: normaliseDate(source.due_date ?? source.dueDate ?? new Date()),
      entityId: toEntityId(source.entity_id ?? source.entityId ?? ''),
      entityType: (toStringValue(
        source.entity_type ?? source.entityType ?? 'distributor'
      ) as 'distributor' | 'candidate'),
      creatorId: (source.creator_id ?? source.creatorId)
        ? toEntityId(source.creator_id ?? source.creatorId)
        : undefined,
      completedAt: (source.completed_at ?? source.completedAt)
        ? normaliseDate(source.completed_at ?? source.completedAt)
        : undefined,
      createdAt: normaliseDate(source.created_at ?? source.createdAt ?? new Date()),
      updatedAt: normaliseDate(source.updated_at ?? source.updatedAt ?? new Date())
    }
  })
