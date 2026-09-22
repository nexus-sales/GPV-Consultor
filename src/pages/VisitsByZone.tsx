/**
 * Visitas por zona — lista diaria de leads agrupada por territorio.
 *
 * Sustituye la prospección sin rumbo: agrupa los leads pendientes por código
 * postal y, dentro de cada zona, los ordena por recorrido (vecino más cercano)
 * en lugar de por fecha de alta. El resultado de cada visita se registra sin
 * salir de la pantalla.
 */

import React, { useCallback, useMemo, useState } from 'react'
import {
  MapPinIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
import { createLogger } from '../lib/logger'
import {
  groupLeadsByZone,
  isPendingVisit,
  resolveLeadPosition,
  type ZoneGroup
} from '../lib/data/zones'
import {
  getZoneQuota,
  setZoneQuota,
  getZoneQuotaProgress
} from '../lib/data/zoneQuotas'
import type { Lead, NewVisit } from '../lib/types'

const log = createLogger('VisitsByZone')

type VisitOutcome = 'no_answer' | 'not_interested' | 'appointment'

const ESTADO_BADGE: Record<string, string> = {
  nuevo: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  contactado:
    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  pendiente:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  interesado:
    'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const VisitsByZone: React.FC = () => {
  const { leads = [], visits = [], updateLead, addVisit } = useAppData()

  const [selectedZoneId, setSelectedZoneId] = useState<string>('all')
  const [startPoint, setStartPoint] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locating, setLocating] = useState(false)
  const [appointmentFor, setAppointmentFor] = useState<Lead | null>(null)
  const [appointmentDate, setAppointmentDate] = useState(todayISO())
  const [appointmentTime, setAppointmentTime] = useState('10:00')
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null)
  // Cambiar el objetivo no toca el estado global: este contador fuerza el
  // recálculo del progreso, que se deriva de las visitas reales.
  const [quotaVersion, setQuotaVersion] = useState(0)

  const pendingLeads = useMemo(() => leads.filter(isPendingVisit), [leads])

  const zoneGroups = useMemo(
    () => groupLeadsByZone(pendingLeads, startPoint),
    [pendingLeads, startPoint]
  )

  const visibleGroups = useMemo(
    () =>
      selectedZoneId === 'all'
        ? zoneGroups
        : zoneGroups.filter((group) => group.id === selectedZoneId),
    [zoneGroups, selectedZoneId]
  )

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Este navegador no permite obtener tu ubicación')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocating(false)
        toast.success('Ruta reordenada desde tu posición')
      },
      (error) => {
        setLocating(false)
        log.warn('No se pudo obtener la posición', error)
        toast.error('No se pudo obtener tu ubicación')
      },
      { timeout: 10000 }
    )
  }, [])

  const registerOutcome = useCallback(
    async (lead: Lead, outcome: VisitOutcome) => {
      setBusyLeadId(String(lead.id))
      try {
        if (outcome === 'no_answer') {
          await updateLead(lead.id, {
            estado: 'pendiente',
            proxima_accion: 'Reintentar visita'
          })
          toast.success(`"${lead.nombre}" queda pendiente de reintento`)
          return
        }

        if (outcome === 'not_interested') {
          await updateLead(lead.id, {
            estado: 'descartado',
            proxima_accion: 'No interesado'
          })
          toast.success(`"${lead.nombre}" marcado como no interesado`)
          return
        }
      } catch (error) {
        log.error('Error registrando el resultado de la visita', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'No se pudo registrar el resultado'
        )
      } finally {
        setBusyLeadId(null)
      }
    },
    [updateLead]
  )

  const confirmAppointment = useCallback(async () => {
    if (!appointmentFor) return

    const lead = appointmentFor
    setBusyLeadId(String(lead.id))

    try {
      const { position } = resolveLeadPosition(lead)

      const visit: NewVisit = {
        leadId: lead.id,
        distributorId: null,
        candidateId: null,
        sourceModule: 'leads',
        date: appointmentDate,
        scheduledTime: appointmentTime,
        type: 'presentacion',
        objective: `Visita concertada con ${lead.nombre}`,
        summary: '',
        nextSteps: '',
        result: 'pendiente',
        location: lead.direccion || lead.ciudad || '',
        lat: position?.lat,
        lng: position?.lng
      }

      // La visita primero: si la agenda la rechaza (solape, conflicto), el
      // lead no debe quedar marcado como citado.
      await addVisit(visit)

      await updateLead(lead.id, {
        estado: 'interesado',
        proxima_visita: appointmentDate,
        proxima_accion: `Visita ${appointmentDate} ${appointmentTime}`
      })

      setAppointmentFor(null)
      setQuotaVersion((value) => value + 1)
      toast.success(`Cita con "${lead.nombre}" el ${appointmentDate}`)
    } catch (error) {
      log.error('Error concertando la cita', error)
      toast.error(
        error instanceof Error ? error.message : 'No se pudo concertar la cita'
      )
    } finally {
      setBusyLeadId(null)
    }
  }, [appointmentFor, appointmentDate, appointmentTime, addVisit, updateLead])

  const changeQuota = useCallback((zoneId: string, currentTarget: number) => {
    const answer = window.prompt(
      'Objetivo de visitas a concertar esta semana en esta zona.\n' +
        'Se guarda solo en este dispositivo. Deja 0 para quitarlo.',
      String(currentTarget || '')
    )
    if (answer === null) return

    const parsed = Number(answer.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Introduce un número válido')
      return
    }

    setZoneQuota(zoneId, parsed)
    setQuotaVersion((value) => value + 1)
    toast.success(
      parsed > 0
        ? `Objetivo local de la zona: ${Math.floor(parsed)} visitas/semana`
        : 'Objetivo de la zona eliminado'
    )
  }, [])

  return (
    <PageContainer className="py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-slate-800 dark:text-white">
            Visitas por zona
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {pendingLeads.length} leads pendientes en {zoneGroups.length} zonas,
            ordenados por recorrido dentro de cada una.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedZoneId}
            onChange={(event) => setSelectedZoneId(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Todas las zonas</option>
            {zoneGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label} ({group.leads.length})
              </option>
            ))}
          </select>

          <Button variant="secondary" onClick={locateMe} disabled={locating}>
            <MapPinIcon className="mr-1.5 inline h-4 w-4" />
            {locating ? 'Localizando…' : 'Ordenar desde mi posición'}
          </Button>
        </div>
      </div>

      {pendingLeads.length === 0 ? (
        <Card className="p-10 text-center">
          <FlagIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            No hay leads pendientes de visita
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando entren leads nuevos desde Google, aparecerán aquí agrupados
            por zona.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <ZoneSection
              key={`${group.id}-${quotaVersion}`}
              group={group}
              leads={leads}
              visits={visits}
              busyLeadId={busyLeadId}
              onQuotaClick={changeQuota}
              onOutcome={registerOutcome}
              onAppointment={(lead) => {
                setAppointmentFor(lead)
                setAppointmentDate(todayISO())
                setAppointmentTime('10:00')
              }}
            />
          ))}
        </div>
      )}

      {appointmentFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
              Concertar visita
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              {appointmentFor.nombre}
              {appointmentFor.direccion ? ` · ${appointmentFor.direccion}` : ''}
            </p>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fecha
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hora
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setAppointmentFor(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmAppointment}
                disabled={busyLeadId === String(appointmentFor.id)}
              >
                Concertar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}

