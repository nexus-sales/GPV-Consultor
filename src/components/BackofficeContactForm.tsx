import React, { useMemo, useState } from 'react'
import {
  XMarkIcon as XCircleIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CheckBadgeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  BuildingStorefrontIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useDuplicateCheck, BANNED_NAMES } from '../lib/hooks/useDuplicateCheck'
import {
  BackofficeContact,
  BackofficeCommentEntry,
  BackofficeContactEstado,
  BackofficeContactEstadoGestion
} from '../lib/types'

interface BackofficeContactFormProps {
  initial?: Partial<BackofficeContact>
  onSubmit: (data: Partial<BackofficeContact>) => void
  onCancel: () => void
  operators: string[]
  estados: string[]
  estadosGestion: string[]
}

type BackofficeTab = 'datos' | 'gestion' | 'seguimiento'

const ACTIVITY_ROLES = [
  'Backoffice',
  'GPV',
  'Observacion',
  'Seguimiento',
  'Incidencia'
] as const

const ACTIVITY_TYPES = [
  'Nota',
  'Llamada',
  'Email',
  'WhatsApp',
  'Seguimiento',
  'Estado',
  'Visita',
  'Incidencia',
  'Conversion'
] as const

const VISIBILITY_OPTIONS = ['Interna', 'Compartida GPV', 'Admin'] as const

const QUICK_ACTIONS = [
  { label: 'No contesta', type: 'Llamada', text: 'Llamada realizada. No contesta.' },
  { label: 'Enviar correo', type: 'Email', text: 'Pendiente enviar correo de seguimiento.' },
  { label: 'Interesado', type: 'Seguimiento', text: 'Contacto interesado. Requiere seguimiento.' },
  { label: 'Revisar manana', type: 'Seguimiento', text: 'Revisar de nuevo manana.' },
  { label: 'Incidencia', type: 'Incidencia', text: 'Incidencia registrada para revision.' }
] as const

const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string; card: string }
> = {
  Backoffice: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    card: 'bg-blue-50/30'
  },
  GPV: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    card: 'bg-emerald-50/30'
  },
  Observacion: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    card: 'bg-amber-50/30'
  },
  Seguimiento: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
    card: 'bg-teal-50/30'
  },
  Incidencia: {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    card: 'bg-rose-50/30'
  },
  Sistema: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    card: 'bg-slate-50/30'
  }
}

const normalizeActivityRole = (role: string) =>
  role.startsWith('Observ') ? 'Observacion' : role

