import React, { useState } from 'react'
import {
  CalendarIcon,
  FlagIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../lib/useAppData'
import type { Task, NewTask, TaskPriority, TaskStatus, EntityId } from '../lib/types'

interface TaskFormProps {
  initial?: Partial<Task>
  onSubmit: (payload: NewTask) => void
  onCancel: () => void
  entityId?: EntityId
  entityType?: 'distributor' | 'candidate'
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initial,
  onSubmit,
  onCancel,
  entityId,
  entityType
}) => {
  const { distributors, candidates } = useAppData()
  const [formData, setFormData] = useState<NewTask>({
    title: initial?.title || '',
    description: initial?.description || '',
    status: initial?.status || 'pending',
    priority: initial?.priority || 'medium',
    dueDate: initial?.dueDate || new Date().toISOString().split('T')[0],
    dueTime: initial?.dueTime || '',
    entityId: entityId || initial?.entityId || '',
    entityType: entityType || initial?.entityType || 'candidate'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Título de la tarea
          </label>
          <div className="relative">
            <TagIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej: Llamar para confirmar cita"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Descripción / Notas
          </label>
          <div className="relative">
            <ChatBubbleLeftRightIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
              placeholder="Detalles adicionales sobre la tarea..."
            />
          </div>
        </div>

        {/* Selector de Entidad - Solo si no vienen predefinidos */}
        {(!entityId || !entityType) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                Tipo de Vinculación
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <select
                  name="entityType"
                  value={formData.entityType}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="candidate">Candidato</option>
                  <option value="distributor">Distribuidor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                Asignar a...
              </label>
              <div className="relative">
                <UserGroupIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <select
                  name="entityId"
                  required
                  value={formData.entityId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="">Selecciona destinatario...</option>
                  {formData.entityType === 'candidate'
                    ? candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    : distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Fecha
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="date"
                name="dueDate"
                required
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Hora (Opcional)
            </label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Prioridad
            </label>
            <div className="relative">
              <FlagIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {initial?.id ? 'Guardar Cambios' : 'Crear Tarea'}
        </button>
      </div>
    </form>
  )
}
