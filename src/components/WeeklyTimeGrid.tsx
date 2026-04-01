import React, { useMemo, useEffect, useState } from 'react'
import { 
  Visit, 
  Distributor, 
  Candidate, 
  EntityId 
} from '../lib/types'
import '../styles/WeeklyTimeGrid.css'

interface WeeklyTimeGridProps {
  visitsByDate: Record<string, Visit[]>
  actionsByDate: Record<string, any[]>
  days: { iso: string; label: string; dayNumber: number; isToday: boolean }[]
  distributorLookup: Map<EntityId, Distributor>
  candidateLookup: Map<EntityId, Candidate>
  onVisitClick: (visit: Visit) => void
  onActionClick: (action: any) => void
}

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 80 // pixels per hour

export const WeeklyTimeGrid: React.FC<WeeklyTimeGridProps> = ({
  visitsByDate,
  actionsByDate,
  days,
  distributorLookup,
  candidateLookup,
  onVisitClick,
  onActionClick
}) => {
  const [nowOffset, setNowOffset] = useState<number | null>(null)

  // Actualizar indicador de "ahora"
  useEffect(() => {
    const updateNow = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()
      
      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        const offset = (currentHour - START_HOUR) * HOUR_HEIGHT + (currentMin / 60) * HOUR_HEIGHT
        setNowOffset(offset)
      } else {
        setNowOffset(null)
      }
    }

    updateNow()
    const interval = setInterval(updateNow, 60000)
    return () => clearInterval(interval)
  }, [])

  const hours = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  }, [])

  const getVisitStyles = (visit: Visit) => {
    if (!visit.scheduledTime) {
      // Default to 9:00 if no time set
      return { top: 60, height: (visit.durationMinutes / 60) * HOUR_HEIGHT }
    }
    const [h, m] = visit.scheduledTime.split(':').map(Number)
    const top = (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
    const height = Math.max(30, (visit.durationMinutes / 60) * HOUR_HEIGHT)
    return { top, height }
  }

  const resolveName = (visit: Visit) => {
    if (visit.distributorId) return distributorLookup.get(visit.distributorId)?.name || 'Distribuidor'
    if (visit.candidateId) return candidateLookup.get(visit.candidateId)?.name || 'Candidato'
    return 'Contacto'
  }

  return (
    <div className="weekly-grid-container shadow-2xl">
      {/* Header */}
      <div className="grid-header-axis bg-gray-50/50 dark:bg-gray-900/50 border-r border-b dark:border-slate-800" />
      {days.map((day) => (
        <div 
          key={day.iso} 
          className={`grid-header-cell ${day.isToday ? 'grid-header-cell--today' : ''}`}
        >
          <div className="text-[10px] opacity-60 font-bold">{day.label}</div>
          <div className="text-lg font-bold">{day.dayNumber}</div>
        </div>
      ))}

      {/* Content Wrapper */}
      <div className="grid-content-wrapper">
        {/* Time Axis */}
        <div className="time-axis bg-gray-50/20 dark:bg-gray-800/10">
          {hours.map((h) => (
            <div key={h} className="time-slot-label">
              {h}:00
            </div>
          ))}
        </div>

        {/* Columns */}
        <div className="grid-columns-container">
          {days.map((day) => (
            <div 
              key={day.iso} 
              className={`grid-column ${day.isToday ? 'grid-column--today' : ''}`}
            >
              {/* Hour Lines */}
              {hours.map((h) => (
                <div 
                  key={h} 
                  className="grid-hour-line" 
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} 
                />
              ))}

              {/* Now Indicator */}
              {day.isToday && nowOffset !== null && (
                <div className="now-indicator" style={{ top: nowOffset }} />
              )}

              {/* Actions (Tasks) - Rendered at top or specific time if available */}
              <div className="flex flex-col gap-1 p-1">
                {(actionsByDate[day.iso] || []).map((action) => (
                  <div
                    key={action.id}
                    className="rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-1.5 cursor-pointer hover:bg-amber-100 transition shadow-sm"
                    onClick={() => onActionClick(action)}
                  >
                    <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-none mb-1">Tarea</div>
                    <div className="text-[10px] text-gray-800 dark:text-gray-200 font-medium truncate">{action.entityName}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate">{action.nextAction}</div>
                  </div>
                ))}
              </div>

              {/* Visits */}
              {(visitsByDate[day.iso] || []).map((visit) => {
                const { top, height } = getVisitStyles(visit)
                return (
                  <div
                    key={visit.id}
                    className={`visit-time-block visit-time-block--${visit.type || 'otros'}`}
                    style={{ top, height }}
                    onClick={() => onVisitClick(visit)}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="font-bold leading-tight line-clamp-2">
                        {resolveName(visit)}
                      </div>
                      <div className="opacity-90 font-medium text-[10px] flex items-center justify-between">
                        <span>{visit.scheduledTime || '09:00'}</span>
                        <span className="text-[9px] opacity-70">
                          {visit.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
