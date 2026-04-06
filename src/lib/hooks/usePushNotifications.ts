import { useCallback, useEffect, useState } from 'react'
import type { Distributor } from '../types'
import {
  checkVisitAlerts,
  summariseAlerts,
  type VisitAlert
} from '../notifications/visitAlertChecker'

const STORAGE_KEY = 'gpv_push_enabled'
const THROTTLE_KEY = 'gpv_notif_throttle'
const THROTTLE_HOURS = 8 // no volver a notificar el mismo distribuidor en < 8h

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

function loadThrottle(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(THROTTLE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveThrottle(map: Record<string, number>) {
  localStorage.setItem(THROTTLE_KEY, JSON.stringify(map))
}

function filterUnthrottled(alerts: VisitAlert[]): VisitAlert[] {
  const now = Date.now()
  const throttle = loadThrottle()
  const cutoff = THROTTLE_HOURS * 60 * 60 * 1000

  return alerts.filter((a) => {
    const last = throttle[String(a.distributorId)] ?? 0
    return now - last > cutoff
  })
}

function markNotified(alerts: VisitAlert[]) {
  const throttle = loadThrottle()
  const now = Date.now()
  alerts.forEach((a) => {
    throttle[String(a.distributorId)] = now
  })
  saveThrottle(throttle)
}

export function usePushNotifications(distributors: Distributor[]) {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission as PermissionState
  })

  const [enabled, setEnabledState] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  )

  const setEnabled = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value))
    setEnabledState(value)
  }, [])

  /**
   * Pide permiso al navegador y activa las notificaciones.
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') {
      setPermission('granted')
      setEnabled(true)
      return true
    }
    const result = await Notification.requestPermission()
    setPermission(result as PermissionState)
    if (result === 'granted') {
      setEnabled(true)
      return true
    }
    return false
  }, [setEnabled])

  /**
   * Comprueba alertas y dispara notificaciones para las no throttleadas.
   */
  const checkAndNotify = useCallback(
    (dists: Distributor[]) => {
      if (!enabled || permission !== 'granted') return

      const allAlerts = checkVisitAlerts(dists)
      if (allAlerts.length === 0) return

      const fresh = filterUnthrottled(allAlerts)
      if (fresh.length === 0) return

      const { title, body } = summariseAlerts(fresh)
      new Notification(title, {
        body,
        icon: '/icons/pwa-icon.svg',
        badge: '/icons/pwa-icon.svg',
        tag: 'gpv-visit-alert',
        renotify: true
      })

      markNotified(fresh)
    },
    [enabled, permission]
  )

  // Comprobar al montar y cada vez que cambian los distribuidores
  useEffect(() => {
    if (distributors.length > 0) {
      checkAndNotify(distributors)
    }
  }, [distributors, checkAndNotify])

  // Sincronizar estado del permiso si el usuario lo cambia desde el navegador
  useEffect(() => {
    if (!('permissions' in navigator)) return
    navigator.permissions
      .query({ name: 'notifications' })
      .then((status) => {
        const update = () =>
          setPermission(status.state as PermissionState)
        status.addEventListener('change', update)
        return () => status.removeEventListener('change', update)
      })
      .catch(() => undefined)
  }, [])

  return {
    permission,
    enabled,
    setEnabled,
    requestPermission,
    checkAndNotify: () => checkAndNotify(distributors),
    pendingAlerts: checkVisitAlerts(distributors)
  }
}
