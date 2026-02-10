import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  const { visits, addVisit, updateVisit, deleteVisit, refresh: visitsRefresh } = useVisits()
  const { sales, addSale, updateSale, deleteSale, refresh: salesRefresh } = useSales()
  const { distributors, addDistributor, updateDistributor, deleteDistributor, refresh: distributorsRefresh } =
    useDistributors({ sales, visits })
  const { candidates, addCandidate, updateCandidate, deleteCandidate, moveCandidate, reorderCandidate, refresh: candidatesRefresh } =
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

  const addCandidateWithDefault = useCallback(
    async (payload: any) => {
      // Usar la primera etapa del pipeline si no se especifica una
      const defaultStageId = dynamicPipelineStages[0]?.id || 'new'
      return addCandidate({
        ...payload,
        stage: payload.stage || defaultStageId
      })
    },
    [addCandidate, dynamicPipelineStages]
  )

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

  const removePipelineStage = (id: PipelineStageId) => {
    // Evitar dejar el pipeline vacío o con menos de 2 etapas fundamentales si se desea, 
    // pero por ahora permitimos libertad.
    setDynamicPipelineStages(prev => prev.filter(s => s.id !== id))
  }

  const reorderPipelineStage = (id: PipelineStageId, direction: 'up' | 'down') => {
    setDynamicPipelineStages(prev => {
      const index = prev.findIndex(s => s.id === id)
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === prev.length - 1) return prev

      const newStages = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      const temp = newStages[index]
      newStages[index] = newStages[targetIndex]
      newStages[targetIndex] = temp
      return newStages
    })
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
    callCenter: {
      ...emptyCallCenter,
      helpers: {
        nextCandidateStage: (stageId: PipelineStageId | null | undefined) => {
          if (!stageId) return dynamicPipelineStages[0]?.id || null
          const idx = dynamicPipelineStages.findIndex(s => s.id === stageId)
          if (idx === -1 || idx === dynamicPipelineStages.length - 1) return null
          return dynamicPipelineStages[idx + 1].id
        },
        previousCandidateStage: (stageId: PipelineStageId | null | undefined) => {
          if (!stageId) return null
          const idx = dynamicPipelineStages.findIndex(s => s.id === stageId)
          if (idx <= 0) return null
          return dynamicPipelineStages[idx - 1].id
        }
      }
    },
    validators: {},
    notifications: sync.notifications,
    setNotifications: sync.setNotifications,
    syncStatus: sync.syncStatus,
    // Implementación robusta de forceSync (Push & Pull)
    forceSync: async () => {
      // 1. Empujar cambios locales pendientes
      await sync.forceSync()

      // 2. Traer datos frescos del servidor (Pull)
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          await Promise.all([
            visitsRefresh(),
            salesRefresh(),
            distributorsRefresh(),
            candidatesRefresh(),
            // Recargar configuraciones dinámicas también
            (async () => {
              const { data: s } = await supabase.from('sectorsGPV').select('*')
              if (s && s.length > 0) setDynamicSectors(s)

              const { data: b } = await supabase.from('brandsGPV').select('*')
              if (b && b.length > 0) {
                const mapped = b.map((item: any) => ({
                  id: item.id,
                  label: item.label,
                  sectorId: item.sector_id
                }))
                setDynamicBrands(mapped)
              }
            })()
          ])

          sync.setNotifications(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'success',
              title: 'Sincronización completa',
              description: 'Datos actualizados desde el servidor.',
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } catch (error) {
          console.error('Error in pull sync:', error)
        }
      }
    },
    isOnline: sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingSync: sync.syncQueue.length,
    addUser: () => emptyUser,
    updateUser: () => { },
    removeUser: () => { },
    setCurrentUser: () => { },
    updatePreferences: () => { },
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addCandidate: addCandidateWithDefault,
    updateCandidate,
    deleteCandidate,
    removeCandidate: deleteCandidate,
    moveCandidate,
    reorderCandidate,
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
    updatePipelineStage,
    removePipelineStage,
    reorderPipelineStage
  }

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  )
}
