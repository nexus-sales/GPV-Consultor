import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import SlideOver from './SlideOver'
import type { Distributor } from '../../lib/types'

interface Props {
  distributor: Distributor | null
  onClose: () => void
}

const STATUS_COLORS: Record<string, string> = {
  active:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  blocked: 'Bloqueado'
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-rose-600 dark:text-rose-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-slate-500 dark:text-slate-400'
}

const CHANNEL_LABELS: Record<string, string> = {
  exclusive: 'Tienda exclusiva',
  non_exclusive: 'Tienda no exclusiva',
  d2d: 'Door to Door',
  collaborator: 'Colaborador',
  commercial: 'Comercial'
}

export const DistributorPreview: React.FC<Props> = ({
  distributor,
  onClose
}) => {
  const navigate = useNavigate()

  return (
    <SlideOver
      open={!!distributor}
      onClose={onClose}
      title={distributor?.name ?? ''}
      subtitle={
        distributor ? (
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {distributor.code}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[distributor.status] ?? ''}`}
            >
              {STATUS_LABELS[distributor.status] ?? distributor.status}
            </span>
          </div>
        ) : null
      }
    >
      {distributor && (
        <div className="space-y-5">
          {/* Contacto */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
              Contacto
            </h3>
            <div className="space-y-2">
              {distributor.contactPerson && (
                <div className="flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {distributor.contactPerson}
                  </span>
                </div>
              )}
              {distributor.phone && (
                <a
                  href={`tel:${distributor.phone}`}
                  className="group flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50/70 p-2.5 transition hover:bg-sky-100/70 dark:border-sky-900/40 dark:bg-sky-950/30 dark:hover:bg-sky-950/50"
                >
                  <PhoneIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {distributor.phone}
                  </span>
                </a>
              )}
              {distributor.email && (
                <a
                  href={`mailto:${distributor.email}`}
                  className="group flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50/70 p-2.5 transition hover:bg-sky-100/70 dark:border-sky-900/40 dark:bg-sky-950/30 dark:hover:bg-sky-950/50"
                >
                  <EnvelopeIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {distributor.email}
                  </span>
                </a>
              )}
              {(distributor.city || distributor.address) && (
                <div className="flex items-start gap-3 rounded-lg border border-teal-100 bg-teal-50/70 p-2.5 dark:border-teal-900/40 dark:bg-teal-950/30">
                  <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {[distributor.city, distributor.province]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {distributor.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {distributor.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Marcas y canal */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-300">
              Comercial
            </h3>
            <div className="space-y-3">
              {distributor.channelType && (
                <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/70 p-2.5 dark:border-violet-900/40 dark:bg-violet-950/30">
                  <TagIcon className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {CHANNEL_LABELS[distributor.channelType] ??
                      distributor.channelType}
                  </span>
                </div>
              )}
              {distributor.brands && distributor.brands.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {distributor.brands.map((b) => (
                    <span
                      key={b}
                      className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* KPIs rapidos */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-300">
              Rendimiento
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Ventas YTD
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {distributor.salesYtd ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Prioridad
                </p>
                <div className="flex items-center gap-1.5">
                  <ChartBarIcon
                    className={`h-4 w-4 ${PRIORITY_COLORS[distributor.priorityLevel ?? 'medium']}`}
                  />
                  <p
                    className={`text-sm font-black capitalize ${PRIORITY_COLORS[distributor.priorityLevel ?? 'medium']}`}
                  >
                    {distributor.priorityLevel === 'high'
                      ? 'Alta'
                      : distributor.priorityLevel === 'medium'
                        ? 'Media'
                        : 'Baja'}
                  </p>
                </div>
                {typeof distributor.priorityScore === 'number' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Score: {distributor.priorityScore}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3 dark:border-sky-900/40 dark:bg-sky-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Completitud
                </p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {typeof distributor.completion === 'number'
                    ? `${distributor.completion}%`
                    : '-'}
                </p>
              </div>
              <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-3 dark:border-teal-900/40 dark:bg-teal-950/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Checklist
                </p>
                <p
                  className={`text-sm font-black ${distributor.checklistComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                  {distributor.checklistComplete ? 'Completo' : 'Incompleto'}
                </p>
              </div>
            </div>
          </section>

          {/* Notas */}
          {distributor.notes && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">
                Notas
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4">
                {distributor.notes}
              </p>
            </section>
          )}

          {/* CTA */}
          <button
            onClick={() => {
              navigate(`/distributors/${distributor.id}`)
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
