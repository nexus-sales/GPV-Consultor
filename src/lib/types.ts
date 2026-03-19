// Identificadores y enums ligeros
export type EntityId = string | number
export type SectorId = string
export interface Sector {
  id: SectorId
  label: string
  icon: string
  color: string
}
export type ChannelType = 'exclusive' | 'non_exclusive' | 'd2d'
export type DistributorStatus = 'active' | 'pending' | 'blocked'
export type PipelineStageId = string
export type CandidatePriority = 'high' | 'medium' | 'low'
export type VisitType =
  | 'presentacion'
  | 'seguimiento'
  | 'formacion'
  | 'incidencias'
  | 'apertura'
export type VisitResult =
  | 'pendiente'
  | 'completada'
  | 'reprogramar'
  | 'cancelada'
export type PriorityLevel = 'high' | 'medium' | 'low'
export type VisitReminderChannel = 'phone' | 'email' | 'whatsapp'

export interface VisitReminder {
  enabled: boolean
  minutesBefore: number
  channel: VisitReminderChannel
  scheduledAt: string | null
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PriorityDrivers {
  traffic: number
  sales: number
  dataQuality: number
  salesLast90Days: number
  lastSaleDays: number | null
  lastVisitDays: number | null
  updatedAt: string
}

// Notificaciones globales
export interface Notification {
  id: string
  type: string
  title: string
  description: string
  timestamp?: string
  read?: boolean
  color?: string
}

export type ActivityType = 'sale' | 'visit' | 'call' | 'task' | 'information'
export type Priority = 'high' | 'medium' | 'low'
export interface Activity {
  id?: string | number
  type: ActivityType
  title: string
  description: string
  timestamp: string
  priority?: Priority
  metadata?: Record<string, string | number>
  detail?: string
}

export type NoteCategory =
  | 'visita'
  | 'llamada'
  | 'email'
  | 'reunion'
  | 'general'

export interface NoteEntry {
  id: string
  title: string
  timestamp: string
  content: string
  detail?: string
  author?: string
  category?: NoteCategory
}

export interface Contact {
  name?: string
  phone?: string
  email?: string
}

export interface Preferences {
  privacyEmail: string
  allowDataExports: boolean
}

export interface BrandPolicy {
  allowed: string[] | null
  blocked: string[]
  conditional: string[]
  note: string
  messages?: Record<string, string>
}

export interface Category {
  id: string
  label: string
  description: string
  author?: string
  createdAt?: string
  content?: string
  badgeClass: string
  tooltip: string
  brandPolicy: BrandPolicy
  pendingData?: boolean
}

export interface PipelineStage {
  id: PipelineStageId
  label: string
  description: string
  tone: string
  accent: string
  badge: string
  empty: string
}

export interface Checklist {
  taxId: boolean
  fiscalName: boolean
  fiscalAddress: boolean
  email: boolean
  phone: boolean
  postalCode: boolean
}

export interface Distributor {
  id: EntityId
  code: string
  externalCode?: string // Código externo (ESPSB, LWMY, EXISTENTE_VF, PVPTE, etc.)
  category: Category
  categoryId: string
  pendingData: boolean
  brandPolicy: BrandPolicy
  name: string
  contactPerson: string
  contactPersonBackup: string
  channelType: ChannelType
  brands: string[]
  sectors: SectorId[]
  status: DistributorStatus
  province: string
  city: string
  postalCode: string
  phone: string
  email: string
  address?: string // Dirección física
  createdAt: string
  notes: string
  notesHistory?: NoteEntry[]
  taxId: string
  fiscalName: string
  fiscalAddress: string
  upgradeRequested: boolean
  teamId?: string // ID del equipo D2D (solo para canal d2d)
  checklist: Checklist
  checklistComplete: boolean
  completion: number
  salesYtd: number
  priorityScore: number
  priorityLevel: PriorityLevel
  priorityDrivers: PriorityDrivers
}

export interface User {
  id: EntityId
  fullName: string
  email: string
  role: string
  region: string
  permissions: string
  phone: string
  avatarInitials: string
  lastLogin: string
  createdAt: string
  activity: Activity[]
}

export interface Candidate {
  id: EntityId
  name: string
  taxId: string // CIF/NIF/NIE
  stage: PipelineStageId
  channelCode?: string
  contact?: Contact
  address?: string // Dirección física
  postalCode?: string // Código Postal
  city?: string
  island?: string
  province?: string
  category?: Category
  categoryId?: string
  pendingData?: boolean
  brandPolicy?: BrandPolicy
  priority: CandidatePriority
  score?: number
  notes?: string
  notesHistory?: NoteEntry[]
  createdAt: string
  updatedAt?: string
  lastContactAt?: string
  position?: number
  source?: string
}

export interface Lead {
  id: string
  fuente: 'google_places' | 'serp_web' | 'google_ads' | 'manual'
  nombre: string
  telefono?: string
  email?: string
  web?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  sector?: string
  rating?: number
  reviews_count?: number
  place_id?: string
  estado:
    | 'nuevo'
    | 'contactado'
    | 'pendiente'
    | 'rechazado'
    | 'interesado'
    | 'cliente'
    | 'descartado'
  notas?: string
  asignado_a?: string
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id: EntityId
  distributorId: EntityId | null
  candidateId: EntityId | null
  date: string
  scheduledTime?: string
  type: VisitType
  objective: string
  summary: string
  nextSteps: string
  result: VisitResult
  durationMinutes: number
  createdAt: string
  reminder: VisitReminder
  notes?: string
  notesHistory?: NoteEntry[]
}

export type SaleStatus =
  | 'Enviado'
  | 'Pendiente'
  | 'Scoring'
  | 'Aceptado'
  | 'Activado'
  | 'Baja'

export type SaleDocumentType = 'CIF' | 'DNI' | 'NIE'
export type SaleSector = 'Alarma' | 'Energía' | 'Telefonía' | 'Otros'
export type SaleMode = 'PYME' | 'RESI'

export interface Sale {
  id: EntityId
  distributorId: EntityId
  distributorCode?: string
  distributorName?: string