interface ZoneSectionProps {
  group: ZoneGroup
  leads: Lead[]
  visits: ReturnType<typeof useAppData>['visits']
  busyLeadId: string | null
  onQuotaClick: (zoneId: string, currentTarget: number) => void
  onOutcome: (lead: Lead, outcome: VisitOutcome) => void
  onAppointment: (lead: Lead) => void
}

const ZoneSection: React.FC<ZoneSectionProps> = ({
  group,
  leads,
  visits,
  busyLeadId,
  onQuotaClick,
  onOutcome,
  onAppointment
}) => {
  const progress = getZoneQuotaProgress(group.id, leads, visits)
  const target = getZoneQuota(group.id)

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {group.label}
          </h2>
          <p className="text-xs text-slate-500">
            {group.leads.length} pendientes
            {group.approximateCount > 0 &&
              ` · ${group.approximateCount} con ubicación aproximada`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onQuotaClick(group.id, target)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-left transition hover:border-indigo-300 dark:border-gray-700"
          title="El objetivo se guarda solo en este dispositivo"
        >
          {progress.hasTarget ? (
            <>
              <span
                className={`text-sm font-bold ${
                  progress.met
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-800 dark:text-white'
                }`}
              >
                {progress.achieved}/{progress.target}
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                citas · objetivo local
              </span>
              <span className="mt-1 block h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <span
                  className={`block h-full rounded-full ${
                    progress.met ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-500">
              Fijar objetivo semanal
            </span>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {group.leads.map((lead, index) => {
          const { approximate } = resolveLeadPosition(lead)
          const busy = busyLeadId === String(lead.id)

          return (
            <Card key={lead.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                      {lead.nombre}
                    </h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        ESTADO_BADGE[lead.estado] ?? ESTADO_BADGE.pendiente
                      }`}
                    >
                      {lead.estado}
                    </span>
                    {approximate && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        title="Posición estimada por municipio: el orden de recorrido es orientativo"
                      >
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        Ubicación aproximada
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {lead.direccion && (
                      <p className="flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{lead.direccion}</span>
                      </p>
                    )}
                    {lead.telefono && (
                      <p className="flex items-center gap-1.5">
                        <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href={`tel:${lead.telefono}`}
                          className="hover:text-indigo-600"
                        >
                          {lead.telefono}
                        </a>
                      </p>
                    )}
                    {lead.proxima_accion && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                        {lead.proxima_accion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onOutcome(lead, 'no_answer')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-gray-700 dark:text-slate-300"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Sin respuesta
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onOutcome(lead, 'not_interested')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-gray-700 dark:text-slate-300"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    No interesado
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onAppointment(lead)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <CalendarDaysIcon className="h-4 w-4" />
                    Concertar cita
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {progress.met && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="h-4 w-4" />
          Objetivo semanal de esta zona cumplido
        </p>
      )}
    </section>
  )
}

export default VisitsByZone
