import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoordsForLocation } from '../../lib/data/municipalityCoords'
import type { Distributor, Candidate } from '../../lib/types'

// Componente para los marcadores con estilo Tailwind
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-6 h-6 rounded-full ${color} opacity-40 animate-ping"></div>
        <div class="relative w-4 h-4 rounded-full ${color} border-2 border-white shadow-md"></div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

const activeIcon = createCustomIcon('bg-emerald-500')
const pendingIcon = createCustomIcon('bg-amber-500')
const candidateIcon = createCustomIcon('bg-indigo-500')

interface CoverageMapProps {
  distributors: Distributor[]
  candidates: Candidate[]
  height?: string | number
}

const CoverageMap: React.FC<CoverageMapProps> = ({
  distributors,
  candidates,
  height = '450px'
}) => {
  // Centro aproximado de Canarias
  const center: [number, number] = [28.3, -15.7]

  return (
    <div 
      className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-700 bg-gray-100"
      style={{ height }}
    >
      <MapContainer 
        center={center} 
        zoom={7} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Opción para modo oscuro (filtro CSS)
          className="dark:invert dark:grayscale dark:brightness-90"
        />
        <ZoomControl position="bottomright" />

        {/* Marcadores de Distribuidores */}
        {distributors.map((dist) => {
          const coords = getCoordsForLocation(dist.city, undefined, dist.province)
          if (!coords) return null

          // Añadir un pequeño offset aleatorio si varios están en la misma ciudad
          const lat = coords.lat + (Math.random() - 0.5) * 0.02
          const lng = coords.lng + (Math.random() - 0.5) * 0.02

          return (
            <Marker 
              key={`dist-${dist.id}`} 
              position={[lat, lng]}
              icon={dist.status === 'active' ? activeIcon : pendingIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h4 className="font-bold text-indigo-700 m-0">{dist.name}</h4>
                  <p className="text-xs text-gray-500 m-0 mb-1">{dist.city}, {dist.province}</p>
                  <div className="flex gap-1 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      dist.status === 'active' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {dist.status === 'active' ? 'Activo' : 'Pendiente'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {dist.channelType}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Marcadores de Candidatos */}
        {candidates.map((cand) => {
          const coords = getCoordsForLocation(cand.city, cand.island, cand.province)
          if (!coords) return null

          const lat = coords.lat + (Math.random() - 0.5) * 0.02
          const lng = coords.lng + (Math.random() - 0.5) * 0.02

          return (
            <Marker 
              key={`cand-${cand.id}`} 
              position={[lat, lng]}
              icon={candidateIcon}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-blue-700 m-0">{cand.name}</h4>
                  <p className="text-xs text-gray-500 m-0 mb-1">{cand.city || 'Desconocido'}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Candidato: {cand.stage}
                  </span>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* Leyenda Simple */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Distribuidor Activo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Distribuidor Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Candidato</span>
        </div>
      </div>
    </div>
  )
}

export default CoverageMap
