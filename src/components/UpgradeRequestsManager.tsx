import { useState, useEffect } from 'react'
import {
  getUpgradeRequests,
  approveRequest,
  rejectRequest,
  getRequestStats,
  type UpgradeRequest
} from '../lib/data/upgradeRequests'
import Card from './ui/Card'
import Button from './ui/Button'

interface UpgradeRequestsManagerProps {
  onApprove?: (request: UpgradeRequest) => void
}

export const UpgradeRequestsManager = ({
  onApprove
}: UpgradeRequestsManagerProps) => {
  const [requests, setRequests] = useState<UpgradeRequest[]>([])
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending')
  const [stats, setStats] = useState(getRequestStats())
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(
    null
  )
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadRequests = () => {
    const allRequests = getUpgradeRequests()
    const filtered =
      filter === 'all'
        ? allRequests
        : allRequests.filter((r) => r.status === filter)

    setRequests(
      filtered.sort(
        (a, b) =>
          new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      )
    )
    setStats(getRequestStats())
  }

  const handleApprove = (request: UpgradeRequest) => {
    const success = approveRequest(
      request.id,
      'Admin',
      reviewNotes || 'Aprobado automáticamente'
    )
    if (success) {
      loadRequests()
      setSelectedRequest(null)
      setReviewNotes('')
      onApprove?.(request)
      alert(
        `✅ Solicitud ${request.id} aprobada. Actualiza el distribuidor a canal 'exclusive' manualmente.`
      )
    }
  }

  const handleReject = (request: UpgradeRequest) => {
    if (!reviewNotes.trim()) {
      alert('⚠️ Debes proporcionar un motivo de rechazo')
      return
    }

    const success = rejectRequest(request.id, 'Admin', reviewNotes)
    if (success) {
      loadRequests()
      setSelectedRequest(null)
      setReviewNotes('')
    }
  }

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: UpgradeRequest['status']) => {
    const styles = {
      pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }

    const labels = {
      pending: '⏳ Pendiente',
      approved: '✅ Aprobada',
      rejected: '❌ Rechazada'
    }

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4 border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            Pendientes
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </div>
        </Card>
        <Card className="p-4 border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400">
            Aprobadas
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.approved}
          </div>
        </Card>
        <Card className="p-4 border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400">
            Rechazadas
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.rejected}
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            onClick={() => setFilter(f)}
            size="sm"
          >
            {f === 'all'
              ? 'Todas'
              : f === 'pending'
                ? 'Pendientes'
                : f === 'approved'
                  ? 'Aprobadas'
                  : 'Rechazadas'}
          </Button>
        ))}
      </div>

      {/* Lista de solicitudes */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Solicitudes de Upgrade ({requests.length})
          </h3>

          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay solicitudes {filter !== 'all' && filter}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-lg">
                          {request.distributorName}
                        </h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {request.id}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Canal actual:
                      </span>
                      <span className="ml-2 font-medium">
                        {request.currentChannel}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Canal solicitado:
                      </span>
                      <span className="ml-2 font-medium text-indigo-600 dark:text-indigo-400">
                        {request.requestedChannel}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Fecha solicitud:
                      </span>
                      <span className="ml-2 font-medium">
                        {formatDate(request.requestDate)}
                      </span>
                    </div>
                    {request.reviewDate && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Fecha revisión:
                        </span>
                        <span className="ml-2 font-medium">
                          {formatDate(request.reviewDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {request.notes && (
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      <div className="font-medium mb-1">Notas:</div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {request.notes}
                      </div>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {selectedRequest?.id === request.id ? (
                        <div className="space-y-3">
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Notas de revisión (opcional para aprobar, obligatorio para rechazar)"
                            rows={3}
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(request)}
                            >
                              ✅ Aprobar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(request)}
                            >
                              ❌ Rechazar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(null)
                                setReviewNotes('')
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          📝 Revisar solicitud
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
