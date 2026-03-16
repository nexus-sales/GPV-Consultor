import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { DataContext } from './context'
import { supabase } from './supabaseClient'
import { useSyncQueue } from './hooks/useSyncQueue'
import { isSupabaseConfigured } from './config'
import { logger } from './logger'
import { useDistributors } from './hooks/useDistributors'
import { useCandidates } from './hooks/useCandidates'
import { useVisits } from './hooks/useVisits'
import { useSales } from './hooks/useSales'
import { useLeads } from './hooks/useLeads'
import { useCommissionAgreements } from './hooks/useCommissionAgreements'
import type {
  AppContextType,
  User,
  Preferences,
  LookupOption,
  Sector,
  PipelineStage,
  PipelineStageId,
  CallCenterTask
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
export function DataProvider({ children }: { children: React.ReactNode }) {
  const sync = useSyncQueue()
  const { visits, addVisit, updateVisit, deleteVisit, refresh: visitsRefresh } = useVisits()
  const { sales, addSale, updateSale, deleteSale, refresh: salesRefresh } = useSales()
  const { distributors, addDistributor, updateDistributor, deleteDistributor, refresh: distributorsRefresh } =
    useDistributors({ sales, visits })
  const { candidates, addCandidate, updateCandidate, deleteCandidate, moveCandidate, reorderCandidate, refresh: candidatesRefresh } =
    useCandidates()
  const { leads, addLead, updateLead, deleteLead, refresh: leadsRefresh } = useLeads()
  const {
    agreements: commissionAgreements,
    addCommissionAgreement,
    updateCommissionAgreement,
    deleteCommissionAgreement,
    refresh: commissionAgreementsRefresh
  } = useCommissionAgreements()


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
      if (!isSupabaseConfigured) return
      try {
        const { data: sectorsData } = await supabase.from('sectorsGPV').select('*')
        if (sectorsData && sectorsData.length > 0) {
          setDynamicSectors(sectorsData)
        }

        const { data: brandsData } = await supabase.from('brandsGPV').select('*')
        if (brandsData && brandsData.length > 0) {
          // Mapear sector_id a sectorId (DB usa snake_case para esta tabla de lookup)
          const mappedBrands = brandsData.map((b: { id: string; label: string; sector_id?: string; sectorId?: string }) => ({
            id: b.id,
            label: b.label,
            sectorId: b.sector_id || b.sectorId || ''
          }))
          setDynamicBrands(mappedBrands)
        }
      } catch (error) {
        logger.error('[Data] Error fetching dynamic config', error)
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
        metadata: { sector: String(s.sectorId ?? '') }
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
    commissionAgreements,
    candidates,
    leads,
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
    callCenter: useMemo(() => {
      const tasks: {
        firstContact: CallCenterTask[]
        followUp: CallCenterTask[]
        activation: CallCenterTask[]
        postVisit: CallCenterTask[]
      } = {
        firstContact: [],
        followUp: [],
        activation: [],
        postVisit: []
      }

      const lookup: {
        byCandidate: Record<string, CallCenterTask[]>
        byDistributor: Record<string, CallCenterTask[]>
        byVisit: Record<string, CallCenterTask>
      } = {
        byCandidate: {},
        byDistributor: {},
        byVisit: {}
      }

      // 1. Tareas de Candidatos (Pipeline)
      candidates.forEach(c => {
        const hasContact = !!(c.contact?.phone || c.contact?.email)
        const task: CallCenterTask = {
          id: `task-can-${c.id}`,
          refType: 'candidate',
          refId: c.id,
          candidateId: c.id,
          distributorId: null,
          name: c.name,
          contact: c.contact?.name || 'Titular',
          phone: c.contact?.phone || '',
          email: c.contact?.email || '',
          stageId: c.stage,
          pendingData: !hasContact,
          note: c.notes || '',
          context: `Etapa: ${dynamicPipelineStages.find(s => s.id === c.stage)?.label || c.stage}`,
          location: [c.city, c.province].filter(Boolean).join(', '),
          taskType: 'first-contact', // Default
          priority: 'medium',
          dueDate: null,
          isOverdue: false,
          meta: c.stage
        }

        if (c.stage === 'new') {
          task.taskType = 'first-contact'
          task.priority = 'high'
          tasks.firstContact.push(task)
        } else if (c.stage === 'contacted' || c.stage === 'evaluation') {
          task.taskType = 'follow-up'
          tasks.followUp.push(task)
        } else if (c.stage === 'approved') {
          task.taskType = 'activation'
          task.priority = 'high'
          tasks.activation.push(task)
        }

        if (!lookup.byCandidate[c.id]) lookup.byCandidate[c.id] = []
        lookup.byCandidate[c.id].push(task)
      })

      // 2. Tareas de Visitas (Post-Visita)
      visits.forEach(v => {
        // Si la visita es reciente y no tiene resultado, o es post-visita específica
        const isRecent = v.date && new Date(v.date) <= new Date()
        if (isRecent && (!v.result || v.result === 'pendiente')) {
          const distributor = distributors.find(d => d.id === v.distributorId)
          const task: CallCenterTask = {
            id: `task-vis-${v.id}`,
            refType: 'visit',
            refId: v.id,
            visitId: v.id,
            distributorId: v.distributorId,
            candidateId: null,
            name: distributor?.name || 'Distribuidor desconocido',
            contact: distributor?.contactPerson || 'Titular',
            phone: distributor?.phone || '',
            email: distributor?.email || '',
            stageId: null,
            pendingData: !distributor?.phone,
            note: v.summary || 'Pendiente de registrar resultado de visita.',
            context: 'Seguimiento tras visita comercial',
            location: distributor?.city || '',
            taskType: 'post-visit',
            priority: 'medium',
            dueDate: v.date,
            isOverdue: new Date(v.date) < new Date(new Date().setHours(0,0,0,0)),
            meta: v.type || 'seguimiento'
          }
          tasks.postVisit.push(task)
          lookup.byVisit[v.id] = task
        }
      })

      const allTasks = [
        ...tasks.firstContact,
        ...tasks.followUp,
        ...tasks.activation,
        ...tasks.postVisit
      ]

      const stats = {
        total: allTasks.length,
        urgent: allTasks.filter(t => t.priority === 'high' || t.isOverdue).length,
        contactable: allTasks.filter(t => t.phone || t.email).length,
        missingData: allTasks.filter(t => !t.phone && !t.email).length,
        nextTask: allTasks.find(t => t.phone && (t.priority === 'high' || t.isOverdue)) || allTasks.find(t => t.phone) || null
      }

      return {
        tasks,
        stats,
        lookup,
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
      }
    }, [candidates, visits, distributors, dynamicPipelineStages]),
    validators: {},
    notifications: sync.notifications,
    setNotifications: sync.setNotifications,
    isSupabaseConfigured,
    syncStatus: sync.syncStatus,
    // Implementación robusta de forceSync (Push & Pull)
    forceSync: async () => {
      // 1. Empujar cambios locales pendientes
      await sync.forceSync()

      // 2. Traer datos frescos del servidor (Pull)
      if (typeof window !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
        try {
          await Promise.all([
            visitsRefresh(),
            salesRefresh(),
            distributorsRefresh(),
            candidatesRefresh(),
            leadsRefresh(),
            commissionAgreementsRefresh(),
            // Recargar configuraciones dinámicas también
            (async () => {
              const { data: s } = await supabase.from('sectorsGPV').select('*')
              if (s && s.length > 0) setDynamicSectors(s)

              const { data: b } = await supabase.from('brandsGPV').select('*')
              if (b && b.length > 0) {
                const mapped = b.map((item: any) => ({
                  id: item.id,
                  label: item.label,
                  sectorId: item.sector_id || item.sectorId || ''
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
          logger.error('[Sync] Error in pull sync', error)
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
    addLead,
    updateLead,
    deleteLead,
    removeCandidate: deleteCandidate,
    moveCandidate,
    reorderCandidate,
    addVisit,
    updateVisit,
    deleteVisit,
    addSale,
    updateSale,
    deleteSale,
    addCommissionAgreement,
    updateCommissionAgreement,
    deleteCommissionAgreement,
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
