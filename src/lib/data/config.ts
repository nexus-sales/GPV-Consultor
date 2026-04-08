import type {
  LookupOption,
  PipelineStage,
  ChannelType,
  DistributorStatus,
  PipelineStageId,
  Sector,
  SectorId
} from '../types'

export type { ChannelType, DistributorStatus, PipelineStageId } from '../types'

export const sectors: Sector[] = [
  { id: 'telco', label: 'Telefonía', icon: '📱', color: 'indigo' },
  { id: 'alarms', label: 'Alarmas', icon: '🛡️', color: 'red' },
  { id: 'energy', label: 'Energía', icon: '⚡', color: 'yellow' }
]

export const brandOptions: LookupOption[] = [
  // Telco
  { id: 'vodafone_resid', label: 'Vodafone Residencial', sectorId: 'telco' },
  { id: 'vodafone_soho', label: 'Vodafone Soho', sectorId: 'telco' },
  { id: 'o2', label: 'O2', sectorId: 'telco' },
  // Alarms
  { id: 'adt', label: 'ADT Alarmas', sectorId: 'alarms' },
  { id: 'securitas', label: 'Securitas Direct', sectorId: 'alarms' },
  { id: 'prosegur', label: 'Prosegur', sectorId: 'alarms' },
  // Energy
  { id: 'endesa', label: 'Endesa', sectorId: 'energy' },
  { id: 'iberdrola', label: 'Iberdrola', sectorId: 'energy' },
  { id: 'naturgy', label: 'Naturgy', sectorId: 'energy' }
]

export const channelOptions: LookupOption[] = [
  { id: 'exclusive', label: 'Tienda exclusiva' },
  { id: 'non_exclusive', label: 'Tienda no exclusiva' },
  { id: 'd2d', label: 'Door to Door' },
  { id: 'collaborator', label: 'Colaborador' },
  { id: 'commercial', label: 'Comercial' }
]

export const pipelineStages: PipelineStage[] = [
  {
    id: 'new',
    label: 'Nuevos',
    description: 'Contactos recién registrados',
    tone: 'bg-gray-50',
    accent: 'border-gray-200',
    badge: 'bg-indigo-50 text-indigo-700',
    empty: 'No hay candidatos nuevos actualmente.'
  },
  {
    id: 'contacted',
    label: 'Contactados',
    description: 'Esperando documentación inicial',
    tone: 'bg-amber-50',
    accent: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700',
    empty: 'Aún no hay candidatos contactados.'
  },
  {
    id: 'evaluation',
    label: 'En evaluación',
    description: 'Validando requisitos y onboarding',
    tone: 'bg-indigo-50',
    accent: 'border-indigo-200',
    badge: 'bg-indigo-50 text-indigo-700',
    empty: 'Sin candidatos en evaluación.'
  },
  {
    id: 'approved',
    label: 'Aprobados',
    description: 'Listos para activación comercial',
    tone: 'bg-emerald-50',
    accent: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700',
    empty: 'No hay candidatos aprobados pendientes.'
  },
  {
    id: 'rejected',
    label: 'Rechazados',
    description: 'Se decidió no continuar con el alta',
    tone: 'bg-red-50',
    accent: 'border-red-200',
    badge: 'bg-red-50 text-red-600',
    empty: 'No se han rechazado candidatos recientemente.'
  }
]

export const statusOptions: LookupOption[] = [
  { id: 'active', label: 'Activo' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'blocked', label: 'Bloqueado' }
]

export const provinceOptions: LookupOption[] = [
  { id: 'Las Palmas', label: 'Las Palmas' },
  { id: 'Santa Cruz de Tenerife', label: 'Santa Cruz de Tenerife' }
]

export const channelBrandDefaults: Record<ChannelType, readonly string[]> = {
  exclusive: ['vodafone_resid', 'vodafone_soho', 'o2'],
  non_exclusive: [],
  d2d: ['vodafone_resid', 'o2'],
  collaborator: [],
  commercial: []
}

export const STORAGE_KEY = 'gpv-state-v1' as const
export const STORAGE_VERSION = 1 as const

export const familyLabels: Record<string, string> = {
  // Telco
  convergente: 'Convergente',
  movil: 'Línea móvil',
  solo_fibra: 'Solo fibra',
  empresa_autonomo: 'Empresa / Autónomo',
  microempresa: 'Microempresa',
  // Alarms
  alarma_hogar: 'Alarma Hogar',
  alarma_negocio: 'Alarma Negocio',
  // Energy
  luz: 'Suministro Luz',
  gas: 'Suministro Gas',
  dual: 'Luz + Gas'
}

export const sectorFamilies: Record<SectorId, { id: string; label: string }[]> =
  {
    telco: [
      { id: 'convergente', label: 'Convergente' },
      { id: 'movil', label: 'Línea móvil' },
      { id: 'solo_fibra', label: 'Solo fibra' },
      { id: 'empresa_autonomo', label: 'Empresa / Autónomo' },
      { id: 'microempresa', label: 'Microempresa' }
    ],
    alarms: [
      { id: 'alarma_hogar', label: 'Alarma Hogar' },
      { id: 'alarma_negocio', label: 'Alarma Negocio' }
    ],
    energy: [
      { id: 'luz', label: 'Suministro Luz' },
      { id: 'gas', label: 'Suministro Gas' },
      { id: 'dual', label: 'Luz + Gas' }
    ]
  }
