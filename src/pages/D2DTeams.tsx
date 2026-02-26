import { useState } from 'react'
import { D2DTeamsManager } from '../components/D2DTeamsManager'
import { TeamSalesConsolidatedView } from '../components/TeamSalesConsolidatedView'
import Button from '../components/ui/Button'

export default function D2DTeams() {
  const [activeTab, setActiveTab] = useState<'teams' | 'sales'>('teams')

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'teams'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          👥 Gestión de Equipos
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'sales'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          📊 Ventas Consolidadas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'teams' ? (
        <D2DTeamsManager />
      ) : (
        <TeamSalesConsolidatedView />
      )}
    </div>
  )
}
