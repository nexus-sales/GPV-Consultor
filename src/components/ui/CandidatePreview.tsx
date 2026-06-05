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
  evaluation: 'En evaluacion',
  approved: 'Aprobado',
  rejected: 'Rechazado'
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  contacted:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  evaluation:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  approved:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  medium:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
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
          <div className="mt-1 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_COLORS[candidate.stage] ?? ''}`}
            >
              {STAGE_LABELS[candidate.stage] ?? candidate.stage}
            </span>
            {candidate.priority && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[candidate.priority] ?? ''}`}
              >
                {candidate.priority === 'high'
                  ? 'Alta'
                  : candidate.priority === 'medium'
                    ? 'Media'
                    : 'Baja'}
              </span>
            )}
          </div>
        ) : null
      }
    >
      {candidate && (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
              Contacto
            </h3>
            <div className="space-y-2">
              {candidate.contact?.phone && (
                <a
                  href={`tel:${candidate.contact.phone}`}
                  className="group flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5 transition hover:bg-indigo-100/70 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50"
                >
                  <PhoneIcon className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.contact.phone}
                  </span>
                </a>
              )}

              {candidate.contact?.email && (
                <a
                  href={`mailto:${candidate.contact.email}`}
                  className="group flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50/70 p-2.5 transition hover:bg-sky-100/70 dark:border-sky-900/40 dark:bg-sky-950/30 dark:hover:bg-sky-950/50"
                >
                  <EnvelopeIcon className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.contact.email}
                  </span>
                </a>
              )}

              {(candidate.city || candidate.island) && (
                <div className="flex items-start gap-3 rounded-lg border border-teal-100 bg-teal-50/70 p-2.5 dark:border-teal-900/40 dark:bg-teal-950/30">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {[candidate.city, candidate.island, candidate.province]
                      .filter(Boolean)
                      .join(' - ')}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-300">
              Actividad
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ultimo contacto
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {days !== null ? `Hace ${days}d` : '-'}
                </p>
                {days !== null && days > 7 && (
                  <p className="mt-0.5 text-[10px] font-semibold text-rose-500">
                    Requiere atencion
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-900/40 dark:bg-violet-950/30">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Creado
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {candidate.createdAt
                    ? new Date(candidate.createdAt).toLocaleDateString(
                        'es-ES',
                        { day: '2-digit', month: 'short', year: '2-digit' }
                      )
                    : '-'}
                </p>
              </div>
            </div>
          </section>

          {(candidate.source || candidate.channelCode) && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-300">
                Origen
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.source && (
                  <span className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <UserIcon className="h-3.5 w-3.5" />
                    {candidate.source}
                  </span>
                )}
                {candidate.channelCode && (
                  <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <TagIcon className="h-3.5 w-3.5" />
                    {candidate.channelCode}
                  </span>
                )}
              </div>
            </section>
          )}

          {lastNote && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-300">
                Ultima actividad
              </h3>
              <div className="space-y-1 rounded-lg border border-teal-100 bg-teal-50/60 p-3 dark:border-teal-900/40 dark:bg-teal-950/25">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {lastNote.timestamp
                    ? new Date(lastNote.timestamp).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                  {lastNote.category && (
                    <span className="ml-auto font-semibold capitalize">
                      {lastNote.category}
                    </span>
                  )}
                </div>
                <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-200">
                  {lastNote.content}
                </p>
                {lastNote.nextAction && (
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {lastNote.nextAction}
                  </p>
                )}
              </div>
            </section>
          )}

          {candidate.notes && !lastNote && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">
                Notas
              </h3>
              <p className="line-clamp-4 text-sm text-slate-600 dark:text-slate-400">
                {candidate.notes}
              </p>
            </section>
          )}

          <button
            onClick={() => {
              navigate(`/candidates/${candidate.id}`)
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Ver ficha completa
          </button>
        </div>
      )}
    </SlideOver>
  )
}
