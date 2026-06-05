import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  UserGroupIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  Squares2X2Icon,
  QueueListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import BackofficeContactForm from '../components/BackofficeContactForm'
import { useAppData } from '../lib/useAppData'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CellHookData } from 'jspdf-autotable'
import { toast } from 'sonner'
import {
  addJsonSheet,
  createWorkbook,
  readFirstSheetRows,
  writeWorkbook
} from '../lib/utils/excelWorkbook'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter
} from 'date-fns'
import { es } from 'date-fns/locale'
import type {
  BackofficeContact,
  BackofficeCommentEntry,
  NewBackofficeContact,
  BackofficeContactEstado,
  BackofficeContactEstadoGestion,
  BackofficeContactUpdates,
  ChannelType,
  VisitType
} from '../lib/types'

interface OperatorColor {
  tab: string
  tabInactive: string
  badge: string
  dot: string
  ring: string
  row: string
  card: string
  avatar: string
  text: string
}

type AutoTableJsPDF = jsPDF & {
  lastAutoTable?: {
    finalY?: number
  }
  internal: jsPDF['internal'] & {
    getNumberOfPages: () => number
  }
}

const OPERATOR_PALETTE: OperatorColor[] = [
  {
    tab: 'bg-rose-500 text-white shadow-rose-200 shadow-sm',
    tabInactive: 'hover:text-rose-600 dark:hover:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    dot: 'bg-rose-500',
    ring: 'ring-rose-400',
    row: 'bg-rose-50/30 dark:bg-rose-900/5',
    card: 'border-rose-400',
    avatar: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-700 dark:text-rose-300'
  },
  {
    tab: 'bg-violet-500 text-white shadow-violet-200 shadow-sm',
    tabInactive: 'hover:text-violet-600 dark:hover:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    dot: 'bg-violet-500',
    ring: 'ring-violet-400',
    row: 'bg-violet-50/30 dark:bg-violet-900/5',
    card: 'border-violet-400',
    avatar: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-700 dark:text-violet-300'
  },
  {
    tab: 'bg-teal-500 text-white shadow-teal-200 shadow-sm',
    tabInactive: 'hover:text-teal-600 dark:hover:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    dot: 'bg-teal-500',
    ring: 'ring-teal-400',
    row: 'bg-teal-50/30 dark:bg-teal-900/5',
    card: 'border-teal-400',
    avatar: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-700 dark:text-teal-300'
  },
  {
    tab: 'bg-amber-500 text-white shadow-amber-200 shadow-sm',
    tabInactive: 'hover:text-amber-600 dark:hover:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dot: 'bg-amber-500',
    ring: 'ring-amber-400',
    row: 'bg-amber-50/30 dark:bg-amber-900/5',
    card: 'border-amber-400',
    avatar: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300'
  },
  {
    tab: 'bg-sky-500 text-white shadow-sky-200 shadow-sm',
    tabInactive: 'hover:text-sky-600 dark:hover:text-sky-400',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    dot: 'bg-sky-500',
    ring: 'ring-sky-400',
    row: 'bg-sky-50/30 dark:bg-sky-900/5',
    card: 'border-sky-400',
    avatar: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-700 dark:text-sky-300'
  }
]

function getOperatorColor(op: string, operators: string[]): OperatorColor {
  const idx = operators.indexOf(op)
  return OPERATOR_PALETTE[(idx >= 0 ? idx : 0) % OPERATOR_PALETTE.length]
}

const ESTADOS: BackofficeContactEstado[] = [
  'COLABORA',
  'NO COLABORA',
  'PENDIENTE DE RESPUESTA',
  'ENVIADO CORREO'
]

const ESTADO_STYLES: Record<BackofficeContactEstado, string> = {
  COLABORA:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'NO COLABORA': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'PENDIENTE DE RESPUESTA':
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'ENVIADO CORREO':
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
}

const ESTADOS_GESTION: BackofficeContactEstadoGestion[] = [
  'Pendiente',
  'Visitado',
  'En valoración',
  'Firmado',
  'Rechazado'
]

