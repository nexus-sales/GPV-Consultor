import React, { useState, useMemo, useEffect } from 'react'
import { 
  MapPinIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserPlusIcon,
  BuildingStorefrontIcon,
  Navigation2Icon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Distributor, Candidate } from '../lib/types'

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

const RadarAutoCenter = ({ pos }: { pos: [number, number] }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(pos, 14)
  }, [pos, map])
  return null
}

const Radar: React.FC = () => {
  const { distributors = [], candidates = [] } = useAppData()
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [radius, setRadius] = useState(5) // Default 5km
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'distributors' | 'candidates'>('all')

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => setUserPos([28.4682, -16.2546]) // Default Santa Cruz de Tenerife if blocked
      )
    }
  }, [])

  const nearbyEntities = useMemo(() => {
    if (!userPos) return []
    
    const all = [
      ...distributors.map(d => ({ ...d, type: 'distributor' as const })),
      ...candidates.map(c => ({ ...c, type: 'candidate' as const }))
    ]

    return all
      .map(entity => {
        const dist = (entity.latitude && entity.longitude) 
          ? getDistance(userPos[0], userPos[1], entity.latitude, entity.longitude)
          : Infinity
        return { ...entity, distance: dist }
      })
      .filter(entity => {
        const matchesRadius = entity.distance <= radius
        const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             entity.city?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || 
                           (filterType === 'distributors' && entity.type === 'distributor') ||
                           (filterType === 'candidates' && entity.type === 'candidate')
        
        return matchesRadius && matchesSearch && matchesType
      })
      .sort((a, b) => a.distance - b.distance)
  }, [distributors, candidates, userPos, radius, searchQuery, filterType])

  return (
    <PageContainer
      title="Radar de Visitas"
      subtitle="Localiza clientes y leads cercanos a tu posición actual"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUserPos(userPos)}>
            <Navigation2Icon className="h-4 w-4 mr-2" />
            Recalcular Posición
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Filtros y Lista */}
        <div className="lg:col-span-1 space-y-4 h-[calc(100vh-200px)] flex flex-col">
          <Card className="p-4 flex-none">
            <div className="space-y-4">
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

              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilterType('distributors')}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'distributors' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
                >
                  Distr.
                </button>
                <button 
                  onClick={() => setFilterType('candidates')}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'candidates' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
                >
                  Leads
                </button>
              </div>
            </div>
          </Card>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-1">Resultados ({nearbyEntities.length})</p>
            {nearbyEntities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No se encontraron resultados en el radio seleccionado.</p>
              </div>
            ) : (
              nearbyEntities.map((entity) => (
                <div 
                  key={entity.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {entity.type === 'distributor' ? (
                        <BuildingStorefrontIcon className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <UserPlusIcon className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{entity.name}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                      {entity.distance.toFixed(1)} km
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {entity.city || 'Ubicación no especificada'}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="ghost" className="h-7 text-[10px] px-2">Detalles</Button>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${entity.latitude},${entity.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 text-[10px] px-2 bg-blue-50 text-blue-600 rounded-lg flex items-center hover:bg-blue-100 transition-colors"
                    >
                      Ir ahora
                    </a>
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
              
              <RadarAutoCenter pos={userPos} />

              <Marker position={userPos} icon={userIcon}>
                <Popup>Tu ubicación actual</Popup>
              </Marker>

              <Circle 
                center={userPos} 
                radius={radius * 1000} 
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
              />

              {nearbyEntities.map(entity => (
                entity.latitude && entity.longitude && (
                  <Marker 
                    key={entity.id} 
                    position={[entity.latitude, entity.longitude]}
                    icon={entity.type === 'distributor' ? distributorIcon : candidateIcon}
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="font-bold text-sm">{entity.name}</p>
                        <p className="text-xs text-gray-500">{entity.type === 'distributor' ? 'Distribuidor' : 'Candidato'}</p>
                        <p className="text-xs font-medium mt-1">A {entity.distance.toFixed(2)} km</p>
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