import type {
  LookupOption,
  IslandOption,
  MunicipalityOption,
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

export const islandOptions: IslandOption[] = [
  // Provincia Las Palmas
  { id: 'Gran Canaria', label: 'Gran Canaria', provinceId: 'Las Palmas' },
  { id: 'Lanzarote', label: 'Lanzarote', provinceId: 'Las Palmas' },
  { id: 'Fuerteventura', label: 'Fuerteventura', provinceId: 'Las Palmas' },
  // Provincia Santa Cruz de Tenerife
  { id: 'Tenerife', label: 'Tenerife', provinceId: 'Santa Cruz de Tenerife' },
  { id: 'La Palma', label: 'La Palma', provinceId: 'Santa Cruz de Tenerife' },
  { id: 'La Gomera', label: 'La Gomera', provinceId: 'Santa Cruz de Tenerife' },
  { id: 'El Hierro', label: 'El Hierro', provinceId: 'Santa Cruz de Tenerife' }
]

export const municipalityOptions: MunicipalityOption[] = [
  // GRAN CANARIA
  { id: 'Las Palmas de Gran Canaria', label: 'Las Palmas de G.C.', islandId: 'Gran Canaria' },
  { id: 'Telde', label: 'Telde', islandId: 'Gran Canaria' },
  { id: 'Santa Lucía de Tirajana', label: 'Santa Lucía de T.', islandId: 'Gran Canaria' },
  { id: 'San Bartolomé de Tirajana', label: 'San Bartolomé de T.', islandId: 'Gran Canaria' },
  { id: 'Arucas', label: 'Arucas', islandId: 'Gran Canaria' },
  { id: 'Agüimes', label: 'Agüimes', islandId: 'Gran Canaria' },
  { id: 'Ingenio', label: 'Ingenio', islandId: 'Gran Canaria' },
  { id: 'Gáldar', label: 'Gáldar', islandId: 'Gran Canaria' },
  { id: 'Mogán', label: 'Mogán', islandId: 'Gran Canaria' },
  { id: 'Santa Brígida', label: 'Santa Brígida', islandId: 'Gran Canaria' },

  // LANZAROTE
  { id: 'Arrecife', label: 'Arrecife', islandId: 'Lanzarote' },
  { id: 'Teguise', label: 'Teguise', islandId: 'Lanzarote' },
  { id: 'Tías', label: 'Tías', islandId: 'Lanzarote' },
  { id: 'San Bartolomé', label: 'San Bartolomé', islandId: 'Lanzarote' },
  { id: 'Yaiza', label: 'Yaiza', islandId: 'Lanzarote' },
  { id: 'Haría', label: 'Haría', islandId: 'Lanzarote' },
  { id: 'Tinajo', label: 'Tinajo', islandId: 'Lanzarote' },

  // FUERTEVENTURA
  { id: 'Puerto del Rosario', label: 'Puerto del Rosario', islandId: 'Fuerteventura' },
  { id: 'La Oliva', label: 'La Oliva', islandId: 'Fuerteventura' },
  { id: 'Pájara', label: 'Pájara', islandId: 'Fuerteventura' },
  { id: 'Tuineje', label: 'Tuineje', islandId: 'Fuerteventura' },
  { id: 'Antigua', label: 'Antigua', islandId: 'Fuerteventura' },
  { id: 'Betancuria', label: 'Betancuria', islandId: 'Fuerteventura' },

  // TENERIFE
  { id: 'Santa Cruz de Tenerife', label: 'Santa Cruz de Tenerife', islandId: 'Tenerife' },
  { id: 'San Cristóbal de La Laguna', label: 'La Laguna', islandId: 'Tenerife' },
  { id: 'Arona', label: 'Arona', islandId: 'Tenerife' },
  { id: 'Granadilla de Abona', label: 'Granadilla', islandId: 'Tenerife' },
  { id: 'Adeje', label: 'Adeje', islandId: 'Tenerife' },
  { id: 'La Orotava', label: 'La Orotava', islandId: 'Tenerife' },
  { id: 'Los Realejos', label: 'Los Realejos', islandId: 'Tenerife' },
  { id: 'Puerto de la Cruz', label: 'Puerto de la Cruz', islandId: 'Tenerife' },
  { id: 'Candelaria', label: 'Candelaria', islandId: 'Tenerife' },
  { id: 'Icod de los Vinos', label: 'Icod', islandId: 'Tenerife' },
  { id: 'Tacoronte', label: 'Tacoronte', islandId: 'Tenerife' },
  { id: 'Guía de Isora', label: 'Guía de Isora', islandId: 'Tenerife' },
  { id: 'Güímar', label: 'Güímar', islandId: 'Tenerife' },
  { id: 'El Rosario', label: 'El Rosario', islandId: 'Tenerife' },
  { id: 'San Miguel de Abona', label: 'San Miguel de A.', islandId: 'Tenerife' },
  { id: 'Santa Úrsula', label: 'Santa Úrsula', islandId: 'Tenerife' },
  { id: 'Tegueste', label: 'Tegueste', islandId: 'Tenerife' },

  // LA PALMA
  { id: 'Santa Cruz de La Palma', label: 'S.C. de La Palma', islandId: 'La Palma' },
  { id: 'Los Llanos de Aridane', label: 'Los Llanos', islandId: 'La Palma' },
  { id: 'El Paso', label: 'El Paso', islandId: 'La Palma' },
  { id: 'Breña Alta', label: 'Breña Alta', islandId: 'La Palma' },
  { id: 'Tazacorte', label: 'Tazacorte', islandId: 'La Palma' },

  // LA GOMERA
  { id: 'San Sebastián de La Gomera', label: 'San Sebastián', islandId: 'La Gomera' },
  { id: 'Valle Gran Rey', label: 'Valle Gran Rey', islandId: 'La Gomera' },
  { id: 'Alajeró', label: 'Alajeró', islandId: 'La Gomera' },

  // EL HIERRO
  { id: 'Valverde', label: 'Valverde', islandId: 'El Hierro' },
  { id: 'La Frontera', label: 'La Frontera', islandId: 'El Hierro' },
  { id: 'El Pinar', label: 'El Pinar', islandId: 'El Hierro' }
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
