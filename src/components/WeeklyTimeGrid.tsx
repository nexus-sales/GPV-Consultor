import React, { useMemo, useEffect, useState } from 'react'
import { Visit, Distributor, Candidate, EntityId } from '../lib/types'
import '../styles/WeeklyTimeGrid.css'

interface WeeklyTimeGridProps {
  visitsByDate: Record<string, Visit[]>
  actionsByDate: Record<string, any[]>
  days: { iso: string; label: string; dayNumber: number; isToday: boolean }[]
  distributorLookup: Map<EntityId, Distributor>
  candidateLookup: Map<EntityId, Candidate>
  onVisitClick: (visit: Visit) => void
  onActionClick: (action: any) => void
  onSlotClick?: (dateIso: string, time: string) => void
  onVisitMove?: (visitId: EntityId, newDate: string, newTime: string) => void
}

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 80

export const WeeklyTimeGrid: React.FC<WeeklyTimeGridProps> = ({
  visitsByDate,
  actionsByDate,
  days,
  distributorLookup,
  candidateLookup,
  onVisitClick,
  onActionClick,
  onSlotClick,
  onVisitMove
}) => {
  const [nowOffset, setNowOffset] = useState<number | null>(null)

  useEffect(() => {
    const updateNow = () => {
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes()
      if (h >= START_HOUR && h <= END_HOUR) {
        setNowOffset((h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT)
      } else {
        setNowOffset(null)
      }
    }
    updateNow()
    const interval = setInterval(updateNow, 60000)
    return () => clearInterval(interval)
  }, [])

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  )

  const getVisitPosition = (visit: Visit, overlapCount: number = 1, overlapIndex: number = 0) => {
    if (!visit.scheduledTime) return null
    const [h, m] = visit.scheduledTime.split(':').map(Number)
    if (h < START_HOUR || h > END_HOUR) return null
    
    const width = 100 / overlapCount
    const left = width * overlapIndex

    return {
      top: (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT,
      height: Math.max(32, (visit.durationMinutes / 60) * HOUR_HEIGHT),
      width: `${width}%`,
      left: `${left}%`
    }
  }

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, visitId: EntityId) => {
    e.dataTransfer.setData('visitId', visitId.toString())
    e.dataTransfer.effectAllowed = 'move'
    
    // Feedback visual opaco al arrastrar
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'
  }

  const handleDrop = (e: React.DragEvent, dateIso: string, time: string) => {
    e.preventDefault()
    const visitId = e.dataTransfer.getData('visitId')
    if (visitId && onVisitMove) {
      onVisitMove(visitId, dateIso, time)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  // -----------------------------

  const resolveName = (visit: Visit) => {
    if (visit.distributorId) return distributorLookup.get(visit.distributorId)?.name ?? 'Distribuidor'
    if (visit.candidateId) return candidateLookup.get(visit.candidateId)?.name ?? 'Candidato'
    return 'Contacto'
  }

  return (
    <div 
      className="weekly-grid-container shadow-2xl"
      style={{ '--grid-days': days.length } as React.CSSProperties}
    >
      {/* ROW 1 — Cabecera de días */}
      <div className="grid-header-axis bg-gray-50/50 dark:bg-gray-900/50 border-r border-b dark:border-slate-800" />
      {days.map((day) => (
        <div
          key={day.iso}
          className={`grid-header-cell ${day.isToday ? 'grid-header-cell--today' : ''}`}
        >
          <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider">{day.label}</div>
          <div className={`text-lg font-bold ${day.isToday ? 'today-number' : ''}`}>{day.dayNumber}</div>
        </div>
      ))}

      {/* ROW 2 — All-day strip: visitas sin hora + tareas */}
      <div className="allday-axis">
        <span>Todo el día</span>
      </div>
      {days.map((day) => {
        const unscheduled = (visitsByDate[day.iso] ?? []).filter((v) => !v.scheduledTime)
        const actions = actionsByDate[day.iso] ?? []
        return (
          <div
            key={`allday-${day.iso}`}
            className={`allday-cell ${day.isToday ? 'allday-cell--today' : ''} ${unscheduled.length === 0 && actions.length === 0 ? 'allday-cell--empty' : ''}`}
          >
            {unscheduled.map((visit) => (
              <div
                key={visit.id}
                className={`allday-chip allday-chip--${visit.type ?? 'otros'}`}
                onClick={() => onVisitClick(visit)}
                title={resolveName(visit)}
              >
                {resolveName(visit)}
              </div>
            ))}
            {actions.map((action) => (
              <div
                key={action.id}
                className="allday-chip allday-chip--action"
                onClick={() => onActionClick(action)}
                title={action.nextAction}
              >
                {action.entityName}
              </div>
            ))}
          </div>
        )
      })}

      {/* ROW 3 — Grid horario con visitas programadas */}
      <div className="grid-content-wrapper">
        {/* Eje de horas */}
        <div className="time-axis bg-gray-50/20 dark:bg-gray-800/10">
          {hours.map((h) => (
            <div key={h} className="time-slot-label">
              {h}:00
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        <div className="grid-columns-container">
          {days.map((day) => {
            const scheduled = (visitsByDate[day.iso] ?? []).filter((v) => !!v.scheduledTime)
            return (
              <div
                key={day.iso}
                className={`grid-column ${day.isToday ? 'grid-column--today' : ''}`}
              >
                {/* Líneas de hora e Interacción */}
                {hours.map((h) => (
                  <React.Fragment key={h}>
                    <div
                      className="grid-hour-line"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                    <div
                      className="grid-hour-slot hover:bg-indigo-500/[0.03] transition-colors cursor-cell"
                      style={{ 
                        top: (h - START_HOUR) * HOUR_HEIGHT, 
                        height: HOUR_HEIGHT,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        zIndex: 1
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day.iso, `${h.toString().padStart(2, '0')}:00`)}
                      onClick={() => onSlotClick?.(day.iso, `${h.toString().padStart(2, '0')}:00`)}
                      title={`Agendar visita a las ${h}:00`}
                    />
                  </React.Fragment>
                ))}

                {/* Indicador "ahora" */}
                {day.isToday && nowOffset !== null && (
                  <div className="now-indicator" style={{ top: nowOffset }} />
                )}

                {/* Bloques de visita (Con Lógica de Solapamiento) */}
                {(() => {
                  const dayVisits = scheduled.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
                  
                  // Agrupar visitas que colisionan
                  const groups: Visit[][] = []
                  dayVisits.forEach(v => {
                    let placed = false
                    for (const group of groups) {
                      const lastInGroup = group[group.length - 1]
                      // Si empieza antes de que termine la última del grupo -> hay colisión
                      const lastEnd = (parseInt(lastInGroup.scheduledTime!.split(':')[0]) * 60) + parseInt(lastInGroup.scheduledTime!.split(':')[1]) + lastInGroup.durationMinutes
                      const currentStart = (parseInt(v.scheduledTime!.split(':')[0]) * 60) + parseInt(v.scheduledTime!.split(':')[1])
                      
                      if (currentStart < lastEnd) {
                        group.push(v)
                        placed = true
                        break
                      }
                    }
                    if (!placed) groups.push([v])
                  })

                  return groups.flatMap(group => {
                    return group.map((visit, idx) => {
                      const pos = getVisitPosition(visit, group.length, idx)
                      if (!pos) return null
                      return (
                        <div
                          key={visit.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, visit.id)}
                          onDragEnd={handleDragEnd}
                          className={`visit-time-block visit-time-block--${visit.type ?? 'otros'} shadow-lg`}
                          style={{ 
                            top: pos.top, 
                            height: pos.height, 
                            width: pos.width,
                            left: pos.left,
                            padding: '2px', // Espacio entre solapamientos
                            zIndex: 10 
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onVisitClick(visit);
                          }}
                        >
                          <div className="visit-block-name truncate">{resolveName(visit)}</div>
                          <div className="visit-block-meta">
                            <span>{visit.scheduledTime}</span>
                          </div>
                        </div>
                      )
                    })
                  })
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
