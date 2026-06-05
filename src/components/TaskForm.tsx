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
import type { Task, NewTask, EntityId } from '../lib/types'

interface TaskFormProps {
  initial?: Partial<Task>
  onSubmit: (payload: NewTask) => void
  onCancel: () => void
  entityId?: EntityId
  entityType?: 'distributor' | 'candidate'
}

const fieldClassName =
  'w-full rounded-xl border border-indigo-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/45 p-5 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500">
            Tarea operativa
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Trabajo pendiente
          </h3>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Titulo de la tarea
          </label>
          <div className="relative">
            <TagIcon className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className={`${fieldClassName} pl-10`}
              placeholder="Ej: Llamar para confirmar cita"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
            Descripcion / notas
          </label>
          <div className="relative">
            <ChatBubbleLeftRightIcon className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`${fieldClassName} min-h-[96px] resize-none pl-10`}
              placeholder="Detalles adicionales sobre la tarea..."
            />
          </div>
        </div>
      </section>

      {(!entityId || !entityType) && (
        <section className="rounded-2xl border border-teal-100 bg-teal-50/45 p-5 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/5">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-teal-600">
            Vinculacion
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Tipo de vinculacion
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-teal-500" />
                <select
                  name="entityType"
                  value={formData.entityType}
                  onChange={handleChange}
                  className={`${fieldClassName} border-teal-100 pl-10 focus:border-teal-400 focus:ring-teal-500/20`}
                >
                  <option value="candidate">Candidato</option>
                  <option value="distributor">Distribuidor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Asignar a...
              </label>
              <div className="relative">
                <UserGroupIcon className="absolute left-3 top-3 h-5 w-5 text-teal-500" />
                <select
                  name="entityId"
                  required
                  value={formData.entityId}
                  onChange={handleChange}
                  className={`${fieldClassName} border-teal-100 pl-10 focus:border-teal-400 focus:ring-teal-500/20`}
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
        </section>
      )}

      <section className="rounded-2xl border border-amber-100 bg-amber-50/45 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-amber-600">
          Agenda y prioridad
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Fecha
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-amber-500" />
              <input
                type="date"
                name="dueDate"
                required
                value={formData.dueDate}
                onChange={handleChange}
                className={`${fieldClassName} border-amber-100 pl-10 focus:border-amber-400 focus:ring-amber-500/20`}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Hora opcional
            </label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-3 h-5 w-5 text-amber-500" />
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime}
                onChange={handleChange}
                className={`${fieldClassName} border-amber-100 pl-10 focus:border-amber-400 focus:ring-amber-500/20`}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
              Prioridad
            </label>
            <div className="relative">
              <FlagIcon className="absolute left-3 top-3 h-5 w-5 text-amber-500" />
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`${fieldClassName} border-amber-100 pl-10 focus:border-amber-400 focus:ring-amber-500/20`}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-500/40 active:translate-y-0"
        >
          {initial?.id ? 'Guardar Cambios' : 'Crear Tarea'}
        </button>
      </div>
    </form>
  )
}
