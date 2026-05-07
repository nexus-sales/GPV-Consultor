import React, { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCoordsForLocation } from '../../lib/data/municipalityCoords'
import { geocodeAddress, buildGeoQuery } from '../../lib/utils/geocoder'
import type { Distributor, Candidate } from '../../lib/types'

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

interface LatLng {
  lat: number
  lng: number
}

interface MarkerData {
  id: string
  coords: LatLng
  type: 'active' | 'pending' | 'candidate'
  name: string
  city: string
  province?: string
  channelType?: string
  stage?: string
}

interface CoverageMapProps {
  distributors: Distributor[]
  candidates: Candidate[]
  height?: string | number
}

/** Fallback: coordenadas del municipio con offset aleatorio para separar marcadores */
function fallbackCoords(
  city?: string,
  island?: string,
  province?: string
): LatLng | null {
  const coords = getCoordsForLocation(city, island, province)
  if (!coords) return null
  return {
    lat: coords.lat + (Math.random() - 0.5) * 0.02,
    lng: coords.lng + (Math.random() - 0.5) * 0.02
  }
}

const CoverageMap: React.FC<CoverageMapProps> = ({
  distributors,
  candidates,
  height = '450px'
}) => {
  const center: [number, number] = [28.3, -15.7]
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const resolvedIds = useRef(new Set<string>())

  useEffect(() => {
    // Seed inicial con coordenadas de municipio (instantáneo)
    const initial: MarkerData[] = []

    for (const dist of distributors) {
      const coords = fallbackCoords(dist.city, undefined, dist.province)
      if (!coords) continue
      initial.push({
        id: `dist-${dist.id}`,
        coords,
        type: dist.status === 'active' ? 'active' : 'pending',
        name: dist.name,
        city: dist.city,
        province: dist.province,
        channelType: dist.channelType
      })
    }

    for (const cand of candidates) {
      const coords = fallbackCoords(cand.city, cand.island, cand.province)
      if (!coords) continue
      initial.push({
        id: `cand-${cand.id}`,
        coords,
        type: 'candidate',
        name: cand.name,
        city: cand.city || '',
        stage: cand.stage
      })
    }

    setMarkers(initial)
    resolvedIds.current.clear()

    // Mejorar precisión con geocodificación para los que tienen dirección
    const itemsWithAddress = [
      ...distributors
        .filter((d) => d.address?.trim())
        .map((d) => ({
          id: `dist-${d.id}`,
          query: buildGeoQuery(d.address, d.city, d.postalCode, d.province)
        })),
      ...candidates
        .filter((c) => c.address?.trim())
        .map((c) => ({
          id: `cand-${c.id}`,
          query: buildGeoQuery(c.address, c.city, c.postalCode, c.province)
        }))
    ]

    for (const item of itemsWithAddress) {
      if (resolvedIds.current.has(item.id)) continue
      geocodeAddress(item.query).then((coords) => {
        if (!coords) return
        resolvedIds.current.add(item.id)
        setMarkers((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, coords } : m))
        )
      })
    }
  }, [distributors, candidates])

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
          className="dark:invert dark:grayscale dark:brightness-90"
        />
        <ZoomControl position="bottomright" />

        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.coords.lat, m.coords.lng]}
            icon={
              m.type === 'active'
                ? activeIcon
                : m.type === 'pending'
                  ? pendingIcon
                  : candidateIcon
            }
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <h4 className="font-bold text-indigo-700 m-0">{m.name}</h4>
                <p className="text-xs text-gray-500 m-0 mb-1">
                  {m.city}
                  {m.province ? `, ${m.province}` : ''}
                </p>
                <div className="flex gap-1 mt-2">
                  {m.type !== 'candidate' && (
                    <>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          m.type === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {m.type === 'active' ? 'Activo' : 'Pendiente'}
                      </span>
                      {m.channelType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                          {m.channelType}
                        </span>
                      )}
                    </>
                  )}
                  {m.type === 'candidate' && m.stage && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Candidato: {m.stage}
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">
            Distribuidor Activo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">
            Distribuidor Pendiente
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">
            Candidato
          </span>
        </div>
      </div>
    </div>
  )
}

export default CoverageMap
