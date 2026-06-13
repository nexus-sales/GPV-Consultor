import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Candidate } from '../../lib/types'
import { pipelineStages } from '../../lib/data/config' // v2: usar etapas dinámicas de BD

interface Props {
  candidates: Candidate[]
}

const ACTIVE_STAGES = ['new', 'contacted', 'evaluation', 'approved'] as const

const STAGE_COLORS: Record<
  string,
  { bar: string; text: string; badge: string }
> = {
  new: {
    bar: 'bg-slate-400 dark:bg-slate-500',
    text: 'text-slate-600 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  },
  contacted: {
    bar: 'bg-amber-400 dark:bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  },
  evaluation: {
    bar: 'bg-indigo-500 dark:bg-indigo-400',
    text: 'text-indigo-700 dark:text-indigo-400',
    badge:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
  },
  approved: {
    bar: 'bg-emerald-500 dark:bg-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-400',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
}

export const PipelineFunnelChart: React.FC<Props> = ({ candidates }) => {
  const navigate = useNavigate()

  const stageCounts = useMemo(() => {
    return ACTIVE_STAGES.map((stageId) => {
      const stage = pipelineStages.find((s) => s.id === stageId)
      const count = candidates.filter((c) => c.stage === stageId).length
      return { id: stageId, label: stage?.label ?? stageId, count }
    })
  }, [candidates])

  const total = stageCounts.reduce((s, c) => s + c.count, 0)
  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1)

  const conversionRates = useMemo(() => {
    return stageCounts.map((stage, i) => {
      if (i === 0) return null
      const prev = stageCounts[i - 1].count
      if (prev === 0) return null
      return Math.round((stage.count / prev) * 100)
    })
  }, [stageCounts])

  return (
    <div className="rounded-[20px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Conversión del Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {total} candidatos activos
          </p>
        </div>
        <button
          onClick={() => navigate('/candidates')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Ver todos →
        </button>
      </div>

      {total === 0 ? (
        <p className="text-sm text-slate-400 italic text-center py-6">
          Sin candidatos en el pipeline
        </p>
      ) : (
        <div className="space-y-3">
          {stageCounts.map((stage, i) => {
            const colors = STAGE_COLORS[stage.id] ?? STAGE_COLORS.new
            const barWidth = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
            const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0
            const rate = conversionRates[i]

            return (
              <div key={stage.id}>
                {/* Flecha de tasa de conversión entre etapas */}
                {rate !== null && i > 0 && (
                  <div className="flex items-center gap-2 py-1 pl-1">
                    <div className="w-1 h-4 flex flex-col items-center">
                      <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <span
                      className={`text-[10px] font-bold ${rate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : rate >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}
                    >
                      {rate}% conversión
                    </span>
                  </div>
                )}

                {/* Fila de etapa */}
                <div
                  className="group cursor-pointer"
                  onClick={() => navigate(`/candidates?stage=${stage.id}`)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${colors.text}`}>
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{pct}%</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${colors.badge}`}
                      >
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 group-hover:opacity-80 ${colors.bar}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rechazados */}
      {(() => {
        const rejected = candidates.filter((c) => c.stage === 'rejected').length
        if (rejected === 0) return null
        return (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Rechazados
            </span>
            <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
              {rejected}
            </span>
          </div>
        )
      })()}
    </div>
  )
}
