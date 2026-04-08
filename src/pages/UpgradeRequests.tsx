import { UpgradeRequestsManager } from '../components/UpgradeRequestsManager'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import { useState, useCallback } from 'react'
import { useConfirm } from '../lib/ConfirmProvider'
import type { UpgradeRequest } from '../lib/data/upgradeRequests'
import { createUpgradeRequest } from '../lib/data/upgradeRequests'
import Button from '../components/ui/Button'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CreateUpgradeRequestModal } from '../components/CreateUpgradeRequestModal'
import type { Distributor } from '../lib/types'

export default function UpgradeRequests() {
  const { updateDistributor, distributors } = useAppData()
  const [notification, setNotification] = useState<string | null>(null)
  const { confirm } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateRequest = useCallback(
    (distributor: Distributor) => {
      createUpgradeRequest(
        String(distributor.id),
        distributor.name,
        distributor.channelType
      )
      setIsModalOpen(false)
      setRefreshKey((prev) => prev + 1)
      setNotification(
        `✅ Solicitud de upgrade creada para "${distributor.name}"`
      )
      setTimeout(() => setNotification(null), 5000)
    },
    [distributors]
  )

  const handleApprove = async (request: UpgradeRequest) => {
    // Buscar el distribuidor y actualizar su canal
    const distributor = distributors.find(
      (d) => String(d.id) === request.distributorId
    )

    if (distributor) {
      const shouldUpdate = await confirm({
        title: 'Aprobar Upgrade',
        description: `¿Deseas actualizar automáticamente el canal de "${distributor.name}" a "exclusive"?`,
        confirmText: 'Aprobar',
        type: 'info'
      })

      if (shouldUpdate) {
        updateDistributor(distributor.id, {
          ...distributor,
          channelType: 'exclusive',
          brands: ['lowi', 'vodafone_resid', 'vodafone_soho'], // Todas las marcas por defecto
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
    <PageContainer className="py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Solicitudes de Upgrade
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona las solicitudes de distribuidores no-exclusiva que quieren
            upgrade a tienda exclusiva
          </p>
        </div>
        <div>
          <Button
            onClick={() => setIsModalOpen(true)}
            icon={PlusIcon}
            className="w-full md:w-auto"
          >
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200">
          {notification}
        </div>
      )}

      <UpgradeRequestsManager key={refreshKey} onApprove={handleApprove} />

      <CreateUpgradeRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCreateRequest}
        distributors={distributors}
      />
    </PageContainer>
  )
}
