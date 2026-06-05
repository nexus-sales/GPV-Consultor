import React, { useState, useMemo, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  InformationCircleIcon,
  UserPlusIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ShareIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import { useDebounce } from '../lib/hooks/useDebounce'
import {
  searchPlaces,
  getPlaceDetails,
  type GooglePlaceResult
} from '../lib/data/googlePlacesService'
import {
  normalizeForFilter,
  matchIslandWithInference,
  matchMunicipality
} from '../utils/geoUtils'
import { exportLeads } from '../lib/utils/excel'
import type { Lead, LeadUpdates, NewCandidate } from '../lib/types'

const Leads: React.FC = () => {
  const {
    leads,
    addLead,
    updateLead,
    deleteLead,
    addCandidate,
    pipelineStages,
    provinceOptions = [],
    islandOptions = [],
    municipalityOptions = []
  } = useAppData()

  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [agreedGDPR, setAgreedGDPR] = useState(false)
  const [gdprError, setGdprError] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([])
  const [viewMode, setViewMode] = useState<'existing' | 'search'>('existing')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; nombre: string } | null>(null)
  const [displayMode, setDisplayMode] = useState<'list' | 'grid'>(() =>
    window.innerWidth < 1024 ? 'grid' : 'list'
  )

  // Filtros Avanzados
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterProvince, setFilterProvince] = useState('all')
  const [filterIsland, setFilterIsland] = useState('all')
  const [filterMunicipality, setFilterMunicipality] = useState('all')
  const [filterSector, setFilterSector] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'date'>('name')

  // Sectores disponibles
  const sectorOptions = useMemo(() => {
    const set = new Set((leads || []).map((l) => l.sector).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])


  // Paginación
  const [pageSize] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setDisplayMode('grid')
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [
    debouncedSearchTerm,
    filterStatus,
    filterSource,
    filterProvince,
    filterIsland,
    filterMunicipality,
    filterSector
  ])

  // Modal de notas
  const [noteModal, setNoteModal] = useState<{
    leadId: string
    leadNombre: string
    nota: string
  } | null>(null)

  const handleSaveNote = async () => {
    if (!noteModal) return
    await updateLead(noteModal.leadId, { notas: noteModal.nota })
    showNotification('Nota guardada correctamente', 'success')
    setNoteModal(null)
  }

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sector || !city) return

    setIsSearching(true)
    setSearchError(null)
    setViewMode('search')
    try {
      const query = `${sector} ${city}`
      const results = await searchPlaces(query)
      setSearchResults(results)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Error desconocido al contactar con Google Maps')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportLead = async (placeResult: GooglePlaceResult) => {
    if (!agreedGDPR) {
      setGdprError(true)
      showNotification('Debes aceptar la política de privacidad para importar leads.', 'error')
      return
    }
    setGdprError(false)

    if (leads.find((l) => l.place_id === placeResult.place_id)) {
      showNotification('Este lead ya ha sido importado anteriormente.', 'info')
      return
    }

    const details = await getPlaceDetails(placeResult.place_id)

    if (!details) {
      showNotification(
        'No se pudieron obtener los detalles del lugar.',
        'error'
      )
      return
    }

    // Inferir isla si no se detecta directamente en los componentes de Google
    // (Podemos usar el mismo logic que en el filtro o simplemente guardarla)
    const provinceId = provinceOptions.find(
      (p) => p.label.toLowerCase() === (details.provincia || '').toLowerCase()
    )?.id

    let islandId = ''
    if (provinceId) {
      // Intentar buscar por municipio
      const mun = municipalityOptions.find(
        (m) =>
          m.label.toLowerCase() === (details.city || city || '').toLowerCase()
      )
      if (mun) {
        islandId = mun.islandId
      }
    }

    const newLead: Partial<Lead> = {
      fuente: 'google_places',
      nombre: details.name || placeResult.name,
      telefono: details.formatted_phone_number,
      web: details.website,
      direccion: details.formatted_address,
      ciudad: details.city || city || '',
      provincia: details.provincia || '',
      isla: islandId || '',
      codigo_postal: details.postalCode || '',
      sector: sector,
      rating: details.rating,
      reviews_count: details.user_ratings_total,
      place_id: placeResult.place_id,
      estado: 'nuevo'
    }

    await addLead(newLead)
    setSearchResults((prev) =>
      prev.filter((r) => r.place_id !== placeResult.place_id)
    )
  }

  // Componente de fila optimizado
  const LeadRow = React.memo(({ lead, updateLead, onNote, onConvert, onDelete }: { 
    lead: Lead;
    updateLead: (id: string, updates: LeadUpdates) => Promise<void>;
    onNote: (l: Lead) => void;
    onConvert: (l: Lead) => void;
    onDelete: (lead: { id: string; nombre: string }) => void;
  }) => (
    <tr
      className={`transition-colors ${
        lead.estado === 'cliente'
          ? 'bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200/70'
          : lead.estado === 'interesado'
            ? 'bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200/70'
            : lead.estado === 'contactado'
              ? 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200/70'
              : lead.estado === 'pendiente'
                ? 'bg-amber-100 dark:bg-amber-900/20 hover:bg-amber-200/70'
                : lead.estado === 'rechazado'
                  ? 'bg-rose-100 dark:bg-rose-900/20 hover:bg-rose-200/70'
                  : lead.estado === 'descartado'
                    ? 'bg-slate-200 dark:bg-slate-700/40 opacity-70 hover:opacity-90'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
      }`}
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm">
            {lead.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
              {lead.nombre}
            </div>
            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
              <BuildingOfficeIcon className="h-3 w-3" />
              {lead.sector}
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 font-medium">
            <MapPinIcon className="h-4 w-4 text-red-500" />
            {lead.ciudad}
          </div>
          <div className="text-[10px] ml-6 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic">
            {[lead.isla, lead.provincia].filter(Boolean).join(' · ')}
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="space-y-1">
          {lead.telefono && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
              <PhoneIcon className="h-4 w-4 text-slate-400" />
              {lead.telefono}
            </div>
          )}
          {lead.web && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
              <GlobeAltIcon className="h-4 w-4 text-blue-400" />
              <a
                href={lead.web.startsWith('http') ? lead.web : `https://${lead.web}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline truncate max-w-[150px]"
              >
                Sitio Web
              </a>
            </div>
          )}
        </div>
      </td>
      <td className="px-8 py-6">
        {lead.rating ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-3.5 w-3.5 ${i < Math.floor(lead.rating!) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium">{lead.rating} · {lead.reviews_count ?? 0} reseñas</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
        )}
      </td>
      <td className="px-8 py-6">
        <select
          value={lead.estado}
          onChange={(e) => {
            const nuevoEstado = e.target.value as Lead['estado']
            updateLead(lead.id, {
              estado: nuevoEstado,
              ...(nuevoEstado === 'cliente' && !lead.convertedAt
                ? { convertedAt: new Date().toISOString() }
                : {})
            })
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-none ring-1 outline-none focus:ring-2 transition-all cursor-pointer ${
            lead.estado === 'nuevo'
              ? 'bg-slate-100 text-slate-600 ring-slate-200'
              : lead.estado === 'contactado'
                ? 'bg-blue-50 text-blue-600 ring-blue-200'
                : lead.estado === 'pendiente'
                  ? 'bg-amber-50 text-amber-600 ring-amber-200'
                  : lead.estado === 'rechazado'
                    ? 'bg-rose-50 text-rose-600 ring-rose-200'
                    : lead.estado === 'interesado'
                      ? 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                      : 'bg-gray-100 text-gray-600 ring-gray-200'
          }`}
        >
          <option value="nuevo">Nuevo</option>
          <option value="pendiente">Pendiente</option>
          <option value="contactado">Contactado</option>
          <option value="interesado">Interesado</option>
          <option value="rechazado">Rechazado</option>
          <option value="cliente">Cliente</option>
          <option value="descartado">Descartado</option>
        </select>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onNote(lead)}
            className={`p-2 rounded-xl transition-colors ${
              lead.notas
                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Ver/Editar Notas"
          >
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onConvert(lead)}
            disabled={lead.estado === 'interesado'}
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              lead.estado === 'interesado'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-sm'
            }`}
          >
            {lead.estado === 'interesado' ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <UserPlusIcon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {lead.estado === 'interesado' ? 'Creado' : 'Convertir'}
            </span>
          </button>
          <button
            onClick={() => onDelete({ id: lead.id, nombre: lead.nombre })}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="Eliminar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  ))

  const handleConvertToCandidate = async (lead: Lead) => {
    // Evitar duplicados
    if (lead.estado === 'interesado') {
      showNotification(
        'Este prospecto ya ha sido convertido a candidato.',
        'info'
      )
      return
    }

    const candidatePayload: NewCandidate = {
      name: lead.nombre,
      city: lead.ciudad || '',
      province: lead.provincia || '',
      island: lead.isla || '',
      postalCode: lead.codigo_postal || '',
      address: lead.direccion || '',
      contact: {
        phone: lead.telefono || '',
        email: lead.email || '',
        name: lead.nombre
      },
      source: `Lead: ${lead.fuente}`,
      stage: pipelineStages[0]?.id || 'new',
      notes: `Lead importado de Google Places. Sector: ${lead.sector}. Rating: ${lead.rating}, Reviews: ${lead.reviews_count}. Website: ${lead.web}`
    }

    try {
      await addCandidate(candidatePayload)
      await updateLead(lead.id, {
        estado: 'interesado',
        notas:
          (lead.notas || '') +
          `\nConvertido a candidato el ${new Date().toLocaleDateString()}.`
      })
      showNotification('¡Candidato creado con éxito!', 'success')
    } catch {
      showNotification('Error al crear el candidato.', 'error')
    }
  }

  const filteredLeads = useMemo(() => {
    let result = [...(leads || [])]

    // Búsqueda textual
    if (debouncedSearchTerm) {
      const lower = debouncedSearchTerm.toLowerCase()
      result = result.filter(
        (l) =>
          l.nombre.toLowerCase().includes(lower) ||
          l.ciudad?.toLowerCase().includes(lower) ||
          l.provincia?.toLowerCase().includes(lower) ||
          l.isla?.toLowerCase().includes(lower) ||
          l.sector?.toLowerCase().includes(lower)
      )
    }

    // Filtro por estado
    if (filterStatus !== 'all') {
      result = result.filter((l) => l.estado === filterStatus)
    }

    // Filtro por fuente
    if (filterSource !== 'all') {
      result = result.filter((l) => l.fuente === filterSource)
    }

    // Filtro por provincia
    if (filterProvince !== 'all') {
      result = result.filter(
        (l) =>
          normalizeForFilter(l.provincia) === normalizeForFilter(filterProvince)
      )
    }

    // Filtro por isla
    if (filterIsland !== 'all') {
      result = result.filter((l) =>
        matchIslandWithInference(
          l.isla,
          l.ciudad,
          filterIsland,
          municipalityOptions
        )
      )
    }

    // Filtro por municipio
    if (filterMunicipality !== 'all') {
      result = result.filter((l) =>
        matchMunicipality(l.ciudad, filterMunicipality, municipalityOptions)
      )
    }

    // Filtro por sector
    if (filterSector !== 'all') {
      result = result.filter((l) => l.sector === filterSector)
    }

    // Ordenación
    result.sort((a, b) => {
      if (sortBy === 'name') return a.nombre.localeCompare(b.nombre)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [
    leads,
    debouncedSearchTerm,
    filterStatus,
    filterSource,
    filterProvince,
    filterIsland,
    filterMunicipality,
    filterSector,
    sortBy,
    municipalityOptions
  ])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  }, [filteredLeads.length, pageSize])

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLeads.slice(start, start + pageSize)
  }, [currentPage, filteredLeads, pageSize])

  // Componente interno para renderizado diferido de cards si la lista es grande
  const LeadCard = React.memo(({ lead, onConvert, onNote }: { lead: Lead; onConvert: (l: Lead) => void; onNote: (l: Lead) => void }) => (
    <div className={`p-4 rounded-xl border bg-white dark:bg-gray-800 transition-all ${
      lead.estado === 'interesado' ? 'border-indigo-500/30' : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">{lead.nombre}</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
          lead.estado === 'nuevo' ? 'bg-blue-50 text-blue-600' :
          lead.estado === 'interesado' ? 'bg-indigo-50 text-indigo-600' :
          'bg-gray-50 text-gray-600'
        }`}>
          {lead.estado}
        </span>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="h-3.5 w-3.5" />
          <span className="truncate">{lead.ciudad || 'No especificada'}</span>
        </div>
        {lead.telefono && (
          <div className="flex items-center gap-1.5">
            <PhoneIcon className="h-3.5 w-3.5" />
            <span>{lead.telefono}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onNote(lead)}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Notas
        </button>
        <button 
          onClick={() => onConvert(lead)}
          disabled={lead.estado === 'interesado'}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg text-white ${
            lead.estado === 'interesado' ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          Convertir
        </button>
      </div>
    </div>
  ))

  const handleNoteClick = (lead: Lead) => {
    setNoteModal({ leadId: lead.id, leadNombre: lead.nombre, nota: lead.notas || '' })
  }

  // Resetear página al filtrar
  React.useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    filterStatus,
    filterProvince,
    filterIsland,
    filterMunicipality,
    filterSector,
    pageSize
  ])

  // const provincias = useMemo(() => {
  //   const set = new Set(leads.map((l) => l.provincia).filter(Boolean))
  //   return Array.from(set).sort()
  // }, [leads])

  const handleExport = () => {
    exportLeads(filteredLeads)
  }

  const getPageNumbers = (current: number, total: number): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
    return pages
  }

  const activeFilters = [
    filterStatus !== 'all' && { key: 'estado', label: `Estado: ${filterStatus}`, clear: () => setFilterStatus('all') },
    filterSource !== 'all' && { key: 'fuente', label: `Fuente: ${{ google_places: 'Google Places', serp_web: 'SERP Web', google_ads: 'Google Ads', manual: 'Manual' }[filterSource] ?? filterSource}`, clear: () => setFilterSource('all') },
    filterSector !== 'all' && { key: 'sector', label: `Sector: ${filterSector}`, clear: () => setFilterSector('all') },
    filterProvince !== 'all' && { key: 'provincia', label: `Provincia: ${provinceOptions.find(p => p.id === filterProvince)?.label ?? filterProvince}`, clear: () => { setFilterProvince('all'); setFilterIsland('all'); setFilterMunicipality('all') } },
    filterIsland !== 'all' && { key: 'isla', label: `Isla: ${islandOptions.find(i => i.id === filterIsland)?.label ?? filterIsland}`, clear: () => { setFilterIsland('all'); setFilterMunicipality('all') } },
    filterMunicipality !== 'all' && { key: 'municipio', label: `Municipio: ${municipalityOptions.find(m => m.id === filterMunicipality)?.label ?? filterMunicipality}`, clear: () => setFilterMunicipality('all') },
    searchTerm && { key: 'texto', label: `"${searchTerm}"`, clear: () => setSearchTerm('') },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[]

  const clearAllFilters = () => {
    setFilterStatus('all')
    setFilterSource('all')
    setFilterSector('all')
    setFilterProvince('all')
    setFilterIsland('all')
    setFilterMunicipality('all')
    setSearchTerm('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageContainer size="full" className="py-10">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              <SparklesIcon className="h-4 w-4" />
              Generación de Leads
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              Prospectos Inteligentes
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Busca negocios por sector y ubicación usando Google Maps para
              alimentar tu pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={() => setViewMode('existing')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  viewMode === 'existing'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                Mis Leads ({leads.length})
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  viewMode === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                Buscar Nuevos
              </button>
            </div>

            {viewMode === 'existing' && (
              <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <button
                  onClick={() => setDisplayMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    displayMode === 'list'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Vista de tabla"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    displayMode === 'grid'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Vista de tarjetas"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
            )}

            {viewMode === 'existing' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
              >
                <ShareIcon className="h-5 w-5" />
                Exportar Excel
              </button>
            )}
          </div>
        </header>

        {viewMode === 'search' && (
          <>
            <section className="mb-12">
              <form
                onSubmit={handleSearch}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="relative grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                      ¿Qué buscas?
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Ej: Clínica dental, Restaurante..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                      ¿Dónde?
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej: Las Palmas, Madrid..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl shadow-sm transition-colors duration-150 flex items-center justify-center gap-3"
                    >
                      {isSearching ? (
                        <ArrowPathIcon className="h-6 w-6 animate-spin" />
                      ) : (
                        <GlobeAltIcon className="h-6 w-6" />
                      )}
                      {isSearching ? 'Buscando...' : 'Iniciar Búsqueda'}
                    </button>
                  </div>
                </div>

                {/* GDPR Consent */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreedGDPR}
                      onChange={(e) => setAgreedGDPR(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                      Entiendo que la importación de datos desde fuentes públicas (Google Maps) 
                      debe realizarse exclusivamente con fines de prospección comercial B2B. 
                      Me comprometo a tratar la información siguiendo el **RGPD** y a 
                      identificarme claramente en mi primer contacto.
                    </div>
                  </label>
                  {gdprError && (
                    <p className="mt-2 text-xs font-bold text-red-500 animate-pulse">
                      Es obligatorio aceptar el aviso de privacidad para procesar leads.
                    </p>
                  )}
                </div>
              </form>
            </section>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Resultados de Google Maps
                <span className="text-sm font-normal text-slate-500">
                  ({searchResults.length})
                </span>
              </h2>

              {searchError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800/40 dark:bg-red-900/10">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Error en la búsqueda</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{searchError}</p>
                </div>
              )}

              {searchResults.length === 0 && !isSearching && !searchError && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-700 dark:bg-slate-900">
                  <GlobeAltIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">
                    No hay resultados. Inicia una búsqueda arriba.
                  </p>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((result) => {
                  const isAlreadyImported = leads.some(
                    (l) => l.place_id === result.place_id
                  )

                  return (
                    <div
                      key={result.place_id}
                      className={`group relative rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 dark:bg-slate-900 ${
                        isAlreadyImported
                          ? 'border-blue-100 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-900/5 opacity-80'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                            isAlreadyImported
                              ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400'
                              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          <MapPinIcon className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {result.rating && (
                            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 dark:bg-amber-900/30">
                              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                {result.rating}
                              </span>
                              <div className="text-[10px] text-amber-600/60 font-black">
                                ★
                              </div>
                            </div>
                          )}
                          {isAlreadyImported && (
                            <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full animate-pulse">
                              Ya Importado
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                        {result.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 min-h-[2.5rem]">
                        {result.formatted_address}
                      </p>

                      <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                        {isAlreadyImported ? (
                          <button
                            disabled
                            className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            En Mis Leads
                          </button>
                        ) : (
                          <button
                            onClick={() => handleImportLead(result)}
                            className="flex-1 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 group/btn"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 transform group-hover/btn:translate-y-0.5 transition-transform" />
                            Importar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {viewMode === 'existing' && (
          <div className="space-y-6">
            {/* Panel KPI — clicable para filtrar por estado */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {([
                { label: 'Nuevos',      estado: 'nuevo',      bg: 'bg-slate-100 dark:bg-slate-800',   txt: 'text-slate-700 dark:text-slate-200',   ring: 'ring-slate-400' },
                { label: 'Pendientes',  estado: 'pendiente',  bg: 'bg-amber-50 dark:bg-amber-900/20', txt: 'text-amber-700 dark:text-amber-300',   ring: 'ring-amber-400' },
                { label: 'Contactados', estado: 'contactado', bg: 'bg-blue-50 dark:bg-blue-900/20',   txt: 'text-blue-700 dark:text-blue-300',     ring: 'ring-blue-400' },
                { label: 'Interesados', estado: 'interesado', bg: 'bg-emerald-50 dark:bg-emerald-900/20', txt: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-400' },
                { label: 'Rechazados',  estado: 'rechazado',  bg: 'bg-rose-50 dark:bg-rose-900/20',   txt: 'text-rose-700 dark:text-rose-300',     ring: 'ring-rose-400' },
                { label: 'Clientes',    estado: 'cliente',    bg: 'bg-teal-50 dark:bg-teal-900/20',   txt: 'text-teal-700 dark:text-teal-300',     ring: 'ring-teal-400' },
                { label: 'Descartados', estado: 'descartado', bg: 'bg-gray-100 dark:bg-gray-800',     txt: 'text-gray-500 dark:text-gray-400',     ring: 'ring-gray-400' },
              ] as const).map(({ label, estado, bg, txt, ring }) => {
                const count = (leads || []).filter(l => l.estado === estado).length
                const active = filterStatus === estado
                return (
                  <button
                    key={estado}
                    onClick={() => setFilterStatus(active ? 'all' : estado)}
                    className={`rounded-xl border p-3 text-center transition-all ${
                      active
                        ? `${bg} ring-2 ${ring} border-transparent`
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <div className={`text-2xl font-black ${active ? txt : 'text-slate-800 dark:text-white'}`}>{count}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{label}</div>
                  </button>
                )
              })}
            </div>

            {/* Barra de Filtros Avanzada */}
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex-1 min-w-[200px] relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nombre, población o sector..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="nuevo">Nuevos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="contactado">Contactados</option>
                    <option value="interesado">
                      Interesados / Convertidos
                    </option>
                    <option value="rechazado">Rechazados</option>
                    <option value="cliente">Clientes</option>
                    <option value="descartado">Descartados</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterSector}
                    onChange={(e) => setFilterSector(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los sectores</option>
                    {sectorOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las fuentes</option>
                    <option value="google_places">Google Places</option>
                    <option value="serp_web">SERP Web</option>
                    <option value="google_ads">Google Ads</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterProvince}
                    onChange={(e) => {
                      setFilterProvince(e.target.value)
                      setFilterIsland('all')
                      setFilterMunicipality('all')
                    }}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las provincias</option>
                    {provinceOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterIsland}
                    onChange={(e) => {
                      setFilterIsland(e.target.value)
                      setFilterMunicipality('all')
                    }}
                    disabled={filterProvince === 'all'}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="all">Todas las islas</option>
                    {islandOptions
                      .filter(
                        (isl) =>
                          filterProvince === 'all' ||
                          isl.provinceId === filterProvince
                      )
                      .map((isl) => (
                        <option key={isl.id} value={isl.id}>
                          {isl.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterMunicipality}
                    onChange={(e) => setFilterMunicipality(e.target.value)}
                    disabled={filterIsland === 'all'}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="all">Todas las poblaciones</option>
                    {municipalityOptions
                      .filter(
                        (mun) =>
                          filterIsland === 'all' ||
                          mun.islandId === filterIsland
                      )
                      .map((mun) => (
                        <option key={mun.id} value={mun.id}>
                          {mun.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'name' | 'rating' | 'date')
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Últimos añadidos</option>
                    <option value="name">Nombre A-Z</option>
                    <option value="rating">Mejor Rating</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chips de filtros activos */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros:</span>
                {activeFilters.map(f => (
                  <button
                    key={f.key}
                    onClick={f.clear}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition-colors"
                  >
                    {f.label}
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="ml-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {displayMode === 'list' ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <button
                            type="button"
                            onClick={() => setSortBy('name')}
                            className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-blue-500"
                          >
                            Prospecto
                            {sortBy === 'name' && <span>A-Z</span>}
                          </button>
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Ubicación
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Contacto
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <button
                            type="button"
                            onClick={() => setSortBy('rating')}
                            className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-amber-500"
                          >
                            Rating
                            {sortBy === 'rating' && <span>↓</span>}
                          </button>
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Estado
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {paginatedLeads.map((lead) => (
                        <LeadRow
                          key={lead.id}
                          lead={lead}
                          updateLead={updateLead}
                          onNote={handleNoteClick}
                          onConvert={handleConvertToCandidate}
                          onDelete={setDeleteModal}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                        {lead.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <select
                          value={lead.estado}
                          onChange={(e) => {
                            const nuevoEstado = e.target.value as Lead['estado']
                            updateLead(lead.id, {
                              estado: nuevoEstado,
                              ...(nuevoEstado === 'cliente' && !lead.convertedAt
                                ? { convertedAt: new Date().toISOString() }
                                : {})
                            })
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none ring-1 transition-all cursor-pointer ${
                            lead.estado === 'nuevo'
                              ? 'bg-slate-100 text-slate-600 ring-slate-200'
                              : lead.estado === 'contactado'
                                ? 'bg-blue-50 text-blue-600 ring-blue-200'
                                : lead.estado === 'pendiente'
                                  ? 'bg-amber-50 text-amber-600 ring-amber-200'
                                  : lead.estado === 'rechazado'
                                    ? 'bg-rose-50 text-rose-600 ring-rose-200'
                                    : lead.estado === 'interesado'
                                      ? 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                                      : 'bg-gray-100 text-gray-600 ring-gray-200'
                          }`}
                        >
                          <option value="nuevo">Nuevo</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="contactado">Contactado</option>
                          <option value="interesado">Interesado</option>
                          <option value="rechazado">Rechazado</option>
                          <option value="cliente">Cliente</option>
                        </select>
                        {lead.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(lead.rating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 flex-1">
                      <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                        {lead.nombre}
                      </h3>
                      <div className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-500">
                        <BuildingOfficeIcon className="h-3 w-3" />
                        {lead.sector}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                          <div className="flex flex-col">
                            <span className="line-clamp-1">
                              {lead.direccion || lead.ciudad}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
                              {[lead.isla, lead.provincia]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </div>
                        </div>
                        {lead.telefono && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <PhoneIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            {lead.telefono}
                          </div>
                        )}
                        {lead.web && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <GlobeAltIcon className="h-4 w-4 flex-shrink-0" />
                            <a
                              href={
                                lead.web.startsWith('http')
                                  ? lead.web
                                  : `https://${lead.web}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline font-medium truncate"
                            >
                              {lead.web.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-50 pt-4 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setNoteModal({
                              leadId: lead.id,
                              leadNombre: lead.nombre,
                              nota: lead.notas || ''
                            })
                          }
                          className={`flex items-center gap-2 text-xs font-bold transition-colors p-2 rounded-xl ${
                            lead.notas
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                              : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Notas</span>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ id: lead.id, nombre: lead.nombre })}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleConvertToCandidate(lead)}
                        disabled={lead.estado === 'interesado'}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                          lead.estado === 'interesado'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm'
                        }`}
                      >
                        {lead.estado === 'interesado' ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <UserPlusIcon className="h-4 w-4" />
                        )}
                        {lead.estado === 'interesado' ? 'Creado' : 'Convertir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-5 dark:border-slate-800 dark:bg-slate-900 rounded-xl shadow-sm">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-400">
                      Mostrando{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {(currentPage - 1) * pageSize + 1}
                      </span>{' '}
                      a{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {Math.min(currentPage * pageSize, filteredLeads.length)}
                      </span>{' '}
                      de{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {filteredLeads.length}
                      </span>{' '}
                      resultados
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-xl shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-xl px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-slate-700 dark:hover:bg-slate-800"
                      >
                        <ChevronLeftIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </button>
                      {getPageNumbers(currentPage, totalPages).map((page, i) =>
                        page === '...' ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="relative inline-flex items-center px-3 py-2 text-sm text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-bold focus:z-20 focus:outline-offset-0 ${
                              currentPage === page
                                ? 'z-10 bg-blue-600 text-white'
                                : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-xl px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-slate-700 dark:hover:bg-slate-800"
                      >
                        <ChevronRightIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>

      {/* Modal de Notas */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <PencilSquareIcon className="h-5 w-5 text-amber-500" />
                  Nota del prospecto
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium truncate max-w-[280px]">
                  {noteModal.leadNombre}
                </p>
              </div>
              <button
                onClick={() => setNoteModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <textarea
              autoFocus
              rows={5}
              value={noteModal.nota}
              onChange={(e) =>
                setNoteModal((prev) =>
                  prev ? { ...prev, nota: e.target.value } : null
                )
              }
              placeholder="Ej: Rechazado por precio, contactar en Q3. Interesado en packs grandes..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:ring-2 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:placeholder-slate-600"
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setNoteModal(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors active:scale-95"
              >
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
              <XMarkIcon className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">¿Eliminar prospecto?</h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{deleteModal.nombre}</span> se eliminará permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteLead(deleteModal.id); setDeleteModal(null) }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white'
          : toast.type === 'error' ? 'bg-red-600 text-white'
          : 'bg-slate-800 text-white'
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default Leads
