import React, { useState, useEffect, useMemo } from 'react'
import { DataContext } from './context'
import { supabase } from './supabaseClient'
import { useSyncQueue } from './hooks/useSyncQueue'
import { useDistributors } from './hooks/useDistributors'
import { useCandidates } from './hooks/useCandidates'
import { useVisits } from './hooks/useVisits'
import { useSales } from './hooks/useSales'
import type {
  AppContextType,
  User,
  Preferences,
  LookupOption,
  Sector,
  PipelineStage,
  PipelineStageId,
  CallCenterSummary
} from './types'
import {
  brandOptions,
  channelOptions,
  statusOptions,
  provinceOptions,
  pipelineStages,
  sectors
} from './data/config'
import { calculateAllKPIs } from './data/kpiCalculations'

// Valores por defecto mínimos para evitar errores de tipado
const emptyUser: User = {
  id: '',
  fullName: '',
  email: '',
  role: '',
  region: '',
  permissions: '',
  phone: '',
  avatarInitials: '',
  lastLogin: '',
  createdAt: '',
  activity: []
}
const emptyPreferences: Preferences = {
  privacyEmail: '',
  allowDataExports: false
}
const emptyCallCenter: CallCenterSummary = {
  tasks: { firstContact: [], followUp: [], activation: [], postVisit: [] },
  stats: {
    total: 0,
    urgent: 0,
    contactable: 0,
    missingData: 0,
    nextTask: null
  },
  lookup: { byCandidate: {}, byDistributor: {}, byVisit: {} },
  helpers: {
    nextCandidateStage: () => null,
    previousCandidateStage: () => null
  }
}
export function DataProvider({ children }: { children: React.ReactNode }) {
  const sync = useSyncQueue()
  const { visits, addVisit, updateVisit, deleteVisit } = useVisits()
  const { sales, addSale, updateSale, deleteSale } = useSales()
  const { distributors, addDistributor, updateDistributor, deleteDistributor } =
    useDistributors({ sales, visits })
  const { candidates, addCandidate, updateCandidate, deleteCandidate } =
    useCandidates()

  // ✅ Estado para configuración dinámica (Marcas y Sectores)
  const [dynamicSectors, setDynamicSectors] = useState<Sector[]>(() => {
    const saved = localStorage.getItem('gpv_sectors')
    return saved ? JSON.parse(saved) : sectors
  })

  const [dynamicBrands, setDynamicBrands] = useState<LookupOption[]>(() => {
    const saved = localStorage.getItem('gpv_brands')
    return saved ? JSON.parse(saved) : brandOptions
  })

  // ✅ Estado para Pipeline Dinámico (Stages)
  const [dynamicPipelineStages, setDynamicPipelineStages] = useState<PipelineStage[]>(() => {
    const saved = localStorage.getItem('gpv_pipeline_stages')
    return saved ? JSON.parse(saved) : pipelineStages
  })

  // Cargar configuración desde Supabase al iniciar
  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data: sectorsData } = await supabase.from('sectorsGPV').select('*')
        if (sectorsData && sectorsData.length > 0) {
          setDynamicSectors(sectorsData)
        }

        const { data: brandsData } = await supabase.from('brandsGPV').select('*')
        if (brandsData && brandsData.length > 0) {
          // Mapear de snake_case (DB) a camelCase (App)
          const mappedBrands = brandsData.map((b: { id: string; label: string; sector_id: string }) => ({
            id: b.id,
            label: b.label,
            sectorId: b.sector_id
          }))
          setDynamicBrands(mappedBrands)
        }
      } catch (error) {
        console.error('[Data] Error fetching dynamic config:', error)
      }
    }
    fetchConfig()
  }, [])

  // Persistencia Local
  useEffect(() => {
    localStorage.setItem('gpv_sectors', JSON.stringify(dynamicSectors))
  }, [dynamicSectors])

  useEffect(() => {
    localStorage.setItem('gpv_brands', JSON.stringify(dynamicBrands))
  }, [dynamicBrands])

  useEffect(() => {
    localStorage.setItem('gpv_pipeline_stages', JSON.stringify(dynamicPipelineStages))
  }, [dynamicPipelineStages])

  const addBrand = (payload: { label: string; sectorId: string }) => {
    const id = payload.label.toLowerCase().trim().replace(/\s+/g, '_')
    if (dynamicBrands.find(b => b.id === id)) return // Evitar duplicados simples
    const newBrand = { ...payload, id }
    setDynamicBrands(prev => [...prev, newBrand])

    // Mapear a snake_case para la DB
    sync.addToSyncQueue({
      table: 'brands',
      type: 'create',
      data: {
        id: newBrand.id,
        label: newBrand.label,
        sector_id: newBrand.sectorId
      }
    })
  }

  const removeBrand = (id: string) => {
    setDynamicBrands(prev => prev.filter(b => b.id !== id))
    sync.addToSyncQueue({ table: 'brands', type: 'delete', data: { id } })
  }

  const addSector = (payload: Sector) => {
    setDynamicSectors(prev => [...prev, payload])
    sync.addToSyncQueue({ table: 'sectors', type: 'create', data: payload })
  }

  const removeSector = (id: string) => {
    setDynamicSectors(prev => prev.filter(s => s.id !== id))
    // Limpiar marcas del sector eliminado si se desea
    setDynamicBrands(prev => prev.filter(b => b.sectorId !== id))

    sync.addToSyncQueue({ table: 'sectors', type: 'delete', data: { id } })
  }

  const addPipelineStage = (payload: PipelineStage) => {
    setDynamicPipelineStages(prev => [...prev, payload])
    // Nota: Si existiera tabla en DB, aquí iría el sync
  }

  const updatePipelineStage = (id: PipelineStageId, updates: Partial<PipelineStage>) => {
    setDynamicPipelineStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  // Calcular KPIs reales para las estadísticas globales
  const kpis = useMemo(() => {
    return calculateAllKPIs(distributors, candidates, visits, sales)
  }, [distributors, candidates, visits, sales])

  const stats = useMemo(() => ({
    activeDistributors: distributors.filter(d => d.status === 'active').length,
    pendingDistributors: distributors.filter(d => d.status === 'pending').length,
    totalOperations: sales.length,
    visitsLast7Days: kpis.visitorsThisWeek.total,
    candidatesInPipeline: candidates.length,
    pipelineCounts: dynamicPipelineStages.map(stage => ({
      stageId: stage.id,
      count: candidates.filter(c => c.stage === stage.id).length
    })),
    operationsByBrand: kpis.salesByBrand.map((s: any) => ({
      brandId: s.brand,
      label: dynamicBrands.find((b) => b.id === s.brand)?.label || s.brand,
      value: s.operations
    })),
    operationsBySector: kpis.salesBySector,
    latestActivities: [
      ...sales.slice(-3).map(s => ({
        id: String(s.id),
        type: 'sale' as const,
        title: `Venta: ${dynamicBrands.find(b => b.id === s.brand)?.label || s.brand}`,
        description: `Registrada el ${s.date}`,
        timestamp: s.date,
        priority: 'medium' as const,
        metadata: { sector: s.sectorId }
      })),
      ...visits.slice(-3).map(v => ({
        id: String(v.id),
        type: 'visit' as const,
        title: 'Visita Comercial',
        description: v.summary || 'Sin resumen',
        timestamp: v.date,
        priority: 'low' as const,
        metadata: { result: v.result }
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5)
  }), [distributors, candidates, visits, sales, kpis, dynamicBrands, dynamicSectors])

  const contextValue: AppContextType = {
    users: [emptyUser],
    currentUser: emptyUser,
    currentUserId: '',
    preferences: emptyPreferences,
    distributors,
    candidates,
    visits,
    sales,
    lookups: {
      brands: dynamicBrands.reduce((acc, b) => ({ ...acc, [b.id]: b }), {}),
      channels: channelOptions.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}),
      statuses: statusOptions.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
      stages: dynamicPipelineStages.reduce((acc, s) => ({ ...acc, [s.id]: s }), {})
    },
    formatters: {
      daysDifference: (isoDate: string) => Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / (1000 * 3600 * 24)),
      formatRelativeTime: (d: string) => d,
      relative: (d: string) => d
    },
    taxonomy: {
      rules: [],
      resolveCategory: (_code) => ({
        id: 'general',
        label: 'General',
        description: 'Sin restricciones específicas',
        badgeClass: 'bg-gray-100 text-gray-600',
        tooltip: '',
        brandPolicy: { allowed: null, blocked: [], conditional: [], note: '' },
        pendingData: false
      }),
      deriveBrandsForChannel: (brands, _channel) => brands || []
    },
    pipelineStages: dynamicPipelineStages,
    sectors: dynamicSectors,
    brandOptions: dynamicBrands,
    channelOptions,
    statusOptions,
    provinceOptions,
    stats,
    callCenter: emptyCallCenter,
    validators: {},
    notifications: sync.notifications,
    setNotifications: sync.setNotifications,
    syncStatus: sync.syncStatus,
    forceSync: sync.forceSync,
    isOnline: sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingSync: sync.syncQueue.length,
    addUser: () => emptyUser,
    updateUser: () => { },
    removeUser: () => { },
    setCurrentUser: () => { },
    updatePreferences: () => {},
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    removeCandidate: () => { },
    moveCandidate: async () => { },
    reorderCandidate: async () => { },
    addVisit,
    updateVisit,
    deleteVisit,
    addSale,
    updateSale,
    deleteSale,
    addBrand,
    removeBrand,
    addSector,
    removeSector,
    addPipelineStage,
    updatePipelineStage
  }

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  )
}
