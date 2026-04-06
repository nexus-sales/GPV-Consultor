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
  PencilSquareIcon
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
    provinceOptions
  } = useAppData()

  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([])
  const [viewMode, setViewMode] = useState<'existing' | 'search'>('existing')

  // Filtros Avanzados
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, _setFilterSource] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [filterProvince, setFilterProvince] = useState('all')
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

    const newLead: Partial<Lead> = {
      fuente: 'google_places',
      nombre: details.name || placeResult.name,
      telefono: details.formatted_phone_number,
      web: details.website,
      direccion: details.formatted_address,
      ciudad: city,
      provincia: details.provincia,
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

    // Filtro por estado
    if (filterStatus !== 'all') {
      result = result.filter((l) => l.estado === filterStatus)
    }

    // Filtro por fuente
    if (filterSource !== 'all') {
      result = result.filter((l) => l.fuente === filterSource)
    }

    // Filtro por población
    if (filterCity !== 'all') {
      result = result.filter((l) => l.ciudad === filterCity)
    }

    // Filtro por provincia
    if (filterProvince !== 'all') {
      result = result.filter((l) => l.provincia === filterProvince)
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
  }, [searchTerm, filterStatus, filterCity, filterProvince, pageSize])

  const ciudades = useMemo(() => {
    const set = new Set(leads.map((l) => l.ciudad).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

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

              <div className="flex items-center gap-4">
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

                {ciudades.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-slate-400" />
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas las poblaciones</option>
                      {ciudades.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(provincias.length > 0 ||
                  (provinceOptions && provinceOptions.length > 0)) && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-slate-400" />
                    <select
                      value={filterProvince}
                      onChange={(e) => setFilterProvince(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas las provincias</option>
                      {/* Mostrar primero las que ya tienen leads, luego el resto de opciones */}
                      {Array.from(
                        new Set([
                          ...provincias,
                          ...(provinceOptions || []).map((p) => p.label)
                        ])
                      )
                        .sort()
                        .map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

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
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
                              {lead.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {lead.nombre}
                              </div>
                              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                {lead.sector}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-4 w-4 text-red-500" />
                              {lead.ciudad}
                            </div>
                            {lead.provincia && (
                              <div className="text-[10px] ml-6 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic">
                                {lead.provincia}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            {lead.telefono && (
                              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <PhoneIcon className="h-3 w-3" />
                                {lead.telefono}
                              </div>
                            )}
                            {lead.web && (
                              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                <GlobeAltIcon className="h-3 w-3" />
                                <a
                                  href={
                                    lead.web.startsWith('http')
                                      ? lead.web
                                      : `https://${lead.web}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline"
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest border-none ring-1 outline-none focus:ring-2 transition-all ${
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
                              title={
                                lead.notas ? 'Ver/editar nota' : 'Añadir nota'
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                lead.notas
                                  ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                  : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleConvertToCandidate(lead)}
                              disabled={lead.estado === 'interesado'}
                              title={
                                lead.estado === 'interesado'
                                  ? 'Ya es candidato'
                                  : 'Convertir a candidato'
                              }
                              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                lead.estado === 'interesado'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                                  : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:scale-105'
                              }`}
                            >
                              {lead.estado === 'interesado' ? (
                                <CheckCircleIcon className="h-4 w-4" />
                              ) : (
                                <UserPlusIcon className="h-4 w-4" />
                              )}
                              <span>
                                {lead.estado === 'interesado'
                                  ? 'Creado'
                                  : 'Convertir'}
                              </span>
                              {lead.estado !== 'interesado' && (
                                <ChevronRightIcon className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="p-2 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
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

            {/* Paginación */}
            {filteredLeads.length > 0 && (
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>Mostrar</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {[15, 30, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span>de {filteredLeads.length} prospectos</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    Anterior
                  </button>
                  <div className="flex items-center gap-1 px-4">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentPage}
                    </span>
                    <span className="text-sm text-slate-500">/</span>
                    <span className="text-sm text-slate-500">{totalPages}</span>
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Notificaciones flotantes */}
        {notification && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle">
            <div
              className={`
              flex items-center gap-3 rounded-xl border px-6 py-4 shadow-lg
              ${notification.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : ''}
              ${notification.type === 'info' ? 'bg-blue-600/90 border-blue-400 text-white' : ''}
              ${notification.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : ''}
            `}
            >
              {notification.type === 'success' && (
                <CheckCircleIcon className="h-6 w-6" />
              )}
              {notification.type === 'info' && (
                <InformationCircleIcon className="h-6 w-6" />
              )}
              {notification.type === 'error' && (
                <XMarkIcon className="h-6 w-6" />
              )}
              <span className="font-bold">{notification.message}</span>
            </div>
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
