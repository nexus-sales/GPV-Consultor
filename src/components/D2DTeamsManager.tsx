import { useState, useEffect } from 'react'
import {
  getD2DTeams,
  createD2DTeam,
  updateD2DTeam,
  deactivateTeam,
  getTeamMembersByTeamId,
  getAllTeamsStats,
  type D2DTeam
} from '../lib/data/d2dTeams'
import { useAppData } from '../lib/useAppData'
import Card from './ui/Card'
import Button from './ui/Button'
import Modal from './ui/Modal'

export const D2DTeamsManager = () => {
  const { distributors } = useAppData()
  const [teams, setTeams] = useState<D2DTeam[]>([])
  const [selectedTeam, setSelectedTeam] = useState<D2DTeam | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamNotes, setNewTeamNotes] = useState('')

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = () => {
    const allTeams = getD2DTeams()
    setTeams(allTeams)
  }

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      alert('⚠️ El nombre del equipo es obligatorio')
      return
    }

    createD2DTeam(newTeamName, undefined, undefined, newTeamNotes)
    setNewTeamName('')
    setNewTeamNotes('')
    setShowCreateModal(false)
    loadTeams()
  }

  const handleDeactivateTeam = (teamId: string) => {
    if (
      window.confirm(
        '¿Deseas desactivar este equipo? Los miembros quedarán sin equipo.'
      )
    ) {
      deactivateTeam(teamId)
      loadTeams()
    }
  }

  const handleEditTeam = (team: D2DTeam) => {
    setSelectedTeam(team)
    setNewTeamName(team.name)
    setNewTeamNotes(team.notes || '')
    setShowEditModal(true)
  }

  const handleUpdateTeam = () => {
    if (!selectedTeam || !newTeamName.trim()) return

    updateD2DTeam(selectedTeam.id, {
      name: newTeamName,
      notes: newTeamNotes
    })

    setShowEditModal(false)
    setSelectedTeam(null)
    setNewTeamName('')
    setNewTeamNotes('')
    loadTeams()
  }

  const d2dDistributors = distributors.filter((d) => d.channelType === 'd2d')
  const teamsStats = getAllTeamsStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Equipos D2D
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona equipos Door-to-Door y consolida ventas por equipo
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Crear Equipo
        </Button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Equipos
          </div>
          <div className="text-2xl font-bold">
            {teams.filter((t) => t.active).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Miembros
          </div>
          <div className="text-2xl font-bold">
            {teamsStats.reduce((sum, t) => sum + t.memberCount, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Distribuidores D2D
          </div>
          <div className="text-2xl font-bold">{d2dDistributors.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Sin Equipo
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {d2dDistributors.filter((d) => !d.teamId).length}
          </div>
        </Card>
      </div>

      {/* Lista de equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams
          .filter((t) => t.active)
          .map((team) => {
            const members = getTeamMembersByTeamId(team.id)
            const stats = teamsStats.find((s) => s.teamId === team.id)

            return (
              <Card
                key={team.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.memberCount || 0} miembros
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      title="Editar equipo"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeactivateTeam(team.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      title="Desactivar equipo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {team.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                    {team.notes}
                  </p>
                )}

                {members.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Miembros:
                    </div>
                    {members.slice(0, 3).map((member) => (
                      <div
                        key={member.distributorId}
                        className="text-sm flex items-center gap-2"
                      >
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            member.role === 'leader'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {member.role === 'leader' ? '👑' : '👤'}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {member.distributorName}
                        </span>
                      </div>
                    ))}
                    {members.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{members.length - 3} más...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Sin miembros asignados
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Ver detalles →
                  </button>
                </div>
              </Card>
            )
          })}
      </div>

      {/* Modal crear equipo */}
      {showCreateModal && (
        <Modal
          onClose={() => {
            setShowCreateModal(false)
            setNewTeamName('')
            setNewTeamNotes('')
          }}
          title="Crear Nuevo Equipo D2D"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ej: Equipo Norte Tenerife"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={newTeamNotes}
                onChange={(e) => setNewTeamNotes(e.target.value)}
                placeholder="Descripción del equipo, zona de cobertura, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewTeamName('')
                  setNewTeamNotes('')
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreateTeam}>
                Crear Equipo
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal editar equipo */}
      {showEditModal && (
        <Modal
          onClose={() => {
            setShowEditModal(false)
            setSelectedTeam(null)
            setNewTeamName('')
            setNewTeamNotes('')
          }}
          title="Editar Equipo D2D"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ej: Equipo Norte Tenerife"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={newTeamNotes}
                onChange={(e) => setNewTeamNotes(e.target.value)}
                placeholder="Descripción del equipo, zona de cobertura, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedTeam(null)
                  setNewTeamName('')
                  setNewTeamNotes('')
                }}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleUpdateTeam}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