  // Datos del Excel
  sector: SaleSector
  sectorId?: SectorId
  modo?: SaleMode
  tipoDocumento?: SaleDocumentType
  nombreCliente?: string
  documento?: string

  // Fechas
  fechaOferta?: string // ISO format
  fechaCierre?: string // ISO format
  fechaActivacion?: string // ISO format
  fechaBaja?: string // ISO format

  // Estado y otros
  status: SaleStatus
  observaciones?: string

  // Metadatos legacy/compatibilidad
  date: string // mapeado a fechaCierre o createdAt
  brand?: string
  family?: string
  operations?: number
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface CommissionTier {
  id: string
  levels: string
  amount: string
}

export interface CommissionAgreement {
  id: string
  distributorId: EntityId
  sector: string
  operator: string // brandId
  // Residencial
  resiType: 'adoc' | 'fijo' | 'porcentaje'
  resiAmount?: string
  resiLevels?: string
  resiTiers?: CommissionTier[]
  resiRappel: string
  // PYME
  pymeType: 'adoc' | 'fijo' | 'porcentaje'
  pymeAmount?: string
  pymeLevels?: string
  pymeTiers?: CommissionTier[]
  pymeRappel: string
  // Común
  notes?: string
  createdAt: string
  updatedAt: string
  history?: CommissionHistoryEntry[]
}

export type NewCommissionAgreement = Omit<
  CommissionAgreement,
  'id' | 'createdAt' | 'updatedAt' | 'history'
>
export type CommissionAgreementUpdates = Partial<NewCommissionAgreement>

export interface CommissionHistoryEntry {
  date: string
  resiRappel: string
  pymeRappel: string
  resiAmount?: string
  pymeAmount?: string
  note?: string
}

// Opciones y lookups
export interface LookupOption {
  id: string
  label: string
  sectorId?: SectorId
  value?: unknown
}

export interface Lookups {
  brands: Record<string, LookupOption>
  channels: Record<string, LookupOption>
  statuses: Record<string, LookupOption>
  stages: Record<string, LookupOption>
}

// Estadísticas y call center
export interface PipelineStageCount {
  stageId: PipelineStageId
  count: number
}

export interface BrandPerformance {
  brandId: string
  label: string
  value: number
}

export interface ActivitySummary {
  id: string
  type: 'visit' | 'sale'
  title: string
  description: string
  timestamp: string
  priority: 'low' | 'medium'
  metadata: Record<string, string>
}

export interface StatsSummary {
  activeDistributors: number
  pendingDistributors: number
  totalOperations: number
  visitsLast7Days: number
  candidatesInPipeline: number
  pipelineCounts: PipelineStageCount[]
  operationsByBrand: BrandPerformance[]
  operationsBySector: Array<{
    sectorId: SectorId
    operations: number
    percentage: number
  }>
  latestActivities: ActivitySummary[]
}

export type CallCenterTaskType =
  | 'first-contact'
  | 'follow-up'
  | 'activation'
  | 'post-visit'
export type CallCenterTaskPriority = 'low' | 'medium' | 'high'

export interface CallCenterTask {
  id: string
  refType: 'candidate' | 'distributor' | 'visit'
  refId: EntityId | null
  visitId?: EntityId | null
  distributorId: EntityId | null
  candidateId: EntityId | null
  name: string
  contact: string
  phone: string
  email: string
  stageId: PipelineStageId | null
  pendingData: boolean
  note: string
  context: string
  location: string
  taskType: CallCenterTaskType
  priority: CallCenterTaskPriority
  dueDate: string | null
  isOverdue: boolean
  channelCode?: string
  meta: string
}

export interface CallCenterSummary {
  tasks: {
    firstContact: CallCenterTask[]
    followUp: CallCenterTask[]
    activation: CallCenterTask[]
    postVisit: CallCenterTask[]
  }
  stats: {
    total: number
    urgent: number
    contactable: number
    missingData: number
    nextTask: CallCenterTask | null
  }
  lookup: {
    byCandidate: Record<EntityId, CallCenterTask[]>
    byDistributor: Record<EntityId, CallCenterTask[]>
    byVisit: Record<EntityId, CallCenterTask>
  }
  helpers: {
    nextCandidateStage: (
      stageId: PipelineStageId | null | undefined
    ) => PipelineStageId | null
    previousCandidateStage: (
      stageId: PipelineStageId | null | undefined
    ) => PipelineStageId | null
  }
}

// Contexto global expuesto por el proveedor
export interface AppContextType {
  users: User[]
  currentUser: User | null
  currentUserId: EntityId | null
  preferences: Preferences
  distributors: Distributor[]
  commissionAgreements: CommissionAgreement[]
  candidates: Candidate[]
  leads: Lead[]
  visits: Visit[]
  sales: Sale[]
  lookups: Lookups
  formatters: {
    daysDifference: (isoDate: string) => number
    formatRelativeTime: (isoDate: string) => string
    relative: (isoDate: string) => string
  }
  taxonomy: {
    rules: unknown
    resolveCategory: (code: string | null | undefined) => Category
    deriveBrandsForChannel: (
      brands: string[],
      channelType: ChannelType,
      category: Category
    ) => string[]
  }
  pipelineStages: PipelineStage[]
  sectors: Sector[]
  brandOptions: LookupOption[]
  channelOptions: LookupOption[]
  statusOptions: LookupOption[]
  provinceOptions: LookupOption[]
  stats: StatsSummary
  callCenter: CallCenterSummary
  validators: Record<string, unknown>
  notifications: Notification[]
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
  isSupabaseConfigured: boolean
  // ✅ SISTEMA OFFLINE/ONLINE - NUEVAS PROPIEDADES
  syncStatus: SyncStatus
  forceSync: () => Promise<void>
  isOnline: boolean
  isSyncing: boolean
  pendingSync: number
  addUser: (payload: NewUser) => User
  updateUser: (id: EntityId, updates: UserUpdates) => void
  removeUser: (id: EntityId) => void
  setCurrentUser: (id: EntityId) => void
  updatePreferences: (updates: PreferencesUpdates) => void
  addDistributor: (payload: NewDistributor) => Promise<Distributor>
  updateDistributor: (
    id: EntityId,
    updates: DistributorUpdates
  ) => Promise<void>
  deleteDistributor: (id: EntityId) => Promise<void>
  addCandidate: (payload: NewCandidate) => Promise<Candidate>
  updateCandidate: (id: EntityId, updates: CandidateUpdates) => Promise<void>
  deleteCandidate: (id: EntityId) => Promise<void>
  addLead: (payload: NewLead) => Promise<Lead>
  updateLead: (id: string, updates: LeadUpdates) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  removeCandidate: (id: EntityId) => void
  moveCandidate: (id: EntityId, newStage: PipelineStageId) => Promise<void>
  reorderCandidate?: (
    id: EntityId,
    newStage: PipelineStageId,
    newPosition: number
  ) => Promise<void>
  addVisit: (payload: NewVisit) => Promise<Visit>
  updateVisit: (id: EntityId, updates: VisitUpdates) => Promise<void>
  deleteVisit: (id: EntityId) => Promise<void>
  addSale: (payload: NewSale) => Promise<Sale>
  updateSale: (id: EntityId, updates: SaleUpdates) => Promise<void>
  deleteSale: (id: EntityId) => Promise<void>
  // ✅ ACUERDOS DE COMISIONES
  addCommissionAgreement: (
    payload: NewCommissionAgreement
  ) => Promise<CommissionAgreement>
  updateCommissionAgreement: (
    id: string,
    updates: CommissionAgreementUpdates
  ) => Promise<void>
  deleteCommissionAgreement: (id: string) => Promise<void>
  // ✅ CONFIGURACIÓN DINÁMICA
  addBrand: (payload: { label: string; sectorId: string }) => void
  removeBrand: (id: string) => void
  addSector: (payload: Sector) => void
  removeSector: (id: string) => void
  addPipelineStage: (payload: PipelineStage) => void
  updatePipelineStage: (
    id: PipelineStageId,
    updates: Partial<PipelineStage>
  ) => void
  removePipelineStage: (id: PipelineStageId) => void
  reorderPipelineStage: (id: PipelineStageId, direction: 'up' | 'down') => void
}

export type NewUser = Partial<User>
export type UserUpdates = Partial<User>
export type PreferencesUpdates = Partial<Preferences>
export type NewDistributor = Partial<Distributor>
export type DistributorUpdates = Partial<Distributor>
export type NewCandidate = Partial<Candidate>
export type CandidateUpdates = Partial<Candidate>
export type NewLead = Partial<Lead>
export type LeadUpdates = Partial<Lead>
export type NewVisit = Partial<Visit>
export type VisitUpdates = Partial<Visit>
export type NewSale = Partial<Sale>
export type SaleUpdates = Partial<Sale>

// ✅ TIPOS PARA SISTEMA OFFLINE/ONLINE
export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table:
    | 'distributors'
    | 'candidates'
    | 'visits'
    | 'sales'
    | 'sectors'
    | 'brands'
    | 'leads'
    | 'commissionAgreements'
  data: object
  timestamp: string
  retryCount?: number
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingOperations: number
  lastSync: string | null
  queueSize: number
}

// ✅ HOOKS PARA SISTEMA OFFLINE/ONLINE
export interface UseSyncStatusReturn {
  syncStatus: SyncStatus
  forceSync: () => Promise<void>
  isOnline: boolean
  isSyncing: boolean
  pendingSync: number
  notifications: Notification[]
}

export interface UseNotificationsReturn {
  notifications: Notification[]
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => string
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  unreadCount: number
}
