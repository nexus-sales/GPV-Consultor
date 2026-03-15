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
  ShareIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import { searchPlaces, getPlaceDetails, type GooglePlaceResult } from '../lib/data/googlePlacesService'
import { exportLeads } from '../lib/utils/excel'
import type { Lead, NewCandidate } from '../lib/types'

const Leads: React.FC = () => {
  const { leads, addLead, updateLead, deleteLead, addCandidate, pipelineStages } = useAppData()
  
  const [sector, setSector] = useState('')
  const [city, setCity] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<GooglePlaceResult[]>([])
  const [viewMode, setViewMode] = useState<'existing' | 'search'>('existing')

  // Filtros Avanzados
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'date'>('date')
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null)

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
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
    if (leads.find(l => l.place_id === placeResult.place_id)) {
      showNotification('Este lead ya ha sido importado anteriormente.', 'info')
      return
    }

    const details = await getPlaceDetails(placeResult.place_id)
    
    if (!details) {
      showNotification('No se pudieron obtener los detalles del lugar.', 'error')
      return
    }

    const newLead: Partial<Lead> = {
      fuente: 'google_places',
      nombre: details.name || placeResult.name,
      telefono: details.formatted_phone_number,
      web: details.website,
      direccion: details.formatted_address,
      ciudad: city,
      sector: sector,
      rating: details.rating,
      reviews_count: details.user_ratings_total,
      place_id: placeResult.place_id,
      estado: 'nuevo'
    }

    await addLead(newLead as any)
    setSearchResults(prev => prev.filter(r => r.place_id !== placeResult.place_id))
  }

  const handleConvertToCandidate = async (lead: Lead) => {
    const candidatePayload: NewCandidate = {
      name: lead.nombre,
      city: lead.ciudad || '',
      address: lead.direccion || '',
      contact: {
        phone: lead.telefono || '',
        email: lead.email || ''
      },
      source: `Lead: ${lead.fuente}`,
      stage: pipelineStages[0]?.id || 'new',
      notes: `Lead importado de Google Places. Rating: ${lead.rating}, Reviews: ${lead.reviews_count}. Website: ${lead.web}`
    }

    await addCandidate(candidatePayload)
    await updateLead(lead.id, { estado: 'interesado', notas: (lead.notas || '') + '\nConvertido a candidato.' })
  }

  const filteredLeads = useMemo(() => {
    let result = [...(leads || [])]

    // Búsqueda textual
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(l => 
        l.nombre.toLowerCase().includes(lower) || 
        l.ciudad?.toLowerCase().includes(lower) ||
        l.sector?.toLowerCase().includes(lower)
      )
    }

    // Filtro por estado
    if (filterStatus !== 'all') {
      result = result.filter(l => l.estado === filterStatus)
    }

    // Filtro por fuente
    if (filterSource !== 'all') {
      result = result.filter(l => l.fuente === filterSource)
    }

    // Ordenación
    result.sort((a, b) => {
      if (sortBy === 'name') return a.nombre.localeCompare(b.nombre)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [leads, searchTerm, filterStatus, filterSource, sortBy])

  const handleExport = () => {
    exportLeads(filteredLeads)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <PageContainer className="py-10">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              <SparklesIcon className="h-4 w-4" />
              Generación de Leads
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Prospectos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Inteligentes</span>
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Busca negocios por sector y ubicación usando Google Maps para alimentar tu pipeline.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 p-1.5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 backdrop-blur">
              <button
                onClick={() => setViewMode('existing')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  viewMode === 'existing' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                Mis Leads ({leads.length})
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  viewMode === 'search' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                Buscar Nuevos
              </button>
            </div>

            {viewMode === 'existing' && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
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
                className="group relative bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl border border-blue-100/50 dark:border-slate-700/50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />
                
                <div className="relative grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                      ¿Qué buscas?
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                      <input
                        type="text"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        placeholder="Ej: Clínica dental, Restaurante..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all outline-none shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                      ¿Dónde?
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej: Las Palmas, Madrid..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-blue-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
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
                <span className="text-sm font-normal text-slate-500">({searchResults.length})</span>
              </h2>
              
              {searchResults.length === 0 && !isSearching && (
                <div className="bg-white/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center">
                  <GlobeAltIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No hay resultados. Inicia una búsqueda arriba.</p>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((result) => {
                  const isAlreadyImported = leads.some(l => l.place_id === result.place_id)
                  
                  return (
                    <div 
                      key={result.place_id} 
                      className={`group relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border transition-all duration-300 overflow-hidden ${
                        isAlreadyImported 
                          ? 'border-blue-100 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-900/5 opacity-80' 
                          : 'border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                          isAlreadyImported 
                            ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400' 
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          <MapPinIcon className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {result.rating && (
                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg">
                              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{result.rating}</span>
                              <div className="text-[10px] text-amber-600/60 font-black">★</div>
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-6">
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
                    <option value="contactado">Contactados</option>
                    <option value="interesado">Interesados</option>
                    <option value="cliente">Clientes</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Últimos añadidos</option>
                    <option value="name">Nombre A-Z</option>
                    <option value="rating">Mejor Rating</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prospecto</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ubicación</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contacto</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                              {lead.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{lead.nombre}</div>
                              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{lead.sector}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                             <MapPinIcon className="h-4 w-4 text-red-400" />
                             {lead.ciudad}
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
                                <a href={lead.web.startsWith('http') ? lead.web : `https://${lead.web}`} target="_blank" rel="noreferrer" className="hover:underline">
                                  Sitio Web
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <div className="h-1 w-1 rounded-full bg-current" />
                              {lead.estado}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleConvertToCandidate(lead)}
                              className="group flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                            >
                              <UserPlusIcon className="h-4 w-4" />
                              <span>Convertir</span>
                              <ChevronRightIcon className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
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
          </div>
        )}
          {/* Notificaciones flotantes */}
        {notification && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle">
            <div className={`
              px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 border backdrop-blur-md
              ${notification.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : ''}
              ${notification.type === 'info' ? 'bg-blue-600/90 border-blue-400 text-white' : ''}
              ${notification.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' : ''}
            `}>
              {notification.type === 'success' && <CheckCircleIcon className="h-6 w-6" />}
              {notification.type === 'info' && <InformationCircleIcon className="h-6 w-6" />}
              {notification.type === 'error' && <XMarkIcon className="h-6 w-6" />}
              <span className="font-bold">{notification.message}</span>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}

export default Leads
