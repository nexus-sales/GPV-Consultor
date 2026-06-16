import React, { useState, useMemo, useEffect } from 'react'
import { 
  MapPinIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserPlusIcon,
  BuildingStorefrontIcon,
  MapIcon,
  BriefcaseIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoordsForLocation } from '../lib/data/municipalityCoords'

// Setup Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

// Custom Icons for Radar
const candidateIcon = L.divIcon({
  className: 'radar-marker-candidate',
  html: `<div style="background-color: #f59e0b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const distributorIcon = L.divIcon({
  className: 'radar-marker-distributor',
  html: `<div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
})

const leadIcon = L.divIcon({
  className: 'radar-marker-lead',
  html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const backofficeIcon = L.divIcon({
  className: 'radar-marker-backoffice',
  html: `<div style="background-color: #8b5cf6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const userIcon = L.divIcon({
  className: 'radar-marker-user',
  html: `<div class="relative">
      <div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
      <div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8); position: relative; z-index: 10;"></div>
    </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

// Distance Helper (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function fallbackCoords(city?: string, island?: string, province?: string): { lat: number; lng: number } | null {
  const coords = getCoordsForLocation(city, island, province)
  if (!coords) return null
  return {
    lat: coords.lat + (Math.random() - 0.5) * 0.02,
    lng: coords.lng + (Math.random() - 0.5) * 0.02
  }
}

const RadarAutoCenter = ({ pos, searchMode, selectedIsland, entities }: { pos: [number, number] | null, searchMode: string, selectedIsland: string, entities: any[] }) => {
  const map = useMap()
  useEffect(() => {
    if (searchMode === 'radius' && pos) {
      map.setView(pos, 14)
    } else if (searchMode === 'island' && selectedIsland !== 'all' && entities.length > 0) {
      const validEntities = entities.filter((e: any) => e.latitude && e.longitude)
      if (validEntities.length > 0) {
        const lats = validEntities.map((e: any) => e.latitude)
        const lngs = validEntities.map((e: any) => e.longitude)
        const bounds = L.latLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [pos, map, searchMode, selectedIsland, entities])
  return null
}

const Radar: React.FC = () => {
  const { distributors = [], candidates = [], backofficeContacts = [], leads = [], islandOptions = [], municipalityOptions = [] } = useAppData()
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  
  const [searchMode, setSearchMode] = useState<'radius' | 'island'>('radius')
  const [radius, setRadius] = useState(5) // Default 5km
  const [selectedIsland, setSelectedIsland] = useState<string>('all')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'distributors' | 'candidates' | 'leads' | 'backoffice'>('all')

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => setUserPos([28.4682, -16.2546]) // Default Santa Cruz de Tenerife if blocked
      )
    }
  }, [])

  const nearbyEntities = useMemo(() => {
    const all = [
      ...distributors.map(d => ({ ...d, type: 'distributor' as const, name: d.name, city: d.city, island: d.island, address: d.address, province: d.province })),
      ...candidates.map(c => ({ ...c, type: 'candidate' as const, name: c.name, city: c.city, island: c.island, address: c.address, province: c.province })),
      ...backofficeContacts.map(b => ({ ...b, type: 'backoffice' as const, name: b.razonSocial || b.nombreColaborador || 'Sin nombre', city: b.poblacion || '', island: b.isla, address: b.direccion, province: b.provincia })),
      ...leads.map(l => ({ ...l, type: 'lead' as const, name: l.nombre, city: l.ciudad || '', island: l.isla, address: l.direccion, province: l.provincia }))
    ]

    return all
      .map(entity => {
        let lat = entity.latitude
        let lng = entity.longitude
        let isFallback = false
        
        if (!lat || !lng) {
          const fallback = fallbackCoords(entity.city, entity.island, entity.province)
          if (fallback) {
             lat = fallback.lat
             lng = fallback.lng
             isFallback = true
          }
        }

        const dist = (userPos && lat && lng) 
          ? getDistance(userPos[0], userPos[1], lat, lng)
          : Infinity
        return { ...entity, distance: dist, latitude: lat, longitude: lng, isFallback }
      })
      .filter(entity => {
        let derivedIsland = entity.island;
        if (!derivedIsland && entity.city) {
           const match = municipalityOptions.find(m => 
             entity.city?.toLowerCase().includes(m.id.toLowerCase()) || 
             entity.city?.toLowerCase().includes(m.label.toLowerCase())
           )
           if (match) derivedIsland = match.islandId
        }

        const searchStr = `${entity.city || ''} ${entity.address || ''} ${entity.island || ''}`.toLowerCase();
        const matchesLocation = searchMode === 'radius' 
          ? entity.distance <= radius
          : (selectedIsland === 'all' || 
             derivedIsland === selectedIsland || 
             searchStr.includes(selectedIsland.toLowerCase()))
          
        const matchesSearch = entity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             entity.city?.toLowerCase().includes(searchQuery.toLowerCase())
                             
        const matchesType = filterType === 'all' || 
                           (filterType === 'distributors' && entity.type === 'distributor') ||
                           (filterType === 'candidates' && entity.type === 'candidate') ||
                           (filterType === 'leads' && entity.type === 'lead') ||
                           (filterType === 'backoffice' && entity.type === 'backoffice')
        
        return matchesLocation && matchesSearch && matchesType
      })
      .sort((a, b) => a.distance - b.distance)
  }, [distributors, candidates, backofficeContacts, leads, userPos, radius, searchQuery, filterType, searchMode, selectedIsland])

  return (
    <PageContainer size="full" className="py-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-indigo-500" />
            Radar de Visitas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Localiza clientes y leads cercanos a tu posición actual o por isla
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUserPos(userPos ? [...userPos] : null)}>
            <MapIcon className="h-4 w-4 mr-2 text-indigo-500" />
            Recalcular Posición
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Filtros y Lista */}
        <div className="lg:col-span-1 space-y-4 h-[calc(100vh-200px)] flex flex-col">
          <Card className="p-4 flex-none">
            <div className="space-y-4">
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Buscar por</label>
                  <select 
                    className="w-full mt-1 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={searchMode}
                    onChange={e => setSearchMode(e.target.value as 'radius' | 'island')}
                  >
                    <option value="radius">Radio (km)</option>
                    <option value="island">Isla</option>
                  </select>
                </div>
              </div>

              {searchMode === 'radius' ? (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Radio ({radius} km)</label>
                  <input 
                    type="range" 
                    min="1" max="50" 
                    value={radius} 
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Isla</label>
                  <select 
                    className="w-full mt-1 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={selectedIsland}
                    onChange={e => setSelectedIsland(e.target.value)}
                  >
                    <option value="all">Todas las islas</option>
                    {islandOptions.map(iso => (
                      <option key={iso.id} value={iso.id}>{iso.label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar nombre o ciudad..."
                  className="pl-9 w-full rounded-lg border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto custom-scrollbar">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilterType('distributors')}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'distributors' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
                >
                  Distr.
                </button>
                <button 
                  onClick={() => setFilterType('backoffice')}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'backoffice' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
                >
                  Backoffice
                </button>
                <button 
                  onClick={() => setFilterType('leads')}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'leads' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                >
                  Leads
                </button>
                <button 
                  onClick={() => setFilterType('candidates')}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'candidates' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
                >
                  Cand.
                </button>
              </div>
            </div>
          </Card>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-1">Resultados ({nearbyEntities.length})</p>
            {nearbyEntities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No se encontraron resultados para los filtros seleccionados.</p>
              </div>
            ) : (
              nearbyEntities.map((entity) => (
                <div 
                  key={`${entity.type}-${entity.id}`}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {entity.type === 'distributor' ? (
                        <BuildingStorefrontIcon className="h-4 w-4 text-emerald-500" />
                      ) : entity.type === 'candidate' ? (
                        <UserPlusIcon className="h-4 w-4 text-amber-500" />
                      ) : entity.type === 'lead' ? (
                        <FunnelIcon className="h-4 w-4 text-red-500" />
                      ) : (
                        <BriefcaseIcon className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{entity.name}</span>
                    </div>
                    {entity.distance !== Infinity && searchMode === 'radius' && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {entity.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {entity.city || 'Ubicación no especificada'}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" className="h-7 text-[10px] px-2">Detalles</Button>
                    {entity.latitude && entity.longitude && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${entity.latitude},${entity.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 text-[10px] px-2 bg-blue-50 text-blue-600 rounded-lg flex items-center hover:bg-blue-100 transition-colors"
                      >
                        Ir ahora
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mapa Radar */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg relative h-[calc(100vh-200px)]">
          {!userPos ? (
            <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Obteniendo ubicación...</p>
            </div>
          ) : (
            <MapContainer
              center={userPos}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              className="z-10"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <RadarAutoCenter 
                pos={userPos} 
                searchMode={searchMode} 
                selectedIsland={selectedIsland} 
                entities={nearbyEntities} 
              />

              <Marker position={userPos} icon={userIcon}>
                <Popup>Tu ubicación actual</Popup>
              </Marker>

              {searchMode === 'radius' && (
                <Circle 
                  center={userPos} 
                  radius={radius * 1000} 
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
                />
              )}

              {nearbyEntities.map(entity => (
                entity.latitude && entity.longitude && (
                  <Marker 
                    key={`${entity.type}-${entity.id}`} 
                    position={[entity.latitude, entity.longitude]}
                    icon={
                      entity.type === 'distributor' ? distributorIcon : 
                      entity.type === 'candidate' ? candidateIcon :
                      entity.type === 'lead' ? leadIcon : backofficeIcon
                    }
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="font-bold text-sm">{entity.name}</p>
                        <p className="text-xs text-gray-500">
                          {entity.type === 'distributor' ? 'Distribuidor' : 
                           entity.type === 'candidate' ? 'Candidato' : 
                           entity.type === 'lead' ? 'Lead' : 'Backoffice'}
                        </p>
                        {entity.distance !== Infinity && searchMode === 'radius' && (
                          <p className="text-xs font-medium mt-1">A {entity.distance.toFixed(2)} km</p>
                        )}
                        {entity.isFallback && (
                          <p className="text-[10px] text-gray-400 mt-1 italic">*Ubicación aproximada por ciudad/isla</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

export default Radar
