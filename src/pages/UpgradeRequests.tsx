import { UpgradeRequestsManager } from '../components/UpgradeRequestsManager'
import { useAppData } from '../lib/useAppData'
import { useState } from 'react'
import type { UpgradeRequest } from '../lib/data/upgradeRequests'

export default function UpgradeRequests() {
  const { updateDistributor, distributors } = useAppData()
  const [notification, setNotification] = useState<string | null>(null)

  const handleApprove = (request: UpgradeRequest) => {
    // Buscar el distribuidor y actualizar su canal
    const distributor = distributors.find(
      (d) => String(d.id) === request.distributorId
    )

    if (distributor) {
      const shouldUpdate = window.confirm(
        `¿Deseas actualizar automáticamente el canal de "${distributor.name}" a "exclusive"?`
      )

      if (shouldUpdate) {
        updateDistributor(distributor.id, {
          ...distributor,
          channelType: 'exclusive',
          brands: ['silbo', 'lowi', 'vodafone_resid', 'vodafone_soho'], // Todas las marcas por defecto
          upgradeRequested: false // Resetear el checkbox
        })

        setNotification(
          `✅ Distribuidor "${distributor.name}" actualizado a canal Exclusiva`
        )
        setTimeout(() => setNotification(null), 5000)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Solicitudes de Upgrade
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona las solicitudes de distribuidores no-exclusiva que quieren
          upgrade a tienda exclusiva
        </p>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200">
          {notification}
        </div>
      )}

      <UpgradeRequestsManager onApprove={handleApprove} />
    </div>
  )
}
