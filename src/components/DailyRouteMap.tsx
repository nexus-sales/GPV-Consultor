import React, { useMemo } from 'react'
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Visit, EntityId } from '../lib/types'

// Solución para los iconos de Leaflet que a veces no se cargan correctamente en React
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DailyRouteMapProps {
  visits: Visit[]
  onVisitClick?: (visit: Visit) => void
}

// Componente para centrar el mapa automáticamente cuando cambian las visitas
const MapAutoCenter = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap()
  React.useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [coords, map])
  return null
}

const resolveVisitColor = (type: string) => {
    switch (type) {
        case 'presentacion': return '#6366f1' // Indigo
        case 'seguimiento': return '#10b981' // Emerald
        case 'formacion': return '#f59e0b' // Amber
        case 'incidencias': return '#ef4444' // Rose
        case 'apertura': return '#8b5cf6' // Violet
        default: return '#64748b' // Slate
    }
}

const createCustomIcon = (color: string, label: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            ">
                <div style="
                    transform: rotate(45deg);
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                ">${label}</div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    })
}

export const DailyRouteMap: React.FC<DailyRouteMapProps> = ({ visits, onVisitClick }) => {
  // Solo procesamos visitas con coordenadas
  const mapVisits = useMemo(() => {
    return visits
      .filter(v => v.lat !== undefined && v.lng !== undefined)
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
  }, [visits])

  const routeCoords = useMemo(() => {
    return mapVisits.map(v => [v.lat!, v.lng!] as [number, number])
  }, [mapVisits])

  if (mapVisits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-4">
           <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
           </svg>
        </div>
        <p className="text-slate-500 font-medium text-center">
            No hay coordenadas asignadas para la ruta de hoy.<br/>
            <span className="text-xs opacity-75">Las visitas deben tener latitud/longitud para aparecer en el mapa.</span>
        </p>
      </div>
    )
  }

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 relative z-0">
      <MapContainer 
        center={routeCoords[0]} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Línea de Ruta */}
        <Polyline 
            positions={routeCoords} 
            color="#6366f1" 
            weight={4} 
            opacity={0.6}
            dashArray="10, 10"
        />

        {mapVisits.map((visit, idx) => (
          <Marker 
            key={visit.id} 
            position={[visit.lat!, visit.lng!]}
            icon={createCustomIcon(resolveVisitColor(visit.type), (idx + 1).toString())}
            eventHandlers={{
                click: () => onVisitClick?.(visit)
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="text-xs font-bold text-indigo-600 mb-1">Visita #${idx + 1} • {visit.scheduledTime}</div>
                <div className="text-sm font-semibold">{visit.objective}</div>
                <div className="text-[10px] text-gray-400 mt-1">{visit.location}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapAutoCenter coords={routeCoords} />
      </MapContainer>
    </div>
  )
}
