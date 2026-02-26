// Cola de sincronización offline para entidades principales
// Se guarda en localStorage y se procesa cuando hay conexión

export type SyncPayload = Record<string, unknown> // Define a more specific payload type

export type SyncAction = {
  type: 'add' | 'update' | 'delete'
  entity: 'user' | 'distributor' | 'candidate' | 'visit' | 'sale'
  payload: SyncPayload
  timestamp: number
}

const QUEUE_KEY = 'sync_queue_v1'

export function getSyncQueue(): SyncAction[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToSyncQueue(action: SyncAction) {
  const queue = getSyncQueue()
  queue.push(action)
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearSyncQueue() {
  window.localStorage.removeItem(QUEUE_KEY)
}

export function removeFirstSyncAction() {
  const queue = getSyncQueue()
  queue.shift()
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}
