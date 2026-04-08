import React, { useMemo, useState } from 'react'
import {
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { TaskForm } from '../components/TaskForm'
import { useAppData } from '../lib/useAppData'
import type { Task, TaskStatus, TaskPriority, EntityId } from '../lib/types'

const Tasks: React.FC = () => {
  const { tasks, updateTask, deleteTask, addTask, distributors, candidates } = useAppData()
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    return (tasks || [])
      .filter((t) => filterStatus === 'all' || t.status === filterStatus)
      .filter((t) => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [tasks, filterStatus, searchQuery])

  const getEntityName = (entityId: EntityId, entityType: string) => {
    if (entityType === 'distributor') {
      return distributors.find(d => String(d.id) === String(entityId))?.name || 'Desconocido'
    }
    return candidates.find(c => String(c.id) === String(entityId))?.name || 'Desconocido'
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsNewTaskModalOpen(true)
  }

  const handleDelete = (id: EntityId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      deleteTask(id)
    }
  }

  const handleToggleStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTask(task.id, { status: newStatus })
  }

  return (
    <PageContainer>
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Centro de Tareas
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Gestiona tus compromisos y seguimientos pendientes
        </p>
      </div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as TaskStatus | 'all')
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <Button onClick={() => { setEditingTask(null); setIsNewTaskModalOpen(true); }} icon={PlusIcon}>
          Nueva Tarea
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <TagIcon className="h-12 w-12 text-gray-200 mb-4" />
              <p className="text-gray-500">No se encontraron tareas con los filtros actuales.</p>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  task.priority === 'high' ? 'bg-red-500' : 
                  task.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300 hover:border-indigo-500'
                      }`}
                    >
                      {task.status === 'completed' && <CheckCircleIcon className="h-4 w-4 text-white" />}
                    </button>
                    
                    <div className="min-w-0">
                      <h3 className={`text-base font-bold ${
                        task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                          <span>Vence: {task.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                          <span className="uppercase">{task.entityType}:</span>
                          <span>{getEntityName(task.entityId, task.entityType)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Editar"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-indigo-600 text-white">
            <h3 className="text-lg font-bold">Resumen Diario</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs font-medium text-indigo-100 uppercase tracking-widest">Pendientes</p>
                <p className="mt-1 text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs font-medium text-indigo-100 uppercase tracking-widest">Urgentes</p>
                <p className="mt-1 text-2xl font-bold">{tasks.filter(t => t.status === 'pending' && t.priority === 'high').length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Próximos vencimientos</h3>
            <div className="space-y-4">
              {tasks
                .filter(t => t.status === 'pending')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${t.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-gray-700 dark:text-gray-200">{t.title}</p>
                      <p className="text-[10px] text-gray-400">{t.dueDate}</p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {isNewTaskModalOpen && (
        <Modal 
          onClose={() => { setIsNewTaskModalOpen(false); setEditingTask(null); }} 
          title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        >
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mb-6 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
            <p>Desde este panel general puedes crear tareas. No olvides asignar correctamente si es para un Distribuidor o Candidato.</p>
          </div>
          
          {/* Formulario adaptado para creación libre si no hay entidad preseleccionada */}
          <TaskForm
            initial={editingTask || {}}
            entityId={editingTask?.entityId || ''}
            entityType={editingTask?.entityType || 'distributor'}
            onSubmit={async (payload) => {
              if (editingTask) {
                await updateTask(editingTask.id, payload)
              } else {
                await addTask(payload)
              }
              setIsNewTaskModalOpen(false)
              setEditingTask(null)
            }}
            onCancel={() => { setIsNewTaskModalOpen(false); setEditingTask(null); }}
          />
        </Modal>
      )}
    </PageContainer>
  )
}

export default Tasks