const ESTADO_GESTION_STYLES: Record<BackofficeContactEstadoGestion, string> = {
  Pendiente:
    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  Visitado:
    'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  'En valoración':
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Firmado:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

function effectiveEstadoDisplay(contact: BackofficeContact): {
  label: string
  className: string
} {
  // When backoffice left the default "PENDIENTE DE RESPUESTA" but GPV
  // is already working the contact, show "EN PROCESO" in orange.
  if (
    contact.estado === 'PENDIENTE DE RESPUESTA' &&
    contact.estadoGestion !== 'Pendiente'
  ) {
    return {
      label: 'EN PROCESO',
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    }
  }
  return { label: contact.estado, className: ESTADO_STYLES[contact.estado] }
}

const ESTADO_GESTION_FILTER_STYLES: Record<string, string> = {
  Todos:
    'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm',
  Pendiente:
    'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200',
  Visitado:
    'bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-200',
  'En valoración':
    'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-200',
  Firmado: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200',
  Rechazado: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200'
}

type ReportPeriod = 'semanal' | 'mensual' | 'trimestral'

const emptyForm = (): Partial<BackofficeContact> => ({
  operador: '',
  nombreColaborador: '',
  direccion: '',
  poblacion: '',
  codigoPostal: '',
  telefonoContacto: '',
  razonSocial: '',
  cifNif: '',
  personaContacto: '',
  cargoContacto: '',
  emailContacto: '',
  telefonoAlternativo: '',
  web: '',
  provincia: '',
  isla: '',
  zona: '',
  sector: '',
  tipoNegocio: '',
  origenContacto: '',
  gestorProponente: '',
  prioridadBackoffice: 'Media',
  potencialComercial: '',
  competenciaActual: '',
  canalPreferente: '',
  resultadoUltimoContacto: '',
  motivoRechazo: '',
  assignedTo: '',
  createdBy: '',
  visibility: 'backoffice',
  sharedWithGpv: false,
  handoffStatus: 'sin_derivar',
  lockedReason: '',
  estado: 'PENDIENTE DE RESPUESTA',
  estadoGestion: 'Pendiente',
  observaciones: '',
  ultimosComentarios: '',
  historialComentarios: [],
  proponeVisitaGPV: false,
  fechaVisita: '',
  proximoContacto: '',
  visitas: '',
  seguimiento: ''
})

const Backoffice: React.FC = () => {
  const {
    backofficeContacts,
    addBackofficeContact,
    updateBackofficeContact,
    deleteBackofficeContact,
    forceSyncToSupabase,
    candidates,
    addDistributor,
    addVisit,
    preferences
  } = useAppData()

  const operators = useMemo(() => {
    const fromContacts = backofficeContacts.map(c => c.operador).filter(Boolean)
    const configured = preferences.backofficeOperators ?? []
    return [...new Set([...configured, ...fromContacts])].sort()
  }, [backofficeContacts, preferences.backofficeOperators])

  const [selectedOperator, setSelectedOperator] = useState<string>('Todos')
  const [filterEstadoGestion, setFilterEstadoGestion] =
    useState<string>('Todos')
  const [filterPoblacion, setFilterPoblacion] = useState<string>('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('semanal')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewContact, setViewContact] = useState<BackofficeContact | null>(null)
  const [form, setForm] = useState<Partial<BackofficeContact>>(emptyForm())
  const [isImporting, setIsImporting] = useState(false)
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() =>
    window.innerWidth < 1024 ? 'cards' : 'list'
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)


  // ── Modal Convertir a Distribuidor ───────────────────────────────────────────
  const [convertContact, setConvertContact] =
    useState<BackofficeContact | null>(null)
  const [convertChannelType, setConvertChannelType] =
    useState<ChannelType>('collaborator')

  const openConvert = (contact: BackofficeContact) => {
    setConvertContact(contact)
    setConvertChannelType('collaborator')
  }

  const handleConvertToDistributor = async () => {
    if (!convertContact) return
    try {
      await addDistributor({
        name: convertContact.nombreColaborador,
        phone: convertContact.telefonoContacto ?? '',
        address: convertContact.direccion ?? '',
        city: convertContact.poblacion ?? '',
        postalCode: convertContact.codigoPostal ?? '',
        channelType: convertChannelType,
        status: 'pending',
        notes: `Convertido desde Backoffice (${convertContact.operador}). ${convertContact.observaciones ?? ''}`
      })
      const sysEntry: BackofficeCommentEntry = {
        id: `bc-sys-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        autor: 'Sistema',
        rol: 'Sistema',
        contenido: `Convertido a Distribuidor (${convertChannelType})`
      }
      await updateBackofficeContact(convertContact.id, {
        estado: 'COLABORA',
        estadoGestion: 'Firmado',
        historialComentarios: [
          sysEntry,
          ...(convertContact.historialComentarios ?? [])
        ]
      })
      toast.success(
        `"${convertContact.nombreColaborador}" creado como distribuidor`
      )
      setConvertContact(null)
    } catch {
      toast.error('Error al crear el distribuidor')
    }
  }

  // ── Modal Programar Visita ────────────────────────────────────────────────────
  const [visitContact, setVisitContact] = useState<BackofficeContact | null>(
    null
  )
  const [visitForm, setVisitForm] = useState({
    date: '',
    type: 'seguimiento' as VisitType,
    objective: ''
  })

  const openVisit = (contact: BackofficeContact) => {
    setVisitContact(contact)
    setVisitForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'seguimiento',
      objective: `Contacto Backoffice (${contact.operador}): ${contact.nombreColaborador}`
    })
  }

  const handleCreateVisit = async () => {
    if (!visitContact || !visitForm.date) {
      toast.error('La fecha es obligatoria')
      return
    }
    try {
      await addVisit({
        distributorId: null,
        candidateId: null,
        date: visitForm.date,
        type: visitForm.type,
        objective: visitForm.objective,
        summary: '',
        nextSteps: '',
        result: 'pendiente'
      })
      await updateBackofficeContact(visitContact.id, {
        proponeVisitaGPV: true,
        fechaVisita: visitForm.date
      })
      toast.success('Visita programada y registrada en el módulo Visitas')
      setVisitContact(null)
    } catch {
      toast.error('Error al crear la visita')
    }
  }

  // Nombres de candidatos para detección de duplicados (normalizado)
  const candidateNames = useMemo(
    () => new Set(candidates.map((c) => c.name.toLowerCase().trim())),
    [candidates]
  )

  const isDuplicate = (contact: BackofficeContact) =>
    candidateNames.has(contact.nombreColaborador.toLowerCase().trim())

  const allOperators = ['Todos', ...operators]

  useEffect(() => {
    setCurrentPage(1)
    setSelectedRowId(null)
  }, [selectedOperator, filterEstadoGestion, filterPoblacion, searchText, sortColumn, sortDir])

  const filtered = useMemo(() => {
    const lower = searchText.toLowerCase()
    let result = backofficeContacts.filter((c) => {
      if (selectedOperator !== 'Todos' && c.operador !== selectedOperator)
        return false
      if (
        filterEstadoGestion !== 'Todos' &&
        c.estadoGestion !== filterEstadoGestion
      )
        return false
      if (
        filterPoblacion &&
        !c.poblacion?.toLowerCase().includes(filterPoblacion.toLowerCase())
      )
        return false
      if (
        lower &&
        !c.nombreColaborador.toLowerCase().includes(lower) &&
        !c.poblacion?.toLowerCase().includes(lower) &&
        !c.telefonoContacto?.includes(lower)
      )
        return false
      return true
    })
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const val = (c: typeof a): string => {
          if (sortColumn === 'nombreColaborador')
            return c.nombreColaborador.toLowerCase()
          if (sortColumn === 'poblacion')
            return (c.poblacion ?? '').toLowerCase()
          if (sortColumn === 'estadoGestion') return c.estadoGestion
          if (sortColumn === 'operador') return c.operador
          return ''
        }
        const cmp = val(a).localeCompare(val(b), 'es')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [
    backofficeContacts,
    selectedOperator,
    filterEstadoGestion,
    filterPoblacion,
    searchText,
    sortColumn,
    sortDir
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Lista única de poblaciones para el selector
  const poblaciones = useMemo(() => {
    const set = new Set(
      backofficeContacts.map((c) => c.poblacion).filter(Boolean) as string[]
    )
    return Array.from(set).sort()
  }, [backofficeContacts])

  const stats = useMemo(() => {
    // Stats always sobre el operador seleccionado, sin filtros adicionales
    const base =
      selectedOperator === 'Todos'
        ? backofficeContacts
        : backofficeContacts.filter((c) => c.operador === selectedOperator)
    return {
      total: base.length,
      firmados: base.filter((c) => c.estadoGestion === 'Firmado').length,
      proponeVisita: base.filter((c) => c.proponeVisitaGPV).length,
      duplicados: base.filter((c) =>
        candidateNames.has(c.nombreColaborador.toLowerCase().trim())
      ).length,
      porEstado: ESTADOS_GESTION.reduce(
        (acc, s) => {
          acc[s] = base.filter((c) => c.estadoGestion === s).length
          return acc
        },
        {} as Record<BackofficeContactEstadoGestion, number>
      )
    }
  }, [backofficeContacts, selectedOperator, candidateNames])

  const operatorStats = useMemo(() => {
    const result: Record<string, { total: number; firmados: number; pendientes: number }> = {}
    for (const op of operators) {
      let total = 0, firmados = 0, pendientes = 0
      for (const c of backofficeContacts) {
        if (c.operador !== op) continue
        total++
        if (c.estadoGestion === 'Firmado') firmados++
        if (c.estadoGestion === 'Pendiente') pendientes++
      }
      result[op] = { total, firmados, pendientes }
    }
    return result
  }, [backofficeContacts, operators])

  // ── Formulario ──────────────────────────────────────────────────────────────

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDir('asc')
    }
  }

  const openNew = () => {
    setForm({
      ...emptyForm(),
      operador: selectedOperator === 'Todos' ? (operators[0] ?? '') : selectedOperator
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (contact: BackofficeContact) => {
    setForm({ ...contact })
    setEditingId(contact.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }


  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    await deleteBackofficeContact(id)
    toast.success('Contacto eliminado')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map(c => c.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.size} contacto(s) seleccionados?`)) return
    const count = selectedIds.size
    for (const id of selectedIds) {
      await deleteBackofficeContact(id)
    }
    setSelectedIds(new Set())
    toast.success(`${count} contacto(s) eliminados`)
  }

  const handleExportSelected = () => {
    const rows = backofficeContacts.filter(c => selectedIds.has(c.id))
    const data = rows.map(c => ({
      OPERADOR: c.operador,
      'NOMBRE COLABORADOR': c.nombreColaborador,
      DIRECCIÓN: c.direccion ?? '',
      POBLACION: c.poblacion ?? '',
      'CODIGO POSTAL': c.codigoPostal ?? '',
      'TELEFONO CONTACTO': c.telefonoContacto ?? '',
      ESTADO: c.estado,
      'ESTADO GESTIÓN GPV': c.estadoGestion,
      OBSERVACIONES: c.observaciones ?? ''
    }))
    import('../lib/utils/excelWorkbook').then(({ addJsonSheet, createWorkbook, writeWorkbook }) => {
      const wb = createWorkbook()
      addJsonSheet(wb, 'Seleccionados', data)
      writeWorkbook(wb, `backoffice_seleccion_${Date.now()}.xlsx`)
    })
    setSelectedIds(new Set())
    toast.success(`${rows.length} contacto(s) exportados`)
  }

  // ── Forzar sincronización con Supabase ───────────────────────────────────────

  const handleForceSync = async () => {
    const tid = toast.loading('Sincronizando con Supabase…')
    const { pushed, errors, authError } = await forceSyncToSupabase()
    toast.dismiss(tid)
    if (authError) {
      toast.error(
        'Sesión expirada. Cierra sesión, vuelve a entrar y repite la sincronización.'
      )
    } else if (errors > 0) {
      toast.error(`Sync completado con ${errors} error(es). Subidos: ${pushed}`)
    } else if (pushed === 0) {
      toast.info('Todo ya estaba sincronizado con Supabase.')
    } else {
      toast.success(`${pushed} contacto(s) subido(s) a Supabase correctamente.`)
    }
  }

  // ── Exportar Excel ───────────────────────────────────────────────────────────

  const handleExportExcel = async () => {
    const data = filtered.map((c) => ({
      OPERADOR: c.operador,
      'NOMBRE COLABORADOR': c.nombreColaborador,
      DIRECCIÓN: c.direccion ?? '',
      POBLACION: c.poblacion ?? '',
      'CODIGO POSTAL': c.codigoPostal ?? '',
      'TELEFONO CONTACTO': c.telefonoContacto ?? '',
      ESTADO: c.estado,
      'ESTADO GESTIÓN GPV': c.estadoGestion,
      OBSERVACIONES: c.observaciones ?? '',
      'ULTIMOS COMENTARIOS': c.ultimosComentarios ?? '',
      'PROPONE VISITA GPV (S/NO)': c.proponeVisitaGPV ? 'S' : 'NO',
      'Fecha visita': c.fechaVisita ?? '',
      VISITAS: c.visitas ?? '',
      Seguimiento: c.seguimiento ?? '',
      'DUPLICADO EN CANDIDATOS': isDuplicate(c) ? 'SÍ' : ''
    }))

    const wb = createWorkbook()
    const sheetName =
      selectedOperator === 'Todos'
        ? 'Backoffice_Todos'
        : `Backoffice_${selectedOperator}`
    const ws = addJsonSheet(wb, sheetName, data)

    // Marcar duplicados en naranja
    filtered.forEach((c, idx) => {
      if (isDuplicate(c)) {
        const row = idx + 2
        for (let col = 1; col <= 14; col++) {
          ws.getCell(row, col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEDD5' }
          }
        }
      }
    })

    await writeWorkbook(
      wb,
      `${sheetName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    )
    toast.success('Excel exportado correctamente')
  }

  // ── Importar Excel ───────────────────────────────────────────────────────────

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    void (async () => {
      try {
        const rows = (await readFirstSheetRows(file)) as Record<
          string,
          unknown
        >[]
        let count = 0
        for (const row of rows) {
          const nombre = String(
            row['NOMBRE COLABORADOR'] ?? row['Nombre Colaborador'] ?? ''
          ).trim()
          if (!nombre) continue
          const existing = backofficeContacts.find(
            (c) => c.nombreColaborador.toLowerCase() === nombre.toLowerCase()
          )
          const payload: NewBackofficeContact = {
            operador: String(row['OPERADOR'] ?? selectedOperator),
            nombreColaborador: nombre,
            direccion: row['DIRECCIÓN'] ? String(row['DIRECCIÓN']) : undefined,
            poblacion: row['POBLACION'] ? String(row['POBLACION']) : undefined,
            codigoPostal: row['CODIGO POSTAL']
              ? String(row['CODIGO POSTAL'])
              : undefined,
            telefonoContacto: row['TELEFONO CONTACTO']
              ? String(row['TELEFONO CONTACTO'])
              : undefined,
            estado: String(
              row['ESTADO'] ?? 'PENDIENTE DE RESPUESTA'
            ) as BackofficeContactEstado,
            estadoGestion: String(
              row['ESTADO GESTIÓN GPV'] ?? 'Pendiente'
            ) as BackofficeContactEstadoGestion,
            observaciones: row['OBSERVACIONES']
              ? String(row['OBSERVACIONES'])
              : undefined,
            ultimosComentarios: row['ULTIMOS COMENTARIOS']
              ? String(row['ULTIMOS COMENTARIOS'])
              : undefined,
            proponeVisitaGPV:
              String(row['PROPONE VISITA GPV (S/NO)'] ?? '').toUpperCase() ===
              'S',
            fechaVisita: row['Fecha visita']
              ? String(row['Fecha visita'])
              : undefined,
            visitas: row['VISITAS'] ? String(row['VISITAS']) : undefined,
            seguimiento: row['Seguimiento']
              ? String(row['Seguimiento'])
              : undefined
          }
          if (existing) {
            await updateBackofficeContact(existing.id, payload)
          } else {
            await addBackofficeContact(payload)
          }
          count++
        }
        toast.success(`${count} registros importados`)
      } catch (err) {
        console.error(err)
        toast.error('Error al procesar el archivo Excel')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })()
  }

  // ── Informe PDF ──────────────────────────────────────────────────────────────

  const getPeriodRange = (): { label: string; start: Date; end: Date } => {
    const now = new Date()
    if (reportPeriod === 'semanal') {
      return {
        label: 'Semanal',
        start: startOfWeek(now, { locale: es }),
        end: endOfWeek(now, { locale: es })
      }
    }
    if (reportPeriod === 'mensual') {
      return {
        label: 'Mensual',
        start: startOfMonth(now),
        end: endOfMonth(now)
      }
    }
    return {
      label: 'Trimestral',
      start: startOfQuarter(now),
      end: endOfQuarter(now)
    }
  }

  const handleExportPDF = () => {
    toast.info('Generando informe PDF…')
    try {
      _handleExportPDFImpl()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(`Error al generar PDF: ${message}`)
      console.error('PDF export error:', err)
    }
  }

  const _handleExportPDFImpl = () => {
    const { label, start, end } = getPeriodRange()
    const operadorLabel =
      selectedOperator === 'Todos' ? 'Todos los Operadores' : selectedOperator
    const generatedAt = format(new Date(), "dd/MM/yyyy 'a las' HH:mm", {
      locale: es
    })

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    const pageW = doc.internal.pageSize.width
    const pageH = doc.internal.pageSize.height
    const ML = 14
    const MR = 14

    // Palette
    const INDIGO: [number, number, number] = [79, 70, 229]
    const INDIGO_SOFT: [number, number, number] = [238, 242, 255]
    const GREEN: [number, number, number] = [22, 163, 74]
    const CYAN: [number, number, number] = [8, 145, 178]
    const ORANGE_KPI: [number, number, number] = [234, 88, 12]
    const SLATE: [number, number, number] = [71, 85, 105]
    const DUP_BG: [number, number, number] = [255, 237, 213]
    const GESTION_BG: Record<string, [number, number, number]> = {
      Pendiente: [241, 245, 249],
      Visitado: [237, 233, 254],
      'En valoración': [255, 251, 235],
      Firmado: [220, 252, 231],
      Rechazado: [254, 226, 226]
    }

    const fmtDate = (d?: string) => {
      if (!d) return '-'
      const p = d.split('-')
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
    }

    // Helper for simple bar chart on cover
    const drawMiniBar = (x: number, y: number, w: number, h: number, percent: number, color: [number, number, number], label: string) => {
      doc.setFillColor(240, 242, 245)
      doc.roundedRect(x, y, w, h, 1, 1, 'F')
      doc.setFillColor(color[0], color[1], color[2])
      doc.roundedRect(x, y, w * (percent / 100), h, 1, 1, 'F')
      doc.setFontSize(6)
      doc.setTextColor(100, 100, 120)
      doc.text(`${label} (${percent}%)`, x, y - 1.5)
    }

    // ── PÁGINA 1: Portada + Resumen ejecutivo ────────────────────────────────

    // Título principal
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 50)
    doc.text('Informe Backoffice', ML, 24)

    const titleWidth = doc.getTextWidth('Informe Backoffice')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2])
    doc.text(`— ${label}`, ML + titleWidth + 4, 24)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2])
    doc.text(`Operador: ${operadorLabel}`, ML, 32)
    doc.text(
      `Período: ${format(start, "d 'de' MMMM yyyy", { locale: es })} – ${format(end, "d 'de' MMMM yyyy", { locale: es })}`,
      ML,
      38
    )
    doc.setTextColor(0, 0, 0)

    // Línea separadora
    doc.setDrawColor(INDIGO[0], INDIGO[1], INDIGO[2])
    doc.setLineWidth(0.7)
    doc.line(ML, 43, pageW - MR, 43)
    doc.setLineWidth(0.2)

    // Cajas KPI
    const kpis = [
      { label: 'Total Contactos', value: String(stats.total), color: INDIGO },
      { label: 'Firmados', value: String(stats.firmados), color: GREEN },
      {
        label: 'Proponen Visita GPV',
        value: String(stats.proponeVisita),
        color: CYAN
      },
      {
        label: 'Duplicados',
        value: String(stats.duplicados),
        color: ORANGE_KPI
      }
    ]
    const kpiW = (pageW - ML - MR - 9) / 4
    kpis.forEach((kpi, i) => {
      const x = ML + i * (kpiW + 3)
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
      doc.roundedRect(x, 47, kpiW, 26, 2, 2, 'F')
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(kpi.value, x + kpiW / 2, 61, { align: 'center' })
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(kpi.label, x + kpiW / 2, 69, { align: 'center' })
    })
    doc.setTextColor(0, 0, 0)

    // Tabla distribución estado gestión (columna izquierda)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 50)
    doc.text('Distribución por Estado de Gestión', ML, 82)
    autoTable(doc, {
      startY: 85,
      head: [['Estado de Gestión', 'Contactos', '%']],
      body: ESTADOS_GESTION.map((s) => [
        s,
        String(stats.porEstado[s]),
        stats.total > 0
          ? `${Math.round((stats.porEstado[s] / stats.total) * 100)}%`
          : '0%'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: INDIGO,
        fontSize: 8,
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data: CellHookData) => {
        if (data.section === 'body') {
          const estado = ESTADOS_GESTION[data.row.index]
          if (data.column.index === 0) {
            data.cell.styles.fillColor = GESTION_BG[estado] ?? [255, 255, 255]
            data.cell.styles.fontStyle = 'bold'
          }
          if (data.column.index === 1 || data.column.index === 2) {
            data.cell.styles.halign = 'center'
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 22 },
        2: { cellWidth: 14 }
      },
      margin: { left: ML },
      tableWidth: 81
    })

    // --- GRÁFICO DE DISTRIBUCIÓN (Visualización Premium) ---
    const chartX = ML + 85
    const chartY = 85
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2])
    doc.text('Análisis Visual de Estados', chartX, 82)
    
    ESTADOS_GESTION.forEach((s, i) => {
      const p = stats.total > 0 ? Math.round((stats.porEstado[s] / stats.total) * 100) : 0
      const color = GESTION_BG[s] || [200, 200, 200]
      // Use slightly darker version of BG for the bar
      const barColor: [number, number, number] = [
        Math.max(0, color[0] - 40),
        Math.max(0, color[1] - 40),
        Math.max(0, color[2] - 40)
      ]
      drawMiniBar(chartX, chartY + 8 + (i * 10), 60, 4, p, barColor, s)
    })

    // Tabla resumen por operador (columna derecha, solo si "Todos")
    if (selectedOperator === 'Todos') {
      const activeOps = operators.filter((op) =>
        backofficeContacts.some((c) => c.operador === op)
      )
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 50)
      doc.text('Resumen por Operador', ML + 95, 80)
      autoTable(doc, {
        startY: 83,
        head: [
          [
            'Operador',
            'Total',
            'Firmado',
            'En valoración',
            'Visitado',
            'Pendiente',
            'Rechazado'
          ]
        ],
        body: activeOps.map((op) => {
          const opC = backofficeContacts.filter((c) => c.operador === op)
          return [
            op,
            String(opC.length),
            String(opC.filter((c) => c.estadoGestion === 'Firmado').length),
            String(
              opC.filter((c) => c.estadoGestion === 'En valoración').length
            ),
            String(opC.filter((c) => c.estadoGestion === 'Visitado').length),
            String(opC.filter((c) => c.estadoGestion === 'Pendiente').length),
            String(opC.filter((c) => c.estadoGestion === 'Rechazado').length)
          ]
        }),
        theme: 'striped',
        headStyles: {
          fillColor: INDIGO,
          fontSize: 7.5,
          fontStyle: 'bold',
          textColor: [255, 255, 255]
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold' },
          1: { cellWidth: 14, halign: 'center' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: ML + 95 },
        tableWidth: pageW - ML - MR - 98
      })
    }

    // ── PÁGINAS 2+: Fichas por operador ─────────────────────────────────────

    const groups =
      selectedOperator === 'Todos'
        ? operators.filter((op) =>
            backofficeContacts.some((c) => c.operador === op)
          )
        : [selectedOperator]

    // --- PÁGINA 2: ÍNDICE INTERACTIVO ---
    doc.addPage()
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 50)
    doc.text('Índice de Contenidos', ML, 30)
    
    doc.setDrawColor(INDIGO[0], INDIGO[1], INDIGO[2])
    doc.setLineWidth(0.5)
    doc.line(ML, 35, pageW - MR, 35)
    
    doc.setFontSize(11)
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2])
    doc.text('Haz clic en cualquier operador para ir a su sección detallada.', ML, 42)

    const opPageMap: Record<string, number> = {}
    let currentY = 18
    let lastTableFinalY: number | null = null

    for (const op of groups) {
      const contacts = backofficeContacts.filter((c) => c.operador === op)
      if (!contacts.length) continue

      doc.addPage()
      opPageMap[op] = (doc as AutoTableJsPDF).internal.getNumberOfPages()
      currentY = 18

      // Cabecera de operador
      doc.setFillColor(INDIGO_SOFT[0], INDIGO_SOFT[1], INDIGO_SOFT[2])
      doc.rect(ML, currentY, pageW - ML - MR, 8, 'F')
      doc.setDrawColor(INDIGO[0], INDIGO[1], INDIGO[2])
      doc.setLineWidth(0.4)
      doc.rect(ML, currentY, pageW - ML - MR, 8, 'S')
      doc.setLineWidth(0.2)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2])
      doc.text(op, ML + 3, currentY + 5.5)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(SLATE[0], SLATE[1], SLATE[2])
      doc.text(
        `${contacts.length} contactos`,
        ML + 3 + doc.getTextWidth(op) + 4,
        currentY + 5.5
      )
      const firmadosOp = contacts.filter(
        (c) => c.estadoGestion === 'Firmado'
      ).length
      doc.setTextColor(GREEN[0], GREEN[1], GREEN[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`${firmadosOp} firmados`, pageW - MR - 32, currentY + 5.5)
      doc.setTextColor(0, 0, 0)
      currentY += 10

      const rows = contacts.map((c) => {
        return [
          c.nombreColaborador,
          c.poblacion ?? '-',
          c.telefonoContacto ?? '-',
          c.estado,
          c.estadoGestion,
          c.proponeVisitaGPV ? 'Sí' : 'No',
          fmtDate(c.fechaVisita),
          c.historialComentarios && c.historialComentarios.length > 0
            ? c.historialComentarios
                .map((h) => `[${h.rol}] ${h.contenido}`)
                .join('\n')
            : (c.ultimosComentarios || '-')
        ]
      })

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'Colaborador',
            'Población',
            'Teléfono',
            'Estado',
            'Est. Gestión',
            'Visita',
            'Fecha',
            'Historial de Notas y Comentarios'
          ]
        ],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: INDIGO,
          fontSize: 7.5,
          fontStyle: 'bold',
          textColor: [255, 255, 255]
        },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 24 },
          2: { cellWidth: 22 },
          3: { cellWidth: 30 },
          4: { cellWidth: 22 },
          5: { cellWidth: 14, halign: 'center' },
          6: { cellWidth: 18 },
          7: { cellWidth: 'auto', cellPadding: 2 }
        },
        didParseCell: (data: CellHookData) => {
          const contact = contacts[data.row.index]
          if (data.section === 'body' && contact) {
            if (isDuplicate(contact)) {
              data.cell.styles.fillColor = DUP_BG
            } else if (data.column.index === 4) {
              data.cell.styles.fillColor = GESTION_BG[
                contact.estadoGestion
              ] ?? [255, 255, 255]
            }
            if (data.column.index === 5) {
              data.cell.styles.textColor = contact.proponeVisitaGPV
                ? GREEN
                : SLATE
              data.cell.styles.fontStyle = contact.proponeVisitaGPV
                ? 'bold'
                : 'normal'
            }
          }
        },
        didDrawCell: (data: CellHookData) => {
          if (data.column.index === 7 && data.section === 'body') {
            const contact = contacts[data.row.index]
            const history = contact.historialComentarios ?? []
            if (history.length === 0 && !contact.ultimosComentarios) return

            // Colors mapping for PDF
            const ROLE_PDF_COLORS: Record<string, [number, number, number]> = {
              Backoffice: [59, 130, 246], // Blue
              GPV: [16, 185, 129], // Emerald
              Observación: [245, 158, 11], // Amber
              Seguimiento: [20, 184, 166], // Teal
              Incidencia: [244, 63, 94], // Rose
              Sistema: [100, 116, 139] // Slate
            }

            // Get cell coordinates
            const x = data.cell.x + data.cell.padding('left')
            let y = data.cell.y + data.cell.padding('top') + 2

            // Clear original text (we will draw it ourselves)
            // Use cell's own fill color if set (for duplicates or striped)
            const fCol = data.cell.styles.fillColor
            if (Array.isArray(fCol)) {
              doc.setFillColor(fCol[0], fCol[1], fCol[2])
            } else if (typeof fCol === 'string') {
              doc.setFillColor(fCol)
            } else if (typeof fCol === 'number') {
              doc.setFillColor(fCol, fCol, fCol)
            } else {
              doc.setFillColor(255, 255, 255)
            }
            doc.rect(data.cell.x + 0.2, data.cell.y + 0.2, data.cell.width - 0.4, data.cell.height - 0.4, 'F')

            const drawNote = (role: string, content: string) => {
              const color = ROLE_PDF_COLORS[role] || ROLE_PDF_COLORS.Sistema
              doc.setFontSize(6.5)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(color[0], color[1], color[2])
              doc.text(`[${role}]`, x, y)
              
              const roleWidth = doc.getTextWidth(`[${role}] `)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(50, 50, 70)
              
              // Wrap text to fit cell width
              const maxWidth = data.cell.width - data.cell.padding('left') - data.cell.padding('right') - roleWidth
              const lines = doc.splitTextToSize(content, maxWidth)
              
              lines.forEach((line: string, i: number) => {
                doc.text(line, x + (i === 0 ? roleWidth : 0), y)
                y += 3.2 // Line height
              })
              y += 1.2 // Space between notes
            }

            if (history.length > 0) {
              history.forEach(h => drawNote(h.rol, h.contenido))
            } else if (contact.ultimosComentarios) {
              drawNote('Nota', contact.ultimosComentarios)
            }
          }
        },
        margin: { left: ML, right: MR, top: 18 }
      })
      lastTableFinalY = (doc as AutoTableJsPDF).lastAutoTable?.finalY ?? null
      currentY = lastTableFinalY + 10
    }

    // --- RELLENAR EL ÍNDICE (Volviendo a la página 2) ---
    const lastPage = (doc as AutoTableJsPDF).internal.getNumberOfPages()
    doc.setPage(2)
    doc.setFontSize(10)
    groups.forEach((op, i) => {
      const page = opPageMap[op]
      if (!page) return
      
      const y = 55 + (i * 10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2])
      doc.text(op, ML + 5, y)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(150, 150, 170)
      const dotW = pageW - MR - ML - 30 - doc.getTextWidth(op)
      const dots = ".".repeat(Math.floor(dotW / 1.5))
      doc.text(dots, ML + 10 + doc.getTextWidth(op), y)
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Pág. ${page}`, pageW - MR - 15, y)
      
      // Link interactivo
      doc.link(ML, y - 5, pageW - ML - MR, 8, { pageNumber: page })
    })

    // Volver a la última página para la leyenda
    doc.setPage(lastPage)

    // Leyenda duplicados
    if (lastTableFinalY !== null) {
      const legendY = Math.min(lastTableFinalY + 6, pageH - 18)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(180, 100, 0)
      doc.text(
        '* Filas en naranja: contacto ya existente en la lista de Candidatos GPV',
        ML,
        legendY
      )
      doc.setTextColor(0, 0, 0)
    }

    // ── Banda de cabecera + pie en TODAS las páginas ─────────────────────────

    const totalPages = (doc as AutoTableJsPDF).internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)

      // Banda superior
      doc.setFillColor(INDIGO[0], INDIGO[1], INDIGO[2])
      doc.rect(0, 0, pageW, 11, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('GPV Consultor — Backoffice', ML, 7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Informe ${label} · ${operadorLabel}`, pageW / 2, 7.5, {
        align: 'center'
      })
      doc.text(`Página ${p} de ${totalPages}`, pageW - MR, 7.5, {
        align: 'right'
      })
      doc.setTextColor(0, 0, 0)

      // Pie de página
      doc.setDrawColor(200, 205, 215)
      doc.setLineWidth(0.3)
      doc.line(ML, pageH - 11, pageW - MR, pageH - 11)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 155, 165)
      doc.text('GPV Consultor — Documento confidencial', ML, pageH - 6)
      doc.text(`Generado: ${generatedAt}`, pageW - MR, pageH - 6, {
        align: 'right'
      })
      doc.setTextColor(0, 0, 0)
    }

    const fileName = `Informe_Backoffice_${label}_${operadorLabel.replace(/ /g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(fileName)
    toast.success(
      `Informe PDF generado — ${totalPages} ${totalPages === 1 ? 'página' : 'páginas'}`
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const periodLabels: Record<ReportPeriod, string> = {
    semanal: 'Semanal',
    mensual: 'Mensual',
    trimestral: 'Trimestral'
  }

  return (
    <PageContainer size="full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <UserGroupIcon className="w-8 h-8 text-indigo-500" />
              Módulo Backoffice
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Seguimiento de contactos propuestos por los gestores de cuenta
              para captación de distribuidores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Importar */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              disabled={isImporting}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white dark:bg-slate-800"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1.5 text-green-500" />
              Importar Excel
            </Button>

            {/* Sincronizar con Supabase */}
            <Button
              variant="secondary"
              onClick={handleForceSync}
              className="bg-white dark:bg-slate-800"
              title="Subir contactos locales que faltan en Supabase"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1.5 text-indigo-500" />
              Sync Supabase
            </Button>

            {/* Exportar Excel */}
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              className="bg-white dark:bg-slate-800"
            >
              <TableCellsIcon className="w-4 h-4 mr-1.5 text-emerald-500" />
              Exportar Excel
            </Button>

            {/* Selector de periodo + PDF */}
            <div className="flex items-center gap-0">
              <Button
                variant="primary"
                onClick={handleExportPDF}
                className="rounded-r-none border-r border-indigo-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
                Informe PDF
              </Button>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodMenu((v) => !v)}
                  className="flex items-center gap-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg border-l border-indigo-700 text-sm font-medium transition-colors"
                >
                  <span className="text-xs">{periodLabels[reportPeriod]}</span>
                  <ChevronDownIcon className="w-3 h-3" />
                </button>
                {showPeriodMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 w-32">
                    {(Object.keys(periodLabels) as ReportPeriod[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setReportPeriod(p)
                          setShowPeriodMenu(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${reportPeriod === p ? 'text-indigo-600 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {periodLabels[p]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nuevo contacto */}
            <Button variant="primary" onClick={openNew}>
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Nuevo Contacto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Contactos',
              value: stats.total,
              color: 'indigo',
              Icon: UserGroupIcon
            },
            {
              label: 'Firmados',
              value: stats.firmados,
              color: 'emerald',
              Icon: CheckCircleIcon
            },
            {
              label: 'Proponen Visita GPV',
              value: stats.proponeVisita,
              color: 'violet',
              Icon: CalendarDaysIcon
            },
            {
              label: 'Duplicados en Candidatos',
              value: stats.duplicados,
              color: 'amber',
              Icon: ExclamationTriangleIcon
            }
          ].map(({ label, value, color, Icon }) => (
            <Card key={label} className={`p-5 border-l-4 border-${color}-500`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {value}
                  </p>
                </div>
                <div
                  className={`p-2.5 bg-${color}-50 dark:bg-${color}-900/30 rounded-xl`}
                >
                  <Icon
                    className={`w-7 h-7 text-${color}-600 dark:text-${color}-400`}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mini-resumen por gestor */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {operators.map((op) => {
            const c = getOperatorColor(op, operators)
            const { total, firmados, pendientes } = operatorStats[op] ?? { total: 0, firmados: 0, pendientes: 0 }
            const initials = op.slice(0, 2).toUpperCase()
            return (
              <button
                key={op}
                onClick={() =>
                  setSelectedOperator(selectedOperator === op ? 'Todos' : op)
                }
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  selectedOperator === op
                    ? `${c.card} bg-white dark:bg-slate-800 shadow-md`
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${c.avatar} ${c.text}`}
                >
                  {initials}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {op}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {total} contactos ·{' '}
                    <span className="text-green-600 dark:text-green-400">
                      {firmados} firmados
                    </span>
                    {pendientes > 0 && (
                      <span className="text-slate-400">
                        {' '}
                        · {pendientes} pend.
                      </span>
                    )}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Nota duplicados */}
        {stats.duplicados > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
            <span>
              <strong>{stats.duplicados} contactos</strong> coinciden con
              nombres de candidatos en el listado GPV. Se marcan en{' '}
              <span className="font-semibold text-orange-600">naranja</span> en
              la tabla.
            </span>
          </div>
        )}

        {/* Tabs de operador */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl flex-wrap">
          {allOperators.map((op) => {
            const colors = op !== 'Todos' ? getOperatorColor(op, operators) : null
            const isActive = selectedOperator === op
            const count =
              op !== 'Todos' ? (operatorStats[op]?.total ?? 0) : null
            return (
              <button
                key={op}
                onClick={() => setSelectedOperator(op)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? colors
                      ? colors.tab
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : colors
                      ? `text-slate-500 ${colors.tabInactive}`
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {colors && (
                  <span
                    className={`w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : colors.dot}`}
                  />
                )}
                {op}
                {count !== null && (
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 shrink-0">
            <FunnelIcon className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Filtros
            </span>
          </div>

          {/* Buscador */}
          <div className="relative shrink-0">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar nombre, población, teléfono…"
              className="pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircleIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por estado gestión */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['Todos', ...ESTADOS_GESTION].map((s) => (
              <button
                key={s}
                onClick={() => setFilterEstadoGestion(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filterEstadoGestion === s
                    ? `${ESTADO_GESTION_FILTER_STYLES[s]} border-transparent ring-2 ring-offset-1 ring-indigo-400`
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 bg-white dark:bg-slate-800'
                }`}
              >
                {s}
                {s !== 'Todos' && (
                  <span className="ml-1 opacity-70">
                    ({stats.porEstado[s as BackofficeContactEstadoGestion] ?? 0})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtro por población */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={filterPoblacion}
              onChange={(e) => setFilterPoblacion(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
            >
              <option value="">Todas las poblaciones</option>
              {poblaciones.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {(filterEstadoGestion !== 'Todos' ||
              filterPoblacion ||
              searchText) && (
              <button
                onClick={() => {
                  setFilterEstadoGestion('Todos')
                  setFilterPoblacion('')
                  setSearchText('')
                  setSortColumn(null)
                }}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            )}

            {/* Toggle vista */}
            <div className="hidden lg:flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 ml-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Vista lista"
                className={`inline-flex items-center px-2.5 py-1.5 text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <QueueListIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Vista tarjetas"
                className={`inline-flex items-center px-2.5 py-1.5 text-sm transition-colors border-l border-slate-200 dark:border-slate-700 ${
                  viewMode === 'cards'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra flotante de selección múltiple */}
        {selectedIds.size > 0 && (
          <div className="sticky top-4 z-30 mx-auto w-fit animate-fade-in">
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-5 py-3 shadow-xl">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
              >
                <ArrowUpTrayIcon className="w-4 h-4" /> Exportar
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <TrashIcon className="w-4 h-4" /> Eliminar
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircleIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tabla / Tarjetas */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center text-sm text-slate-400">
                No hay contactos que coincidan con los filtros.
              </div>
            ) : paginated.map(contact => {
              const opColor = getOperatorColor(contact.operador, operators)
              const eff = effectiveEstadoDisplay(contact)
              const isChecked = selectedIds.has(contact.id)
              return (
                <article
                  key={contact.id}
                  className={`relative flex flex-col gap-3 rounded-xl border p-4 transition-all ${
                    isChecked
                      ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-700 bg-indigo-50/40 dark:bg-indigo-900/10'
                      : opColor ? `${opColor.card} bg-white dark:bg-slate-900` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Checkbox esquina */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(contact.id)}
                    className="absolute top-3 right-3 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  {/* Cabecera */}
                  <div className="flex items-start gap-3 pr-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      opColor ? opColor.avatar : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {contact.nombreColaborador.slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{contact.nombreColaborador}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${
                        opColor ? opColor.badge : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {opColor && <span className={`w-1.5 h-1.5 rounded-full ${opColor.dot}`} />}
                        {contact.operador}
                      </span>
                    </div>
                  </div>
                  {/* Datos */}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {contact.telefonoContacto && (
                      <div className="col-span-2"><dt className="text-slate-400">Teléfono</dt><dd className="font-medium text-slate-700 dark:text-slate-300">{contact.telefonoContacto}</dd></div>
                    )}
                    {contact.poblacion && (
                      <div><dt className="text-slate-400">Población</dt><dd className="font-medium text-slate-700 dark:text-slate-300">{contact.poblacion}</dd></div>
                    )}
                    {contact.proximoContacto && (
                      <div><dt className="text-slate-400">Próx. contacto</dt><dd className="font-semibold text-teal-600 dark:text-teal-400">{contact.proximoContacto}</dd></div>
                    )}
                  </dl>
                  {/* Badges estado */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${eff.className}`}>{eff.label}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_GESTION_STYLES[contact.estadoGestion]}`}>{contact.estadoGestion}</span>
                  </div>
                  {/* Acciones */}
                  <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setViewContact(contact)} className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-500 transition-colors" title="Ver detalle"><EyeIcon className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(contact)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => openVisit(contact)} className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 text-violet-500 transition-colors" title="Programar visita"><CalendarDaysIcon className="w-4 h-4" /></button>
                    <button onClick={() => openConvert(contact)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-500 transition-colors" title="Convertir a distribuidor"><BuildingStorefrontIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(contact.id, contact.nombreColaborador)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 transition-colors ml-auto" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {(() => {
                    const SortTh = ({
                      col,
                      children,
                      className: cx
                    }: {
                      col: string
                      children: React.ReactNode
                      className?: string
                    }) => (
                      <th
                        onClick={() => handleSort(col)}
                        className={`px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${cx ?? ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {children}
                          {sortColumn === col ? (
                            <ChevronUpIcon
                              className={`w-3.5 h-3.5 text-indigo-500 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`}
                            />
                          ) : (
                            <ChevronUpDownIcon className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </th>
                    )
                    const PlainTh = ({
                      children,
                      className: cx
                    }: {
                      children: React.ReactNode
                      className?: string
                    }) => (
                      <th
                        className={`px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap ${cx ?? ''}`}
                      >
                        {children}
                      </th>
                    )
                    return (
                      <>
                        <th className="px-3 py-2 w-8">
                          <input
                            type="checkbox"
                            checked={paginated.length > 0 && selectedIds.size === paginated.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <SortTh col="operador">Op.</SortTh>
                        <SortTh col="nombreColaborador">Nombre</SortTh>
                        <SortTh col="poblacion">Dirección / Población</SortTh>
                        <PlainTh>Teléfono</PlainTh>
                        <PlainTh>Estado gestor</PlainTh>
                        <SortTh col="estadoGestion">Gestión</SortTh>
                      </>
                    )
                  })()}
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[160px]">
                    Observaciones
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[180px]">
                    Último comentario
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Próx.
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-6 py-14 text-center text-slate-400 dark:text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ClockIcon className="w-10 h-10 opacity-20" />
                        <p>
                          No hay contactos registrados
                          {selectedOperator !== 'Todos'
                            ? ` para ${selectedOperator}`
                            : ''}
                          .
                        </p>
                        <p className="text-xs">
                          Usa "Nuevo Contacto" o importa un Excel para comenzar.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((contact) => {
                    const dup = isDuplicate(contact)
                    const opColor = getOperatorColor(contact.operador, operators)
                    const isSelected = selectedRowId === contact.id
                    const rowCls = isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-300 dark:ring-indigo-700'
                      : dup
                        ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100/60 dark:hover:bg-orange-900/20'
                        : opColor
                          ? `${opColor.row} hover:brightness-95`
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    return (
                      <tr
                        key={contact.id}
                        className={`transition-colors group cursor-pointer select-none ${rowCls}`}
                        onClick={() =>
                          setSelectedRowId((prev) =>
                            prev === contact.id ? null : contact.id
                          )
                        }
                        onDoubleClick={() => openEdit(contact)}
                      >
                        <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(contact.id)}
                            onChange={() => toggleSelect(contact.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                opColor
                                  ? opColor.badge
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {opColor && (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${opColor.dot}`}
                                />
                              )}
                              {contact.operador}
                            </span>
                            {dup && (
                              <ExclamationTriangleIcon
                                className="w-3 h-3 text-amber-500 shrink-0"
                                title="Duplicado en candidatos GPV"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 max-w-[200px]">
                          <p className="font-semibold text-slate-900 dark:text-white truncate text-xs" title={contact.nombreColaborador}>
                            {contact.nombreColaborador}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300 max-w-[180px]">
                          <p className="text-xs truncate" title={contact.direccion ?? ''}>{contact.direccion ?? '—'}</p>
                          <p className="text-xs text-slate-400">{[contact.poblacion, contact.codigoPostal].filter(Boolean).join(' · ') || ''}</p>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">
                          {contact.telefonoContacto ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const eff = effectiveEstadoDisplay(contact)
                            return (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${eff.className}`}
                              >
                                {eff.label}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              const idx = ESTADOS_GESTION.indexOf(
                                contact.estadoGestion
                              )
                              const next =
                                ESTADOS_GESTION[
                                  (idx + 1) % ESTADOS_GESTION.length
                                ]
                              updateBackofficeContact(contact.id, {
                                estadoGestion: next
                              })
                            }}
                            title="Clic para cambiar estado"
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${ESTADO_GESTION_STYLES[contact.estadoGestion]}`}
                          >
                            {contact.estadoGestion}
                          </button>
                        </td>
                        <td className="px-3 py-2 max-w-[160px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {contact.observaciones ?? '—'}
                          </p>
                        </td>
                        <td className="px-3 py-2 max-w-[180px]">
                          {(() => {
                            const hist = contact.historialComentarios ?? []
                            if (hist.length === 0)
                              return (
                                <span className="text-xs text-slate-400 italic">
                                  —
                                </span>
                              )
                            const last = hist[0]
                            const labelColor: Record<string, string> = {
                              Backoffice:
                                'text-indigo-600 dark:text-indigo-400',
                              GPV: 'text-emerald-600 dark:text-emerald-400',
                              Observación: 'text-amber-600 dark:text-amber-400',
                              Seguimiento: 'text-teal-600 dark:text-teal-400'
                            }
                            return (
                              <div>
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span
                                    className={`text-xs font-semibold ${labelColor[last.rol] ?? ''}`}
                                  >
                                    {last.rol}
                                  </span>
                                  <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full px-1.5 font-semibold">
                                    {hist.length}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {last.contenido}
                                </p>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {contact.proximoContacto ? (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3 text-teal-500 shrink-0" />
                              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                {(() => {
                                  const p = contact.proximoContacto.split('-')
                                  return p.length === 3
                                    ? `${p[2]}/${p[1]}/${p[0].slice(2)}`
                                    : contact.proximoContacto
                                })()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => setViewContact(contact)}
                              className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-500 transition-colors"
                              title="Ver detalle"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEdit(contact)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openVisit(contact)}
                              className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 text-violet-500 transition-colors"
                              title="Programar visita"
                            >
                              <CalendarDaysIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConvert(contact)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-500 transition-colors"
                              title="Convertir a distribuidor"
                            >
                              <BuildingStorefrontIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(
                                  contact.id,
                                  contact.nombreColaborador
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
              {/* Info + selector de página */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <FunnelIcon className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {filtered.length} contacto{filtered.length !== 1 ? 's' : ''}
                  {selectedOperator !== 'Todos' && ` · ${selectedOperator}`}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>Por página:</span>
                {[10, 20, 40].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setPageSize(n)
                      setCurrentPage(1)
                    }}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      pageSize === n
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Controles de página */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                    )
                    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                        acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '…' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-xs text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`min-w-[28px] px-2 py-1 text-xs rounded font-medium transition-colors ${
                            currentPage === p
                              ? 'bg-indigo-600 text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
        )}

      </div>

      {/* Modal Formulario Premium */}
      {/* Panel Ver detalle */}
      {viewContact && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setViewContact(null)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[min(96vw,1100px)] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <EyeIcon className="w-5 h-5 text-sky-500" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">{viewContact.nombreColaborador}</h2>
                  <p className="text-xs text-slate-400">{viewContact.operador}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setViewContact(null); openEdit(viewContact) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  <PencilIcon className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => setViewContact(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Datos de contacto */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Datos de contacto</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-slate-500 text-xs">Teléfono</dt><dd className="font-medium text-slate-900 dark:text-white">{viewContact.telefonoContacto || '—'}</dd></div>
                  <div><dt className="text-slate-500 text-xs">Código postal</dt><dd className="font-medium text-slate-900 dark:text-white">{viewContact.codigoPostal || '—'}</dd></div>
                  <div className="col-span-2"><dt className="text-slate-500 text-xs">Dirección</dt><dd className="font-medium text-slate-900 dark:text-white">{viewContact.direccion || '—'}</dd></div>
                  <div><dt className="text-slate-500 text-xs">Población</dt><dd className="font-medium text-slate-900 dark:text-white">{viewContact.poblacion || '—'}</dd></div>
                </dl>
              </section>

              {/* Estado */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Estado</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-slate-500 text-xs">Estado</dt>
                    <dd>{(() => { const eff = effectiveEstadoDisplay(viewContact); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${eff.className}`}>{eff.label}</span> })()}</dd>
                  </div>
                  <div><dt className="text-slate-500 text-xs">Estado gestión</dt>
                    <dd><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_GESTION_STYLES[viewContact.estadoGestion]}`}>{viewContact.estadoGestion}</span></dd>
                  </div>
                  <div><dt className="text-slate-500 text-xs">Propone visita GPV</dt><dd className="font-medium text-slate-900 dark:text-white">{viewContact.proponeVisitaGPV ? 'Sí' : 'No'}</dd></div>
                  <div><dt className="text-slate-500 text-xs">Fecha visita</dt><dd className="font-medium text-slate-900 dark:text-white">{viewContact.fechaVisita || '—'}</dd></div>
                  {viewContact.proximoContacto && (
                    <div><dt className="text-slate-500 text-xs">Próximo contacto</dt><dd className="font-semibold text-teal-600 dark:text-teal-400">{viewContact.proximoContacto}</dd></div>
                  )}
                </dl>
              </section>

              {/* Observaciones */}
              {viewContact.observaciones && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Observaciones</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">{viewContact.observaciones}</p>
                </section>
              )}

              {/* Historial de comentarios */}
              {(viewContact.historialComentarios ?? []).length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Historial ({viewContact.historialComentarios!.length})</h3>
                  <ol className="space-y-2">
                    {viewContact.historialComentarios!.map((entry) => (
                      <li key={entry.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-1.5 rounded-full bg-indigo-200 dark:bg-indigo-700 mt-1" />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">{entry.rol}</span>
                            <span className="text-xs text-slate-400">{entry.autor}</span>
                            <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleDateString('es-ES')}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{entry.contenido}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>

            {/* Footer acciones */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <button
                onClick={() => { handleDelete(viewContact.id, viewContact.nombreColaborador); setViewContact(null) }}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                <TrashIcon className="w-4 h-4" /> Eliminar
              </button>
              <button
                onClick={() => setViewContact(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-white/90 dark:bg-slate-900/90 glass-panel rounded-[2rem] shadow-2xl w-full max-w-[min(96vw,1440px)] h-[85vh] flex flex-col overflow-hidden border border-white/20">
            <div className="flex-1 overflow-hidden p-6">
              <BackofficeContactForm
                initial={form}
                operators={operators}
                estados={ESTADOS}
                estadosGestion={ESTADOS_GESTION}
                onCancel={closeForm}
                onSubmit={async (data) => {
                  const finalData = { ...form, ...data }
                  try {
                    if (editingId) {
                      await updateBackofficeContact(
                        editingId,
                        finalData as BackofficeContactUpdates
                      )
                      toast.success('Contacto actualizado')
                    } else {
                      await addBackofficeContact(finalData as NewBackofficeContact)
                      toast.success('Contacto añadido')
                    }
                    closeForm()
                  } catch {
                    toast.error('Error al guardar el contacto')
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal Convertir a Distribuidor */}
      {convertContact && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setConvertContact(null)
          }
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <BuildingStorefrontIcon className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Convertir a Distribuidor
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Se creará un distribuidor en estado{' '}
                <span className="font-semibold">Pendiente</span> con los datos
                de:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <span className="text-slate-500">Nombre:</span>{' '}
                  <strong>{convertContact.nombreColaborador}</strong>
                </p>
                {convertContact.telefonoContacto && (
                  <p>
                    <span className="text-slate-500">Teléfono:</span>{' '}
                    {convertContact.telefonoContacto}
                  </p>
                )}
                {convertContact.poblacion && (
                  <p>
                    <span className="text-slate-500">Población:</span>{' '}
                    {convertContact.poblacion}
                  </p>
                )}
                {convertContact.direccion && (
                  <p>
                    <span className="text-slate-500">Dirección:</span>{' '}
                    {convertContact.direccion}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Tipo de canal
                </label>
                <select
                  value={convertChannelType}
                  onChange={(e) =>
                    setConvertChannelType(e.target.value as ChannelType)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="collaborator">Colaborador</option>
                  <option value="exclusive">Exclusivo</option>
                  <option value="non_exclusive">No exclusivo</option>
                  <option value="commercial">Comercial</option>
                  <option value="d2d">Door to Door</option>
                </select>
              </div>
              <p className="text-xs text-slate-400">
                El estado del contacto Backoffice pasará a{' '}
                <strong>COLABORA</strong> automáticamente.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConvertContact(null)}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleConvertToDistributor}>
                <BuildingStorefrontIcon className="w-4 h-4 mr-1.5" />
                Crear Distribuidor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Programar Visita */}
      {visitContact && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setVisitContact(null)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <ClipboardDocumentListIcon className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Programar Visita GPV
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                La visita quedará registrada en el{' '}
                <strong>módulo Visitas</strong> y la fecha se actualizará en
                este contacto.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Fecha de visita *
                </label>
                <input
                  type="date"
                  value={visitForm.date}
                  onChange={(e) =>
                    setVisitForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Tipo de visita
                </label>
                <select
                  value={visitForm.type}
                  onChange={(e) =>
                    setVisitForm((f) => ({ ...f, type: e.target.value as VisitType }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="presentacion">Presentación</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="formacion">Formación</option>
                  <option value="apertura">Apertura</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Objetivo
                </label>
                <input
                  type="text"
                  value={visitForm.objective}
                  onChange={(e) =>
                    setVisitForm((f) => ({ ...f, objective: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setVisitContact(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreateVisit}>
                <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
                Programar Visita
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default Backoffice
