/**
 * Sistema de solicitudes de upgrade para distribuidores No-exclusiva
 *
 * Gestiona el workflow de solicitud → revisión → aprobación/rechazo
 */

export interface UpgradeRequest {
  id: string
  distributorId: string
  distributorName: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewDate?: string
  notes?: string
  currentChannel: string
  requestedChannel: 'exclusive' // Siempre solicitan upgrade a exclusiva
}

const STORAGE_KEY = 'upgrade_requests'

/**
 * Crea una nueva solicitud de upgrade
 */
export const createUpgradeRequest = (
  distributorId: string,
  distributorName: string,
  currentChannel: string
): UpgradeRequest => {
  const requests = getUpgradeRequests()

  // Verificar si ya existe una solicitud pendiente
  const existing = requests.find(
    (r) => r.distributorId === distributorId && r.status === 'pending'
  )

  if (existing) {
    return existing
  }

  const newRequest: UpgradeRequest = {
    id: `UPG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    distributorId,
    distributorName,
    requestDate: new Date().toISOString(),
    status: 'pending',
    currentChannel,
    requestedChannel: 'exclusive'
  }

  requests.push(newRequest)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))

  return newRequest
}

/**
 * Obtiene todas las solicitudes de upgrade
 */
export const getUpgradeRequests = (): UpgradeRequest[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    // Silent fail, return empty array
    return []
  }
}

/**
 * Obtiene solicitudes pendientes
 */
export const getPendingRequests = (): UpgradeRequest[] => {
  return getUpgradeRequests().filter((r) => r.status === 'pending')
}

/**
 * Obtiene solicitudes de un distribuidor específico
 */
export const getDistributorRequests = (
  distributorId: string
): UpgradeRequest[] => {
  return getUpgradeRequests().filter((r) => r.distributorId === distributorId)
}

/**
 * Verifica si un distribuidor tiene solicitud pendiente
 */
export const hasPendingRequest = (distributorId: string): boolean => {
  return getUpgradeRequests().some(
    (r) => r.distributorId === distributorId && r.status === 'pending'
  )
}

/**
 * Aprueba una solicitud de upgrade
 */
export const approveRequest = (
  requestId: string,
  reviewedBy: string,
  notes?: string
): boolean => {
  const requests = getUpgradeRequests()
  const request = requests.find((r) => r.id === requestId)

  if (!request || request.status !== 'pending') {
    return false
  }

  request.status = 'approved'
  request.reviewedBy = reviewedBy
  request.reviewDate = new Date().toISOString()
  request.notes = notes

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  return true
}

/**
 * Rechaza una solicitud de upgrade
 */
export const rejectRequest = (
  requestId: string,
  reviewedBy: string,
  notes: string
): boolean => {
  const requests = getUpgradeRequests()
  const request = requests.find((r) => r.id === requestId)

  if (!request || request.status !== 'pending') {
    return false
  }

  request.status = 'rejected'
  request.reviewedBy = reviewedBy
  request.reviewDate = new Date().toISOString()
  request.notes = notes

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  return true
}

/**
 * Cancela una solicitud pendiente
 */
export const cancelRequest = (requestId: string): boolean => {
  const requests = getUpgradeRequests()
  const index = requests.findIndex((r) => r.id === requestId)

  if (index === -1) {
    return false
  }

  requests.splice(index, 1)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  return true
}

/**
 * Estadísticas de solicitudes
 */
export const getRequestStats = () => {
  const requests = getUpgradeRequests()

  return {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    lastWeek: requests.filter((r) => {
      const date = new Date(r.requestDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date >= weekAgo
    }).length
  }
}
