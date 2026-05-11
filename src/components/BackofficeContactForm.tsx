import React, { useState, useMemo } from 'react'
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
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { BackofficeContact, BackofficeCommentEntry, BackofficeContactEstado, BackofficeContactEstadoGestion } from '../lib/types'

interface BackofficeContactFormProps {
  initial?: Partial<BackofficeContact>
  onSubmit: (data: Partial<BackofficeContact>) => void
  onCancel: () => void
  operators: string[]
  estados: string[]
  estadosGestion: string[]
  estadoGestionStyles: Record<string, string>
}

const BackofficeContactForm: React.FC<BackofficeContactFormProps> = ({
  initial,
  onSubmit,
  onCancel,
  operators,
  estados,
  estadosGestion,
  estadoGestionStyles
}) => {
  const [form, setForm] = useState<Partial<BackofficeContact>>(() => ({
    operador: operators[0],
    estado: 'PENDIENTE DE RESPUESTA' as BackofficeContactEstado,
    estadoGestion: 'Pendiente' as BackofficeContactEstadoGestion,
    historialComentarios: [],
    ...initial
  }))

  const [activeTab, setActiveTab] = useState<'datos' | 'gestion' | 'seguimiento'>('datos')
  const [newComment, setNewComment] = useState('')
  const [newCommentRol, setNewCommentRol] = useState<string>('Backoffice')

  const updateField = (field: keyof BackofficeContact, value: any) => {
    setForm((prev: Partial<BackofficeContact>) => ({ ...prev, [field]: value }))
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const entry: BackofficeCommentEntry = {
      id: `bc-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      autor: 'Usuario',
      rol: newCommentRol as any,
      contenido: newComment.trim()
    }
    setForm((prev: Partial<BackofficeContact>) => ({
      ...prev,
      historialComentarios: [entry, ...(prev.historialComentarios ?? [])]
    }))
    setNewComment('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`relative px-4 py-2 text-sm font-semibold transition-all ${
        activeTab === id
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {label}
      {activeTab === id && (
        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-500 rounded-full animate-fade-in" />
      )}
    </button>
  )

  const sortedComments = useMemo(() => {
    return [...(form.historialComentarios ?? [])].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [form.historialComentarios])

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="premium-gradient h-2 w-2 rounded-full animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                Backoffice Operativo
              </p>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {initial?.id ? 'Editar Contacto' : 'Nuevo Contacto'}
            </h3>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex gap-1 -mb-2">
          {tabBtn('datos', 'Ficha Colaborador')}
          {tabBtn('gestion', 'Gestión & Estado')}
          {tabBtn('seguimiento', 'Seguimiento')}
        </nav>
      </header>

      {/* Main Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 overflow-hidden">
        
        {/* Left: Form Tabs */}
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
          
          {activeTab === 'datos' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Identificación</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <div className="md:col-span-1">
                    <label className="premium-label">Operador Asignado *</label>
                    <select 
                      value={form.operador} 
                      onChange={(e) => updateField('operador', e.target.value)}
                      className="premium-input"
                    >
                      {operators.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="premium-label">Nombre Colaborador *</label>
                    <input 
                      type="text" 
                      value={form.nombreColaborador || ''} 
                      onChange={(e) => updateField('nombreColaborador', e.target.value)}
                      className="premium-input"
                      placeholder="Nombre del negocio o contacto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Dirección</label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={form.direccion || ''} 
                        onChange={(e) => updateField('direccion', e.target.value)}
                        className="premium-input pl-10"
                        placeholder="Calle, número, oficina..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="premium-label">Población</label>
                    <input 
                      type="text" 
                      value={form.poblacion || ''} 
                      onChange={(e) => updateField('poblacion', e.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div>
                    <label className="premium-label">Código Postal</label>
                    <input 
                      type="text" 
                      value={form.codigoPostal || ''} 
                      onChange={(e) => updateField('codigoPostal', e.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Teléfono de Contacto</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={form.telefonoContacto || ''} 
                        onChange={(e) => updateField('telefonoContacto', e.target.value)}
                        className="premium-input pl-10"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'gestion' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                    <CheckBadgeIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Estado de la Gestión</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="premium-label">Estado Administrativo</label>
                    <select 
                      value={form.estado} 
                      onChange={(e) => updateField('estado', e.target.value)}
                      className="premium-input"
                    >
                      {estados.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="premium-label">Estado de Gestión GPV</label>
                    <div className="flex flex-wrap gap-2">
                      {estadosGestion.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const entry: BackofficeCommentEntry = {
                              id: `sys-${Date.now()}`,
                              timestamp: new Date().toISOString(),
                              autor: 'Sistema',
                              rol: 'Sistema',
                              contenido: `Cambio de estado → ${s}`
                            }
                            setForm((f: Partial<BackofficeContact>) => ({
                              ...f,
                              estadoGestion: s as BackofficeContactEstadoGestion,
                              historialComentarios: [entry, ...(f.historialComentarios ?? [])]
                            }))
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                            form.estadoGestion === s
                              ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={form.proponeVisitaGPV}
                          onChange={(e) => updateField('proponeVisitaGPV', e.target.checked)}
                          className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Propone Visita GPV</span>
                    </label>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'seguimiento' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/30">
                    <CalendarDaysIcon className="h-4 w-4 text-teal-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Agenda y Visitas</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="premium-label text-teal-600">Próximo Contacto</label>
                    <input 
                      type="date" 
                      value={form.proximoContacto || ''} 
                      onChange={(e) => updateField('proximoContacto', e.target.value)}
                      className="premium-input border-teal-200 dark:border-teal-900/30 bg-teal-50/30"
                    />
                  </div>

                  <div>
                    <label className="premium-label">Fecha Visita</label>
                    <input 
                      type="date" 
                      value={form.fechaVisita || ''} 
                      onChange={(e) => updateField('fechaVisita', e.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Resumen de Visitas</label>
                    <input 
                      type="text" 
                      value={form.visitas || ''} 
                      onChange={(e) => updateField('visitas', e.target.value)}
                      className="premium-input"
                      placeholder="Ej: 3 visitas realizadas, pendiente firma..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="premium-label">Observaciones Generales</label>
                    <textarea 
                      value={form.observaciones || ''} 
                      onChange={(e) => updateField('observaciones', e.target.value)}
                      rows={4}
                      className="premium-input"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Right: Activity Stream */}
        <div className="flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Actividad</h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
              {sortedComments.length} EVENTOS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 mb-4">
             {sortedComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-40">
                  <InformationCircleIcon className="h-10 w-10 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin actividad</p>
                </div>
              ) : (
                sortedComments.map(entry => (
                  <div key={entry.id} className="relative pl-6 pb-2 group">
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors z-10" />
                    <div className="absolute left-[3px] top-4 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 group-last:bg-transparent" />
                    
                    <div className="premium-card p-3 group-hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          entry.rol === 'Sistema' ? 'bg-slate-100 text-slate-500' :
                          entry.rol === 'GPV' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          {entry.rol}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold">
                          {new Date(entry.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{entry.contenido}</p>
                    </div>
                  </div>
                ))
              )}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
             <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {['Backoffice', 'GPV', 'Observación', 'Seguimiento'].map(rol => (
                  <button
                    key={rol}
                    type="button"
                    onClick={() => setNewCommentRol(rol)}
                    className={`whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      newCommentRol === rol ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {rol}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea 
                  value={newComment} 
                  onChange={(e) => setNewComment(e.target.value)}
                  className="premium-input pr-10 h-20 text-xs resize-none" 
                  placeholder="Escribe un comentario..." 
                />
                <button 
                  type="button" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <SparklesIcon className="h-4 w-4" />
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          Descartar
        </button>
        <button
          onClick={handleSubmit}
          className="premium-gradient px-10 py-3 rounded-2xl text-sm font-black text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {initial?.id ? 'GUARDAR CAMBIOS' : 'CREAR CONTACTO'}
        </button>
      </footer>
    </div>
  )
}

export default BackofficeContactForm