const formatActivityDate = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const BackofficeContactForm: React.FC<BackofficeContactFormProps> = ({
  initial,
  onSubmit,
  onCancel,
  operators,
  estados,
  estadosGestion
}) => {
  const [form, setForm] = useState<Partial<BackofficeContact>>(() => ({
    operador: operators[0],
    estado: 'PENDIENTE DE RESPUESTA' as BackofficeContactEstado,
    estadoGestion: 'Pendiente' as BackofficeContactEstadoGestion,
    prioridadBackoffice: 'Media',
    visibility: 'backoffice',
    handoffStatus: 'sin_derivar',
    sharedWithGpv: false,
    historialComentarios: [],
    ...initial
  }))

  const {
    duplicateWarning,
    duplicateConfirmed,
    checkDuplicate,
    confirmDuplicate,
    resetOnEdit,
  } = useDuplicateCheck('backoffice')

  const [errors, setErrors] = useState<{ nombreColaborador?: string }>({})
  const [activeTab, setActiveTab] = useState<BackofficeTab>('datos')
  const [newComment, setNewComment] = useState('')
  const [newCommentRol, setNewCommentRol] = useState<string>('Backoffice')
  const [newCommentType, setNewCommentType] = useState<string>('Nota')
  const [newVisibility, setNewVisibility] = useState<string>('Interna')
  const [newNextAction, setNewNextAction] = useState('')
  const [activityFilter, setActivityFilter] = useState('Todos')

  const updateField = <K extends keyof BackofficeContact>(
    field: K,
    value: BackofficeContact[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addActivity = (
    entry: Omit<BackofficeCommentEntry, 'id' | 'timestamp' | 'autor'>
  ) => {
    const fullEntry: BackofficeCommentEntry = {
      id: `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      autor: 'Usuario',
      ...entry
    }
    setForm((prev) => ({
      ...prev,
      historialComentarios: [fullEntry, ...(prev.historialComentarios ?? [])]
    }))
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    addActivity({
      rol: newCommentRol as BackofficeCommentEntry['rol'],
      tipo: newCommentType as BackofficeCommentEntry['tipo'],
      visibilidad: newVisibility as BackofficeCommentEntry['visibilidad'],
      proximaAccion: newNextAction || undefined,
      contenido: newComment.trim()
    })
    if (newNextAction) updateField('proximoContacto', newNextAction)
    setNewComment('')
    setNewNextAction('')
  }

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    setNewCommentType(action.type)
    setNewComment(action.text)
    if (action.type === 'Incidencia') setNewCommentRol('Incidencia')
    if (action.type === 'Seguimiento') setNewCommentRol('Seguimiento')
  }

  const handleGestionChange = (estadoGestion: string) => {
    if (form.estadoGestion === estadoGestion) return
    setForm((prev) => ({
      ...prev,
      estadoGestion: estadoGestion as BackofficeContactEstadoGestion,
      historialComentarios: [
        {
          id: `sys-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          autor: 'Sistema',
          rol: 'Sistema',
          tipo: 'Estado',
          visibilidad: 'Interna',
          contenido: `Cambio de estado GPV: ${prev.estadoGestion ?? 'Sin estado'} -> ${estadoGestion}`
        },
        ...(prev.historialComentarios ?? [])
      ]
    }))
  }

  const handleSharedWithGpv = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      sharedWithGpv: checked,
      visibility: checked ? 'gpv' : 'backoffice',
      historialComentarios: [
        {
          id: `sys-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          autor: 'Sistema',
          rol: 'Sistema',
          tipo: 'Estado',
          visibilidad: 'Interna',
          contenido: checked
            ? 'Expediente marcado para compartir con GPV.'
            : 'Expediente retirado de la vista compartida GPV.'
        },
        ...(prev.historialComentarios ?? [])
      ]
    }))
  }

  const removeActivity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      historialComentarios: (prev.historialComentarios ?? []).filter(
        (entry) => entry.id !== id
      )
    }))
  }

  const validate = (): boolean => {
    const n = (form.nombreColaborador ?? '').trim()
    if (!n || n.length < 3 || BANNED_NAMES.includes(n.toLowerCase())) {
      setErrors({ nombreColaborador: 'El nombre es obligatorio (empresa o contacto).' })
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (duplicateWarning && !duplicateConfirmed) return
    onSubmit(form)
  }

  const tabBtn = (id: BackofficeTab, label: string) => {
    const activeClass = {
      datos: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
      gestion: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
      seguimiento: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
    }[id]
    const barClass = {
      datos: 'bg-indigo-500',
      gestion: 'bg-amber-500',
      seguimiento: 'bg-teal-500'
    }[id]

    return (
      <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={`relative rounded-t-lg px-4 py-2 text-sm font-semibold transition-all ${
          activeTab === id
            ? activeClass
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-300'
        }`}
      >
        {label}
        {activeTab === id && (
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-full rounded-full ${barClass}`}
          />
        )}
      </button>
    )
  }

  const sortedComments = useMemo(() => {
    return [...(form.historialComentarios ?? [])].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [form.historialComentarios])

  const filteredComments = useMemo(() => {
    if (activityFilter === 'Todos') return sortedComments
    return sortedComments.filter((entry) => {
      const role = normalizeActivityRole(entry.rol)
      return role === activityFilter || entry.tipo === activityFilter
    })
  }, [activityFilter, sortedComments])

  const inputClass = 'premium-input'
  const compactInputClass = 'premium-input h-10 text-sm'

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <header className="mb-4 flex flex-col gap-4 border-b border-indigo-100 pb-2 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                Backoffice operativo
              </p>
            </div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {initial?.id ? 'Editar contacto' : 'Nuevo contacto'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar formulario"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="-mb-2 flex gap-1">
          {tabBtn('datos', 'Ficha')}
          {tabBtn('gestion', 'Gestion')}
          {tabBtn('seguimiento', 'Seguimiento')}
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.9fr)]">
        <div className="custom-scrollbar min-h-0 overflow-y-auto pr-2">
          {activeTab === 'datos' && (
            <div className="space-y-4">
              <section className="premium-card space-y-4 border-indigo-100 bg-indigo-50/45 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/30">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                    Identificacion
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="premium-label">Operador asignado *</label>
                    <select
                      value={form.operador ?? ''}
                      onChange={(e) => updateField('operador', e.target.value)}
                      className={compactInputClass}
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="premium-label">Gestor proponente</label>
                    <input
                      value={form.gestorProponente ?? ''}
                      onChange={(e) =>
                        updateField('gestorProponente', e.target.value)
                      }
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Origen</label>
                    <select
                      value={form.origenContacto ?? ''}
                      onChange={(e) =>
                        updateField('origenContacto', e.target.value)
                      }
                      className={compactInputClass}
                    >
                      <option value="">Sin definir</option>
                      <option value="Gestor">Gestor</option>
                      <option value="Importacion">Importacion</option>
                      <option value="Google Maps">Google Maps</option>
                      <option value="Llamada">Llamada</option>
                      <option value="Referido">Referido</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">
                      Nombre comercial / colaborador *
                    </label>
                    <input
                      value={form.nombreColaborador ?? ''}
                      onChange={(e) => {
                        updateField('nombreColaborador', e.target.value)
                        resetOnEdit()
                      }}
                      onBlur={(e) => {
                        if (!initial?.id && e.target.value.trim().length >= 3)
                          void checkDuplicate(form.cifNif ?? '', e.target.value)
                      }}
                      className={inputClass}
                      placeholder="Nombre del negocio"
                    />
                    {errors.nombreColaborador && (
                      <span className="mt-1 block text-[10px] font-bold uppercase text-red-500">
                        {errors.nombreColaborador}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="premium-label">Razon social</label>
                    <input
                      value={form.razonSocial ?? ''}
                      onChange={(e) => updateField('razonSocial', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">CIF / NIF</label>
                    <input
                      value={form.cifNif ?? ''}
                      onChange={(e) => {
                        updateField('cifNif', e.target.value)
                        resetOnEdit()
                      }}
                      onBlur={(e) => {
                        if (!initial?.id && e.target.value.trim().length >= 7)
                          void checkDuplicate(e.target.value, form.nombreColaborador ?? '')
                      }}
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Persona de contacto</label>
                    <input
                      value={form.personaContacto ?? ''}
                      onChange={(e) =>
                        updateField('personaContacto', e.target.value)
                      }
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Cargo</label>
                    <input
                      value={form.cargoContacto ?? ''}
                      onChange={(e) =>
                        updateField('cargoContacto', e.target.value)
                      }
                      className={compactInputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="premium-card space-y-4 border-teal-100 bg-teal-50/45 p-5 dark:border-teal-900/40 dark:bg-teal-950/20">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-teal-100/70 p-2 dark:bg-teal-900/30">
                    <MapPinIcon className="h-4 w-4 text-teal-600" />
                  </div>
                  <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100">
                    Ubicacion y contacto
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-4">
                    <label className="premium-label">Direccion</label>
                    <input
                      value={form.direccion ?? ''}
                      onChange={(e) => updateField('direccion', e.target.value)}
                      className={inputClass}
                      placeholder="Calle, numero, local..."
                    />
                  </div>

                  <div>
                    <label className="premium-label">Poblacion</label>
                    <input
                      value={form.poblacion ?? ''}
                      onChange={(e) => updateField('poblacion', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Codigo postal</label>
                    <input
                      value={form.codigoPostal ?? ''}
                      onChange={(e) =>
                        updateField('codigoPostal', e.target.value)
                      }
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Provincia</label>
                    <input
                      value={form.provincia ?? ''}
                      onChange={(e) => updateField('provincia', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Isla / zona</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={form.isla ?? ''}
                        onChange={(e) => updateField('isla', e.target.value)}
                        className={compactInputClass}
                        placeholder="Isla"
                      />
                      <input
                        value={form.zona ?? ''}
                        onChange={(e) => updateField('zona', e.target.value)}
                        className={compactInputClass}
                        placeholder="Zona"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Telefono principal</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={form.telefonoContacto ?? ''}
                        onChange={(e) =>
                          updateField('telefonoContacto', e.target.value)
                        }
                        className={`${compactInputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Telefono alternativo</label>
                    <input
                      type="tel"
                      value={form.telefonoAlternativo ?? ''}
                      onChange={(e) =>
                        updateField('telefonoAlternativo', e.target.value)
                      }
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Email</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={form.emailContacto ?? ''}
                        onChange={(e) =>
                          updateField('emailContacto', e.target.value)
                        }
                        className={`${compactInputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Web</label>
                    <div className="relative">
                      <GlobeAltIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        value={form.web ?? ''}
                        onChange={(e) => updateField('web', e.target.value)}
                        className={`${compactInputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'gestion' && (
            <div className="space-y-4">
              <section className="premium-card space-y-4 border-amber-100 bg-amber-50/45 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-900/30">
                    <CheckBadgeIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    Gestion y derivacion
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="premium-label">Estado administrativo</label>
                    <select
                      value={form.estado ?? 'PENDIENTE DE RESPUESTA'}
                      onChange={(e) =>
                        updateField(
                          'estado',
                          e.target.value as BackofficeContactEstado
                        )
                      }
                      className={compactInputClass}
                    >
                      {estados.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="premium-label">Prioridad</label>
                    <select
                      value={form.prioridadBackoffice ?? 'Media'}
                      onChange={(e) =>
                        updateField('prioridadBackoffice', e.target.value)
                      }
                      className={compactInputClass}
                    >
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="premium-label">Resultado ultimo contacto</label>
                    <select
                      value={form.resultadoUltimoContacto ?? ''}
                      onChange={(e) =>
                        updateField('resultadoUltimoContacto', e.target.value)
                      }
                      className={compactInputClass}
                    >
                      <option value="">Sin registrar</option>
                      <option value="No contesta">No contesta</option>
                      <option value="Interesado">Interesado</option>
                      <option value="No interesado">No interesado</option>
                      <option value="Pendiente documentacion">
                        Pendiente documentacion
                      </option>
                      <option value="Requiere visita">Requiere visita</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="premium-label">Estado GPV</label>
                    <div className="flex flex-wrap gap-2">
                      {estadosGestion.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleGestionChange(s)}
                          className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase transition-all ${
                            form.estadoGestion === s
                              ? 'border-transparent bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                              : 'border-amber-200 bg-white/70 text-amber-700 hover:bg-amber-100/70 dark:border-amber-900/40 dark:bg-slate-950/60 dark:text-amber-300 dark:hover:bg-amber-950/30'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Derivacion</label>
                    <select
                      value={form.handoffStatus ?? 'sin_derivar'}
                      onChange={(e) => {
                        updateField('handoffStatus', e.target.value)
                        addActivity({
                          rol: 'Sistema',
                          tipo: 'Estado',
                          visibilidad: 'Interna',
                          contenido: `Cambio de derivacion: ${e.target.value}`
                        })
                      }}
                      className={compactInputClass}
                    >
                      <option value="sin_derivar">Sin derivar</option>
                      <option value="propuesto_gpv">Propuesto GPV</option>
                      <option value="aceptado_gpv">Aceptado GPV</option>
                      <option value="convertido_candidato">
                        Convertido candidato
                      </option>
                      <option value="convertido_distribuidor">
                        Convertido distribuidor
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="premium-label">Visibilidad</label>
                    <select
                      value={form.visibility ?? 'backoffice'}
                      onChange={(e) => updateField('visibility', e.target.value)}
                      className={compactInputClass}
                    >
                      <option value="backoffice">Solo Backoffice</option>
                      <option value="gpv">Compartido GPV</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex h-10 cursor-pointer items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 text-sm font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                      <input
                        type="checkbox"
                        checked={Boolean(form.sharedWithGpv)}
                        onChange={(e) => handleSharedWithGpv(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Compartir con GPV
                    </label>
                  </div>

                  <div>
                    <label className="premium-label">Sector</label>
                    <input
                      value={form.sector ?? ''}
                      onChange={(e) => updateField('sector', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Tipo de negocio</label>
                    <input
                      value={form.tipoNegocio ?? ''}
                      onChange={(e) => updateField('tipoNegocio', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Canal preferente</label>
                    <select
                      value={form.canalPreferente ?? ''}
                      onChange={(e) =>
                        updateField('canalPreferente', e.target.value)
                      }
                      className={compactInputClass}
                    >
                      <option value="">Sin definir</option>
                      <option value="Telefono">Telefono</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Visita">Visita</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="premium-label">Motivo rechazo / bloqueo</label>
                    <textarea
                      value={form.motivoRechazo ?? form.lockedReason ?? ''}
                      onChange={(e) => {
                        updateField('motivoRechazo', e.target.value)
                        updateField('lockedReason', e.target.value)
                      }}
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="premium-card space-y-4 border-violet-100 bg-violet-50/45 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-violet-100/70 p-2 dark:bg-violet-900/30">
                    <BuildingStorefrontIcon className="h-4 w-4 text-violet-600" />
                  </div>
                  <h4 className="text-sm font-bold text-violet-900 dark:text-violet-100">
                    Perfil comercial
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="premium-label">Potencial comercial</label>
                    <select
                      value={form.potencialComercial ?? ''}
                      onChange={(e) =>
                        updateField('potencialComercial', e.target.value)
                      }
                      className={compactInputClass}
                    >
                      <option value="">Sin valorar</option>
                      <option value="Alto">Alto</option>
                      <option value="Medio">Medio</option>
                      <option value="Bajo">Bajo</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Competencia actual</label>
                    <input
                      value={form.competenciaActual ?? ''}
                      onChange={(e) =>
                        updateField('competenciaActual', e.target.value)
                      }
                      className={compactInputClass}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'seguimiento' && (
            <div className="space-y-4">
              <section className="premium-card space-y-4 border-teal-100 bg-teal-50/45 p-5 dark:border-teal-900/40 dark:bg-teal-950/20">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-teal-50 p-2 dark:bg-teal-900/30">
                    <CalendarDaysIcon className="h-4 w-4 text-teal-600" />
                  </div>
                  <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100">
                    Agenda y visitas
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="premium-label text-teal-600">
                      Proximo contacto
                    </label>
                    <input
                      type="date"
                      value={form.proximoContacto ?? ''}
                      onChange={(e) =>
                        updateField('proximoContacto', e.target.value)
                      }
                      className={`${compactInputClass} border-teal-200 bg-teal-50/30 dark:border-teal-900/30`}
                    />
                  </div>

                  <div>
                    <label className="premium-label">Fecha visita</label>
                    <input
                      type="date"
                      value={form.fechaVisita ?? ''}
                      onChange={(e) => updateField('fechaVisita', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Resumen de visitas</label>
                    <input
                      value={form.visitas ?? ''}
                      onChange={(e) => updateField('visitas', e.target.value)}
                      className={inputClass}
                      placeholder="Ej: visita propuesta, pendiente confirmacion..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Seguimiento operativo</label>
                    <textarea
                      value={form.seguimiento ?? ''}
                      onChange={(e) => updateField('seguimiento', e.target.value)}
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Observaciones generales</label>
                    <textarea
                      value={form.observaciones ?? ''}
                      onChange={(e) =>
                        updateField('observaciones', e.target.value)
                      }
                      rows={4}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-500" />
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-100">
                  Actividad
                </h4>
                <p className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-300">
                  Expediente del contacto
                </p>
              </div>
            </div>
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              {sortedComments.length} eventos
            </span>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-slate-400" />
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-indigo-100 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-indigo-900/40 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="Todos">Todos</option>
              {ACTIVITY_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="custom-scrollbar mb-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredComments.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-white/50 text-indigo-300 dark:border-indigo-900/40 dark:bg-slate-950/40">
                <InformationCircleIcon className="mb-2 h-8 w-8" />
                <p className="text-xs font-black uppercase tracking-widest">
                  Sin actividad
                </p>
              </div>
            ) : (
              filteredComments.map((entry) => {
                const normalizedRole = normalizeActivityRole(entry.rol)
                const c = ROLE_COLORS[normalizedRole] ?? ROLE_COLORS.Sistema
                return (
                  <div key={entry.id} className="relative pl-5">
                    <div
                      className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ${c.dot}`}
                    />
                    <div className="absolute bottom-0 left-[4px] top-5 w-px bg-slate-200 dark:bg-slate-800" />
                    <div
                      className={`rounded-xl border bg-white p-3 shadow-sm dark:bg-slate-950 ${c.border}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${c.bg} ${c.text}`}
                          >
                            {normalizedRole}
                          </span>
                          {entry.tipo && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 dark:bg-slate-800">
                              {entry.tipo}
                            </span>
                          )}
                          {entry.visibilidad && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase text-slate-400 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                              {entry.visibilidad}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeActivity(entry.id)}
                          className="rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Eliminar actividad"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mb-2 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                        {entry.contenido}
                      </p>
                      {entry.proximaAccion && (
                        <p className="mb-2 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                          Proxima accion: {entry.proximaAccion}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-slate-400">
                        {formatActivityDate(entry.timestamp)} - {entry.autor}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-auto space-y-3 border-t border-indigo-100 bg-white/35 pt-3 dark:border-indigo-900/40 dark:bg-slate-950/20">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  className="whitespace-nowrap rounded-lg border border-indigo-100 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-indigo-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900/40 dark:bg-slate-950 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                value={newCommentRol}
                onChange={(e) => setNewCommentRol(e.target.value)}
                className="h-9 rounded-lg border border-indigo-100 bg-white px-2 text-xs font-semibold text-slate-600 dark:border-indigo-900/40 dark:bg-slate-950 dark:text-slate-300"
              >
                {ACTIVITY_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <select
                value={newCommentType}
                onChange={(e) => setNewCommentType(e.target.value)}
                className="h-9 rounded-lg border border-teal-100 bg-white px-2 text-xs font-semibold text-slate-600 dark:border-teal-900/40 dark:bg-slate-950 dark:text-slate-300"
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={newVisibility}
                onChange={(e) => setNewVisibility(e.target.value)}
                className="h-9 rounded-lg border border-violet-100 bg-white px-2 text-xs font-semibold text-slate-600 dark:border-violet-900/40 dark:bg-slate-950 dark:text-slate-300"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="date"
              value={newNextAction}
              onChange={(e) => setNewNextAction(e.target.value)}
              className="h-9 w-full rounded-lg border border-teal-100 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-teal-900/40 dark:bg-slate-950 dark:text-slate-300"
            />

            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="premium-input h-20 resize-none border-indigo-100 bg-white pr-10 text-xs dark:border-indigo-900/40"
                placeholder="Registrar actividad..."
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="absolute bottom-2 right-2 rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                aria-label="Agregar actividad"
              >
                <SparklesIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Duplicate warning banner */}
      {duplicateWarning && !duplicateConfirmed && (
        <div className="mb-4 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {duplicateWarning.ownership === 'other'
                  ? 'Este registro ya está asignado a otro miembro del equipo. Contacta con tu responsable.'
                  : duplicateWarning.matchType === 'tax_id'
                    ? `Ya existe un registro con este CIF: ${duplicateWarning.entityName}${duplicateWarning.entityCity ? ` (${duplicateWarning.entityCity})` : ''}. ¿Crear de todos modos?`
                    : `Ya existe un registro con nombre similar: ${duplicateWarning.entityName}${duplicateWarning.entityCity ? ` (${duplicateWarning.entityCity})` : ''}. ¿Crear de todos modos?`
                }
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={confirmDuplicate}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                >
                  Crear de todos modos
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          Descartar
        </button>
        <button
          type="submit"
          className="premium-gradient rounded-xl px-10 py-3 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {initial?.id ? 'GUARDAR CAMBIOS' : 'CREAR CONTACTO'}
        </button>
      </footer>
    </form>
  )
}

export default BackofficeContactForm
