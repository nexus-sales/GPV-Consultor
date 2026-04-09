import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import SlideOver from './SlideOver'
import type { Candidate } from '../../lib/types'

interface Props {
  candidate: Candidate | null
  onClose: () => void
}

const STAGE_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  evaluation: 'En evaluación',
  approved: 'Aprobado',
  rejected: 'Rechazado'
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  evaluation: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
}

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

export const CandidatePreview: React.FC<Props> = ({ candidate, onClose }) => {
  const navigate = useNavigate()

  const lastNote = candidate?.notesHistory?.at(-1)
  const days = daysSince(candidate?.lastContactAt ?? candidate?.updatedAt)

  return (
    <SlideOver
      open={!!candidate}
      onClose={onClose}
      title={candidate?.name ?? ''}
      subtitle={
        candidate ? (
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_COLORS[candidate.stage] ?? ''}`}>
              {STAGE_LABELS[candidate.stage] ?? candidate.stage}
            </span>
            {candidate.priority && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[candidate.priority] ?? ''}`}>
                {candidate.priority === 'high' ? 'Alta' : candidate.priority === 'medium' ? 'Media' : 'Baja'}
              </span>
            )}
          </div>
        ) : null
      }
    >
      {candidate && (
        <div className="space-y-6">
          {/* Contacto */}
          <section>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Contacto</h3>
            <div className="space-y-2">
              {candidate.contact?.phone && (
                <a
                  href={`tel:${candidate.contact.phone}`}
                  className="flex items-center gap-3 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                >
                  <PhoneIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{candidate.contact.phone}</span>
                </a>
              )}
              {candidate.contact?.email && (
                <a
                  href={`mailto:${candidate.contact.email}`}
                  className="flex items-center gap-3 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                >
                  <EnvelopeIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{candidate.contact.email}</span>
                </a>
              )}
              {(candidate.city || candidate.island) && (
                <div className="flex items-center gap-3 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {[candidate.city, candidate.island, candidate.province].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Actividad */}
          <section>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Actividad</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Último contacto</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {days !== null ? `Hace ${days}d` : '—'}
                </p>
                {days !== null && days > 7 && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Requiere atención</p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Creado</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Origen y canal */}
          {(candidate.source || candidate.channelCode) && (
            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Origen</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.source && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    <UserIcon className="h-3.5 w-3.5" /> {candidate.source}
                  </span>
                )}
                {candidate.channelCode && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <TagIcon className="h-3.5 w-3.5" /> {candidate.channelCode}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Última nota */}
          {lastNote && (
            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Última actividad</h3>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {lastNote.timestamp ? new Date(lastNote.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  {lastNote.category && <span className="ml-auto capitalize font-semibold">{lastNote.category}</span>}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3">{lastNote.content}</p>
                {lastNote.nextAction && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">→ {lastNote.nextAction}</p>
                )}
              </div>
            </section>
          )}

          {/* Notas */}
          {candidate.notes && !lastNote && (
            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Notas</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4">{candidate.notes}</p>
            </section>
          )}

          {/* CTA */}
          <button
            onClick={() => { navigate(`/candidates/${candidate.id}`); onClose() }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Ver ficha completa
          </button>
        </div>
      )}
    </SlideOver>
  )
}
