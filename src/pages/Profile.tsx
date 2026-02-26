import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import { useAppData } from '../lib/useAppData'
import {
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ClockIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import type { User, Activity } from '../lib/types'

// Tipos locales del componente
interface UserPayload {
  fullName: string
  email: string
  role: string
  region: string
  permissions: string
  phone: string
}

interface Feedback {
  type: 'success' | 'warning'
  message: string
}

interface FieldProps {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  required?: boolean
}

const emptyUserPayload: UserPayload = {
  fullName: '',
  email: '',
  role: '',
  region: '',
  permissions: '',
  phone: ''
}

const toInitials = (value = ''): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

const formatDateTime = (value?: string): string => {
  if (!value) return 'Sin fecha registrada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date)
}

const Profile: React.FC = () => {
  const { isDark } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    users = [],
    currentUser,
    currentUserId,
    setCurrentUser,
    addUser,
    updateUser,
    removeUser
  } = useAppData()

  const [editMode, setEditMode] = useState<boolean>(false)
  const [showNewUserForm, setShowNewUserForm] = useState<boolean>(
    Boolean(location.state?.focus === 'create')
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [form, setForm] = useState<UserPayload>(emptyUserPayload)
  const [newUserForm, setNewUserForm] = useState<UserPayload>({
    ...emptyUserPayload,
    permissions: 'Supervisor comercial'
  })

  useEffect(() => {
    if (location.state?.focus === 'create') {
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  useEffect(() => {
    if (!currentUser) {
      setForm(emptyUserPayload)
      return
    }
    setForm({
      fullName: currentUser.fullName || '',
      email: currentUser.email || '',
      role: currentUser.role || '',
      region: currentUser.region || '',
      permissions: currentUser.permissions || '',
      phone: currentUser.phone || ''
    })
  }, [currentUser])

  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const infoRows = useMemo(() => {
    if (!currentUser) return []
    return [
      {
        label: 'Nombre completo',
        value: currentUser.fullName || 'Sin registrar'
      },
      {
        label: 'Correo corporativo',
        value: currentUser.email || 'Sin registrar'
      },
      { label: 'Rol', value: currentUser.role || 'Sin rol asignado' },
      { label: 'Zona', value: currentUser.region || 'Sin zona asignada' }
    ]
  }, [currentUser])

  const activityLog = useMemo(
    (): Activity[] =>
      (currentUser?.activity ?? []).map((a) => ({ ...a, id: a.id || '' })),
    [currentUser]
  )

  const isDirty = useMemo(() => {
    if (!currentUser) return false
    return (
      ['fullName', 'email', 'role', 'region', 'permissions', 'phone'] as const
    ).some((field) => {
      const original = (currentUser[field] ?? '').trim()
      const updated = (form[field] ?? '').trim()
      return original !== updated
    })
  }, [form, currentUser])

  const canDeleteCurrent = (users || []).length > 1

  const handleInputChange = useCallback(
    (field: keyof UserPayload) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setForm((prev) => ({
          ...prev,
          [field]: value
        }))
      },
    []
  )

  const handleNewUserChange = useCallback(
    (field: keyof UserPayload) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setNewUserForm((prev) => ({
          ...prev,
          [field]: value
        }))
      },
    []
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (!currentUser || !isDirty) return

      updateUser(currentUser.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        region: form.region.trim(),
        permissions: form.permissions.trim(),
        phone: form.phone.trim(),
        avatarInitials: toInitials(form.fullName.trim() || form.email.trim())
      })

      setEditMode(false)
      setFeedback({
        type: 'success',
        message: 'Perfil actualizado correctamente.'
      })
    },
    [currentUser, form, isDirty, updateUser]
  )

  const handleReset = useCallback(() => {
    if (!currentUser) return
    setForm({
      fullName: currentUser.fullName || '',
      email: currentUser.email || '',
      role: currentUser.role || '',
      region: currentUser.region || '',
      permissions: currentUser.permissions || '',
      phone: currentUser.phone || ''
    })
    setEditMode(false)
  }, [currentUser])

  const handleDelete = useCallback(() => {
    if (!currentUser) return
    if (!canDeleteCurrent) {
      setFeedback({
        type: 'warning',
        message: 'Debe existir al menos un usuario administrador activo.'
      })
      return
    }
    const confirmation = window.confirm(
      `¿Seguro que quieres eliminar el perfil de "${currentUser.fullName || 'Usuario sin nombre'}"?`
    )
    if (!confirmation) return
    removeUser(currentUser.id)
    setFeedback({
      type: 'success',
      message: 'Perfil eliminado. Usuario activo actualizado.'
    })
    setEditMode(false)
  }, [currentUser, removeUser, canDeleteCurrent])

  const handleCreateUser = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      const name = newUserForm.fullName.trim()
      const email = newUserForm.email.trim()

      if (!name || !email) {
        setFeedback({
          type: 'warning',
          message:
            'Completa al menos nombre y correo para crear un nuevo perfil.'
        })
        return
      }

      // Crear nuevo usuario (no necesitamos el resultado)
      addUser({
        ...newUserForm,
        fullName: name,
        email,
        role: newUserForm.role.trim(),
        region: newUserForm.region.trim(),
        permissions: newUserForm.permissions.trim() || 'Supervisor comercial',
        phone: newUserForm.phone.trim(),
        activity: [
          {
            type: 'information',
            title: 'Perfil creado',
            description: 'Creación de perfil',
            detail: `Creado por ${currentUser?.fullName || 'Administración'}`,
            timestamp: new Date().toISOString()
          }
        ]
      })

      // setCurrentUser(created.id); // TODO: Implementar retorno del ID del usuario creado
      setNewUserForm({
        ...emptyUserPayload,
        permissions: 'Supervisor comercial'
      })
      setShowNewUserForm(false)
      setEditMode(true)
      setFeedback({
        type: 'success',
        message: 'Nuevo perfil creado. Puedes completar los datos ahora.'
      })
    },
    [addUser, newUserForm, currentUser]
  )

  const newUserReady = useMemo(() => {
    const name = newUserForm.fullName.trim()
    const email = newUserForm.email.trim()
    return Boolean(name.length >= 3 && /.+@.+/.test(email))
  }, [newUserForm])

  return (
    <div
      className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10'}`}
    >
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {feedback ? (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5" />
            )}
            <p>{feedback.message}</p>
          </div>
        ) : null}

        <header className="rounded-4xl border border-white/40 dark:border-gray-700/40 bg-gradient-to-r from-white/95 via-white/80 to-pastel-indigo/20 dark:from-gray-800/95 dark:via-gray-800/80 dark:to-pastel-indigo/10 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-indigo to-pastel-cyan text-white shadow-lg">
                <UserCircleIcon className="h-10 w-10" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
                  Ficha de usuario
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {currentUser?.fullName || 'Selecciona o crea un usuario'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentUser
                    ? `${currentUser.role || 'Rol no definido'} • ${currentUser.region || 'Zona no asignada'}`
                    : 'Gestión de perfiles administradores'}
                </p>
              </div>
            </div>
            {currentUser ? (
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2 rounded-2xl bg-white/70 dark:bg-gray-700/70 px-4 py-2 shadow-sm">
                  <EnvelopeIcon className="h-5 w-5 text-pastel-indigo" />
                  {currentUser.email || 'Sin correo'}
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/70 dark:bg-gray-700/70 px-4 py-2 shadow-sm">
                  <ShieldCheckIcon className="h-5 w-5 text-pastel-indigo" />
                  Permisos: {currentUser.permissions || 'Sin definir'}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <section className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/85 dark:bg-gray-800/85 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Datos personales
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Actualiza la información visible en reportes y módulos
                operativos.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditMode((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-pastel-indigo/40 px-4 py-2 text-sm font-semibold text-pastel-indigo transition hover:bg-pastel-indigo/10"
                disabled={!currentUser}
              >
                <PencilSquareIcon className="h-5 w-5" />
                {editMode ? 'Salir de edición' : 'Editar datos'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!currentUser || !canDeleteCurrent}
              >
                <TrashIcon className="h-5 w-5" />
                Eliminar perfil
              </button>
            </div>
          </div>

          {editMode && currentUser ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre completo"
                  value={form.fullName}
                  onChange={handleInputChange('fullName')}
                  placeholder="Ej. Laura González"
                />
                <Field
                  label="Correo corporativo"
                  value={form.email}
                  onChange={handleInputChange('email')}
                  type="email"
                  placeholder="nombre@gpvcanarias.com"
                />
                <Field
                  label="Rol"
                  value={form.role}
                  onChange={handleInputChange('role')}
                  placeholder="Supervisor comercial"
                />
                <Field
                  label="Zona"
                  value={form.region}
                  onChange={handleInputChange('region')}
                  placeholder="Islas Canarias"
                />
                <Field
                  label="Permisos"
                  value={form.permissions}
                  onChange={handleInputChange('permissions')}
                  placeholder="Supervisor"
                />
                <Field
                  label="Teléfono de contacto"
                  value={form.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-pastel-indigo px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:bg-pastel-indigo-dark disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isDirty}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 transition hover:bg-gray-100 dark:bg-gray-700"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 px-4 py-3 text-sm text-gray-600 dark:text-gray-400"
                >
                  <dt className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-gray-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {currentUser ? (
            <p className="mt-6 text-xs text-gray-400">
              Última actualización del perfil:{' '}
              {formatDateTime(currentUser.lastLogin)}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/90 dark:bg-gray-800/90 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Gestión de perfiles
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crea nuevos accesos administrativos o alterna entre usuarios
                existentes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewUserForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-pastel-indigo/60 px-4 py-2 text-sm font-semibold text-pastel-indigo transition hover:bg-pastel-indigo/10"
            >
              <UserPlusIcon className="h-5 w-5" />
              {showNewUserForm ? 'Ocultar alta' : 'Nuevo perfil'}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Perfil activo
                </label>
                <select
                  value={currentUserId ?? ''}
                  onChange={(event) => setCurrentUser(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/70 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-pastel-indigo focus:outline-none"
                  aria-label="Seleccionar perfil activo"
                  title="Perfil activo"
                >
                  {(users || []).map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName || 'Usuario sin nombre'} —{' '}
                      {user.permissions || 'Sin rol'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Accesos registrados
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {(users || []).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mantén al menos un perfil con permisos de supervisor.
                </p>
              </div>
            </div>

            {showNewUserForm ? (
              <form
                onSubmit={handleCreateUser}
                className="space-y-4 rounded-2xl border border-pastel-indigo/30 bg-pastel-indigo/5 p-4"
              >
                <p className="text-sm font-semibold text-pastel-indigo">
                  Alta rápida de nuevo perfil
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Nombre completo"
                    value={newUserForm.fullName}
                    onChange={handleNewUserChange('fullName')}
                    placeholder="Ej. Marta Pérez"
                    required
                  />
                  <Field
                    label="Correo corporativo"
                    value={newUserForm.email}
                    onChange={handleNewUserChange('email')}
                    type="email"
                    placeholder="nombre@gpvcanarias.com"
                    required
                  />
                  <Field
                    label="Rol"
                    value={newUserForm.role}
                    onChange={handleNewUserChange('role')}
                    placeholder="Gestor comercial"
                  />
                  <Field
                    label="Zona"
                    value={newUserForm.region}
                    onChange={handleNewUserChange('region')}
                    placeholder="Provincia / Región"
                  />
                  <Field
                    label="Permisos"
                    value={newUserForm.permissions}
                    onChange={handleNewUserChange('permissions')}
                    placeholder="Supervisor"
                  />
                  <Field
                    label="Teléfono"
                    value={newUserForm.phone}
                    onChange={handleNewUserChange('phone')}
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-pastel-indigo px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/40 transition hover:bg-pastel-indigo-dark disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!newUserReady}
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Crear y continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewUserForm(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 transition hover:bg-gray-100 dark:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/85 dark:bg-gray-800/85 p-6 shadow-xl backdrop-blur">
          <h2 className="text-lg font-semibold text-gray-900">
            Actividad reciente
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Últimos accesos y acciones importantes registradas en la plataforma.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
            {activityLog.length ? (
              activityLog.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 px-4 py-3"
                >
                  <ClockIcon className="h-5 w-5 text-pastel-indigo" />
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.detail || 'Sin detalle registrado'}
                      {item.detail ? item.detail : 'Sin detalle registrado'}
                    </p>
                    {item.timestamp ? (
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDateTime(item.timestamp)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay registros de actividad por el momento.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false
}) => {
  return (
    <label className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <input
        className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm focus:border-pastel-indigo focus:outline-none focus:ring-2 focus:ring-pastel-indigo/30"
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  )
}

export default Profile
