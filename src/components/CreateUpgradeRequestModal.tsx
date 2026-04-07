import React, { useState, useMemo } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import type { Distributor } from '../lib/types'

interface CreateUpgradeRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (distributor: Distributor) => void
  distributors: Distributor[]
}

export const CreateUpgradeRequestModal: React.FC<CreateUpgradeRequestModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  distributors
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const eligibleDistributors = useMemo(() => {
    return distributors.filter(
      (d) => 
        d.channelType !== 'exclusive' && 
        (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         d.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [distributors, searchTerm])

  if (!isOpen) return null

  return (
    <Modal
      onClose={onClose}
      title="Nueva Solicitud de Upgrade"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un distribuidor que no sea exclusivo para crear una solicitud de upgrade.
        </p>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-10 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {eligibleDistributors.length > 0 ? (
            eligibleDistributors.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelect(d)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{d.name}</div>
                  <div className="text-xs text-gray-500">{d.code} • {d.channelType}</div>
                </div>
                <UserPlusIcon className="h-5 w-5 text-gray-400" />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No se encontraron distribuidores aptos
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
