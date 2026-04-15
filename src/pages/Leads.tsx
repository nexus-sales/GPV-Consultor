import React, { useState, useMemo } from 'react'
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
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ShareIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import {
  searchPlaces,
  getPlaceDetails,
  type GooglePlaceResult
} from '../lib/data/googlePlacesService'
import { exportLeads } from '../lib/utils/excel'
import type { Lead, NewCandidate } from '../lib/types'

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
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([])
  const [viewMode, setViewMode] = useState<'existing' | 'search'>('existing')
  const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('list')

  // Filtros Avanzados
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, _setFilterSource] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [filterProvince, setFilterProvince] = useState('all')
  const [filterIsland, setFilterIsland] = useState('all')
  const [filterMunicipality, setFilterMunicipality] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'date'>('date')
  const [notification, setNotification] = useState<{
    message: string
    type: 'info' | 'success' | 'error'
  } | null>(null)

  // Paginación
  const [pageSize, setPageSize] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)

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

  const showNotification = (
    message: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sector || !city) return

    setIsSearching(true)
    setViewMode('search')
    try {
      const query = `${sector} ${city}`
      const results = await searchPlaces(query)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportLead = async (placeResult: GooglePlaceResult) => {
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
    const provinceId = provinceOptions.find(p => 
      p.label.toLowerCase() === (details.provincia || '').toLowerCase())?.id;
    
    let islandId = '';
    if (provinceId) {
      // Intentar buscar por municipio
      const mun = municipalityOptions.find(m => 
        m.label.toLowerCase() === (details.city || city || '').toLowerCase());
      if (mun) {
        islandId = mun.islandId;
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
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(
        (l) =>
          l.nombre.toLowerCase().includes(lower) ||
          l.ciudad?.toLowerCase().includes(lower) ||
          l.sector?.toLowerCase().includes(lower)
      )
    }

    const normalizeForFilter = (val?: string) => (val || '').trim().toLowerCase()

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
      result = result.filter((l) => 
        normalizeForFilter(l.provincia) === normalizeForFilter(filterProvince)
      )
    }

    // Filtro por isla
    if (filterIsland !== 'all') {
      result = result.filter((l) => {
        // 1. Match directo si el lead tiene el campo 'island'
        if ((l as any).island && normalizeForFilter((l as any).island) === normalizeForFilter(filterIsland)) {
          return true
        }
        // 2. Inferencia por municipio si no tiene el campo 'island'
        const mun = municipalityOptions.find(m => 
          normalizeForFilter(m.label) === normalizeForFilter(l.ciudad) || 
          normalizeForFilter(m.id) === normalizeForFilter(l.ciudad)
        )
        return mun ? normalizeForFilter(mun.islandId) === normalizeForFilter(filterIsland) : false
      })
    }

    // Filtro por municipio
    if (filterMunicipality !== 'all') {
      result = result.filter((l) => 
        normalizeForFilter(l.ciudad) === normalizeForFilter(filterMunicipality) || 
        normalizeForFilter(l.ciudad) === normalizeForFilter(municipalityOptions.find(m => m.id === filterMunicipality)?.label)
      )
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
    searchTerm,
    filterStatus,
    filterSource,
    filterCity,
    filterProvince,
    filterIsland,
    filterMunicipality,
    sortBy
  ])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  }, [filteredLeads.length, pageSize])

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredLeads.slice(start, start + pageSize)
  }, [currentPage, filteredLeads, pageSize])

  // Resetear página al filtrar
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterCity, filterProvince, filterIsland, filterMunicipality, pageSize])

  const provincias = useMemo(() => {
    const set = new Set(leads.map((l) => l.provincia).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

  const handleExport = () => {
    exportLeads(filteredLeads)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageContainer className="py-10">
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
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
              </form>
            </section>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Resultados de Google Maps
                <span className="text-sm font-normal text-slate-500">
                  ({searchResults.length})
                </span>
              </h2>

              {searchResults.length === 0 && !isSearching && (
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
          <div className="space-y-8">
            {/* Barra de Filtros Avanzada */}
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex-1 min-w-[200px] relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nombre, ciudad o sector..."
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
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterProvince}
                    onChange={(e) => {
                      setFilterProvince(e.target.value);
                      setFilterIsland('all');
                      setFilterMunicipality('all');
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
                      setFilterIsland(e.target.value);
                      setFilterMunicipality('all');
                    }}
                    disabled={filterProvince === 'all'}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="all">Todas las islas</option>
                    {islandOptions
                      .filter((isl) => filterProvince === 'all' || isl.provinceId === filterProvince)
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
                      .filter((mun) => filterIsland === 'all' || mun.islandId === filterIsland)
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

            {displayMode === 'list' ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Prospecto
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Ubicación
                        </th>
                        <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Contacto
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
                        <tr
                          key={lead.id}
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
                            </select>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() =>
                                  setNoteModal({
                                    leadId: lead.id,
                                    leadNombre: lead.nombre,
                                    nota: lead.notas || ''
                                  })
                                }
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
                                onClick={() => handleConvertToCandidate(lead)}
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
                                onClick={() => {
                                  if (window.confirm('¿Eliminar este prospecto?')) deleteLead(lead.id)
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                title="Eliminar"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
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
                            <span className="line-clamp-1">{lead.direccion || lead.ciudad}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
                                {[lead.isla, lead.provincia].filter(Boolean).join(' · ')}
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
                              href={lead.web.startsWith('http') ? lead.web : `https://${lead.web}`}
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
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-xl px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-slate-700 dark:hover:bg-slate-800"
                      >
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-bold focus:z-20 focus:outline-offset-0 ${
                            currentPage === i + 1
                              ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-xl px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-slate-700 dark:hover:bg-slate-800"
                      >
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
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
    </div>
  )
}

export default Leads
