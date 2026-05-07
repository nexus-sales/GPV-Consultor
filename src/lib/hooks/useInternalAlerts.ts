import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../useAppData'
import { checkVisitAlerts } from '../notifications/visitAlertChecker'

const STORAGE_KEY = 'gpv_internal_alerts_last_shown'
const COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours between alert bursts
const CHECK_INTERVAL_MS = 60 * 60 * 1000 // re-check every hour

function shouldShowAlerts(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return true
  return Date.now() - Number(raw) > COOLDOWN_MS
}

function markAlertsShown() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()))
}

export function useInternalAlerts() {
  const { candidates, tasks, distributors } = useAppData()
  const navigate = useNavigate()
  const hasRunRef = useRef(false)

  function runChecks() {
    if (!shouldShowAlerts()) return

    const today = new Date().toISOString().slice(0, 10)
    let fired = false

    // 1. Distributor visit alerts
    const visitAlerts = checkVisitAlerts(distributors)
    const criticalVisits = visitAlerts.filter((a) => a.severity === 'critical')
    const warningVisits = visitAlerts.filter((a) => a.severity === 'warning')

    if (criticalVisits.length > 0) {
      const names = criticalVisits
        .slice(0, 2)
        .map((a) => a.distributorName)
        .join(', ')
      const extra =
        criticalVisits.length > 2 ? ` y ${criticalVisits.length - 2} más` : ''
      toast.error(
        `${criticalVisits.length} distribuidor${criticalVisits.length > 1 ? 'es' : ''} sin visita`,
        {
          description: `${names}${extra} llevan más de 21 días sin contacto`,
          duration: 8000,
          action: {
            label: 'Ver',
            onClick: () => navigate('/distributors')
          }
        }
      )
      fired = true
    } else if (warningVisits.length > 0) {
      const names = warningVisits
        .slice(0, 2)
        .map((a) => a.distributorName)
        .join(', ')
      const extra =
        warningVisits.length > 2 ? ` y ${warningVisits.length - 2} más` : ''
      toast.warning('Visitas pendientes esta semana', {
        description: `${names}${extra} se acercan a los 21 días sin visita`,
        duration: 6000,
        action: {
          label: 'Ver',
          onClick: () => navigate('/distributors')
        }
      })
      fired = true
    }

    // 2. Overdue / due-today tasks
    const urgentTasks = tasks.filter(
      (t) =>
        t.status === 'pending' && t.dueDate && t.dueDate.slice(0, 10) <= today
    )
    if (urgentTasks.length > 0) {
      const overdue = urgentTasks.filter(
        (t) => t.dueDate && t.dueDate.slice(0, 10) < today
      )
      const dueToday = urgentTasks.filter(
        (t) => t.dueDate && t.dueDate.slice(0, 10) === today
      )
      const parts: string[] = []
      if (overdue.length > 0)
        parts.push(`${overdue.length} vencida${overdue.length > 1 ? 's' : ''}`)
      if (dueToday.length > 0) parts.push(`${dueToday.length} para hoy`)
      toast.warning(`Tareas pendientes: ${parts.join(' · ')}`, {
        description: urgentTasks
          .slice(0, 2)
          .map((t) => t.title)
          .join(', '),
        duration: 6000,
        action: {
          label: 'Ver',
          onClick: () => navigate('/tasks')
        }
      })
      fired = true
    }

    // 3. Stale candidates (>7 days no contact, not rejected)
    const staleCandidates = candidates.filter((c) => {
      if (c.stage === 'rejected' || c.stage === 'approved') return false
      const lastDate = c.lastContactAt ?? c.updatedAt
      if (!lastDate) return false
      const days = Math.floor(
        (Date.now() - new Date(lastDate).getTime()) / 86_400_000
      )
      return days > 7
    })
    if (staleCandidates.length > 0) {
      const names = staleCandidates
        .slice(0, 2)
        .map((c) => c.name)
        .join(', ')
      const extra =
        staleCandidates.length > 2 ? ` y ${staleCandidates.length - 2} más` : ''
      toast.info(
        `${staleCandidates.length} candidato${staleCandidates.length > 1 ? 's' : ''} sin contacto reciente`,
        {
          description: `${names}${extra} llevan más de 7 días sin actividad`,
          duration: 6000,
          action: {
            label: 'Ver',
            onClick: () => navigate('/candidates')
          }
        }
      )
      fired = true
    }

    if (fired) markAlertsShown()
  }

  useEffect(() => {
    // Skip on first mount if data hasn't loaded yet (avoid false empty-state alerts)
    if (!hasRunRef.current) {
      hasRunRef.current = true
      // Small delay to let data load before first check
      const timer = setTimeout(runChecks, 3000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Periodic re-check while the app is open
  useEffect(() => {
    const interval = setInterval(runChecks, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, tasks, distributors])
}
