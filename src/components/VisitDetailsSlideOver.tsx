import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Visit,
  Distributor,
  Candidate,
  EntityId,
  NoteEntry
} from '../lib/types'
import SlideOver from './ui/SlideOver'
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

interface VisitDetailsSlideOverProps {
  visit: Visit | null
  onClose: () => void
  distributor: Distributor | null
  candidate: Candidate | null
  onEdit: (visit: Visit) => void
  onComplete: (
    id: EntityId,
    result: Visit['result'],
    outcome?: Visit['outcome']
  ) => void
}

const resolveVisitTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    presentacion: 'Presentación',
    seguimiento: 'Seguimiento',
    formacion: 'Formación',
    incidencias: 'Incidencias',
    apertura: 'Apertura',
    otros: 'Otros'
  }
  return labels[type] || labels.otros
}

export const VisitDetailsSlideOver: React.FC<VisitDetailsSlideOverProps> = ({
  visit,
  onClose,
  distributor,
  candidate,
  onEdit: _,
  onComplete
}) => {
  const navigate = useNavigate()
  if (!visit) return null

  const entityName = distributor?.name || candidate?.name || 'Contacto'
  const entityLocation = distributor
    ? `${distributor.city}, ${distributor.province}`
    : candidate
      ? `${candidate.city}, ${candidate.island || candidate.province}`
      : 'Ubicación pendiente'

  const entityPhone = distributor?.phone || candidate?.contact?.phone
  const history = (
    distributor?.notesHistory ||
    candidate?.notesHistory ||
    []
  ).slice(0, 4)

  const priorityColors = {
    high: 'bg-rose-500 text-white ring-rose-500/20',
    medium: 'bg-amber-500 text-white ring-amber-500/20',
    low: 'bg-indigo-500 text-white ring-indigo-500/20'
  }

  const statusLabels = {
    planificada: '🕒 Planificada',
    en_ruta: '🚗 En Ruta',
    en_reunion: '💼 En Reunión',
    finalizada: '✅ Finalizada'
  }

  return (
    <SlideOver
      open={!!visit}
      onClose={onClose}
      title={entityName}
      subtitle={
        <div className="flex items-center gap-2">
          <span>{resolveVisitTypeLabel(visit.type)}</span>
          {visit.priority && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${priorityColors[visit.priority]}`}
            >
              Prioridad{' '}
              {visit.priority === 'high'
                ? 'Alta'
                : visit.priority === 'medium'
                  ? 'Media'
                  : 'Baja'}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Contact Info Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <MapPinIcon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{entityLocation}</span>
            </div>
            {entityPhone && (
              <a
                href={`tel:${entityPhone}`}
                className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <PhoneIcon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{entityPhone}</span>
              </a>
            )}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (distributor) navigate(`/distributors/${distributor.id}`)
                  else if (candidate) navigate(`/candidates/${candidate.id}`)
                }}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Ver Ficha Completa
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Visit Details Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
              <CalendarDaysIcon className="h-5 w-5" />
              Detalles de la Visita
            </div>
            {visit.statusOperative && (
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {statusLabels[visit.statusOperative]}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                Objetivo principal
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {visit.objective || 'Sin definir'}
              </p>
            </div>
            {visit.outcome && (
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                  Resultado de la visita
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      visit.outcome === 'positive'
                        ? 'bg-emerald-500'
                        : visit.outcome === 'negative'
                          ? 'bg-rose-500'
                          : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-sm font-bold capitalize">
                    {visit.outcome === 'positive'
                      ? 'Éxito / Positivo'
                      : visit.outcome === 'negative'
                        ? 'No interesado / Negativo'
                        : 'Neutral / En progreso'}
                  </span>
                </div>
              </div>
            )}
            <div className="p-5">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                Notas / Resumen
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                {visit.summary ||
                  'Pendiente de registrar resumen tras la visita.'}
              </p>
            </div>
          </div>
        </section>

        {/* Action Status Section */}
        <section>
          {visit.result === 'pendiente' ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-bold uppercase mb-2">
                Registrar Resultado y Cerrar
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onComplete(visit.id, 'completada', 'positive')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
                >
                  <CheckBadgeIcon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">ÉXITO</span>
                </button>
                <button
                  onClick={() => onComplete(visit.id, 'completada', 'neutral')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">NEUTRAL</span>
                </button>
                <button
                  onClick={() => onComplete(visit.id, 'completada', 'negative')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition shadow-sm"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">NEGATIVO</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm ${
                visit.result === 'completada'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <CheckBadgeIcon className="h-6 w-6" />
              {visit.result === 'completada'
                ? 'Visita Realizada'
                : 'Visita Cancelada'}
            </div>
          )}
        </section>

        {/* Historical Context Section */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Contexto de Interacciones
            </div>
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {history.map((note, idx) => (
                <div key={note.id || idx} className="relative">
                  <div className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500" />
                  <div className="text-xs text-slate-400 font-medium mb-1">
                    {new Date(note.timestamp).toLocaleDateString()} •{' '}
                    {note.category || 'General'}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {note.title}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </SlideOver>
  )
}
