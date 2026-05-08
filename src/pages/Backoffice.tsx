import React, { useState, useMemo, useRef } from 'react'
import {
  UserGroupIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
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
import { useAppData } from '../lib/useAppData'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
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
  BackofficeContactEstadoGestion
} from '../lib/types'

const OPERATORS = ['Carmen', 'Mirian', 'Rosa', 'Ainhoa', 'Cesar']

interface OperatorColor {
  tab: string // tab activo
  tabInactive: string
  badge: string // pill en la tabla
  dot: string // punto de color
  ring: string // ring del tab activo
  row: string // fondo sutil de fila
  card: string // borde tarjeta resumen
  avatar: string // fondo avatar
  text: string // texto avatar
}

const OPERATOR_COLORS: Record<string, OperatorColor> = {
  Carmen: {
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
  Mirian: {
    tab: 'bg-violet-500 text-white shadow-violet-200 shadow-sm',
    tabInactive: 'hover:text-violet-600 dark:hover:text-violet-400',
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    dot: 'bg-violet-500',
    ring: 'ring-violet-400',
    row: 'bg-violet-50/30 dark:bg-violet-900/5',
    card: 'border-violet-400',
    avatar: 'bg-violet-100 dark:bg-violet-900/40',
    text: 'text-violet-700 dark:text-violet-300'
  },
  Rosa: {
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
  Ainhoa: {
    tab: 'bg-amber-500 text-white shadow-amber-200 shadow-sm',
    tabInactive: 'hover:text-amber-600 dark:hover:text-amber-400',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    dot: 'bg-amber-500',
    ring: 'ring-amber-400',
    row: 'bg-amber-50/30 dark:bg-amber-900/5',
    card: 'border-amber-400',
    avatar: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300'
  },
  Cesar: {
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
  operador: OPERATORS[0],
  nombreColaborador: '',
  direccion: '',
  poblacion: '',
  codigoPostal: '',
  telefonoContacto: '',
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
    candidates,
    addDistributor,
    addVisit
  } = useAppData()

  const [selectedOperator, setSelectedOperator] = useState<string>('Todos')
  const [filterEstadoGestion, setFilterEstadoGestion] =
    useState<string>('Todos')
  const [filterPoblacion, setFilterPoblacion] = useState<string>('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('semanal')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<BackofficeContact>>(emptyForm())
  const [isImporting, setIsImporting] = useState(false)
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [newComment, setNewComment] = useState('')
  const [newCommentRol, setNewCommentRol] = useState<
    'Backoffice' | 'GPV' | 'Observación' | 'Seguimiento'
  >('Backoffice')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddComment = () => {
    const text = newComment.trim()
    if (!text) return
    const entry: BackofficeCommentEntry = {
      id: `bc-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      autor: newCommentRol,
      rol: newCommentRol,
      contenido: text
    }
    setForm((f) => ({
      ...f,
      historialComentarios: [entry, ...(f.historialComentarios ?? [])]
    }))
    setNewComment('')
  }

  // ── Modal Convertir a Distribuidor ───────────────────────────────────────────
  const [convertContact, setConvertContact] =
    useState<BackofficeContact | null>(null)
  const [convertChannelType, setConvertChannelType] =
    useState<string>('collaborator')

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
        channelType: convertChannelType as any,
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
    type: 'seguimiento',
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
        type: visitForm.type as any,
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

  const allOperators = ['Todos', ...OPERATORS]

  const filtered = useMemo(() => {
    setCurrentPage(1)
    setSelectedRowId(null)
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
      duplicados: base.filter(isDuplicate).length,
      porEstado: ESTADOS_GESTION.reduce(
        (acc, s) => {
          acc[s] = base.filter((c) => c.estadoGestion === s).length
          return acc
        },
        {} as Record<BackofficeContactEstadoGestion, number>
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backofficeContacts, selectedOperator, candidateNames])

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
      operador: selectedOperator === 'Todos' ? OPERATORS[0] : selectedOperator
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombreColaborador?.trim()) {
      toast.error('El nombre del colaborador es obligatorio')
      return
    }
    try {
      if (editingId) {
        await updateBackofficeContact(editingId, form)
        toast.success('Contacto actualizado')
      } else {
        await addBackofficeContact(form as NewBackofficeContact)
        toast.success('Contacto añadido')
      }
      closeForm()
    } catch {
      toast.error('Error al guardar el contacto')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    await deleteBackofficeContact(id)
    toast.success('Contacto eliminado')
  }

  // ── Exportar Excel ───────────────────────────────────────────────────────────

  const handleExportExcel = () => {
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

    const ws = XLSX.utils.json_to_sheet(data)

    // Marcar duplicados en naranja (columna N = índice 13)
    filtered.forEach((c, idx) => {
      if (isDuplicate(c)) {
        const row = idx + 2
        for (let col = 0; col < 14; col++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row - 1, c: col })
          if (!ws[cellAddr]) ws[cellAddr] = { v: '' }
          ws[cellAddr].s = { fill: { fgColor: { rgb: 'FFEDD5' } } }
        }
      }
    })

    const wb = XLSX.utils.book_new()
    const sheetName =
      selectedOperator === 'Todos'
        ? 'Backoffice_Todos'
        : `Backoffice_${selectedOperator}`
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${sheetName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('Excel exportado correctamente')
  }

  // ── Importar Excel ───────────────────────────────────────────────────────────

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<
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
    }
    reader.readAsBinaryString(file)
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
    } catch (err: any) {
      toast.error(`Error al generar PDF: ${err?.message ?? String(err)}`)
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

    // ── PÁGINA 1: Portada + Resumen ejecutivo ────────────────────────────────

    // Título principal
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 50)
    doc.text('Informe Backoffice', ML, 24)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2])
    doc.text(`— ${label}`, ML + doc.getTextWidth('Informe Backoffice') + 2, 24)

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
        label: 'Duplicados (candidatos)',
        value: String(stats.duplicados),
        color: ORANGE_KPI
      }
    ]
    const kpiW = (pageW - ML - MR - 9) / 4
    kpis.forEach((kpi, i) => {
      const x = ML + i * (kpiW + 3)
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
      doc.roundedRect(x, 47, kpiW, 24, 2, 2, 'F')
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(kpi.value, x + kpiW / 2, 60, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(kpi.label, x + kpiW / 2, 67, { align: 'center' })
    })
    doc.setTextColor(0, 0, 0)

    // Tabla distribución estado gestión (columna izquierda)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 50)
    doc.text('Distribución por Estado de Gestión', ML, 80)
    autoTable(doc, {
      startY: 83,
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
      didParseCell: (data: any) => {
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

    // Tabla resumen por operador (columna derecha, solo si "Todos")
    if (selectedOperator === 'Todos') {
      const activeOps = OPERATORS.filter((op) =>
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
        ? OPERATORS.filter((op) =>
            backofficeContacts.some((c) => c.operador === op)
          )
        : [selectedOperator]

    doc.addPage()
    let currentY = 18
    let lastTableFinalY: number | null = null

    for (const op of groups) {
      const contacts = backofficeContacts.filter((c) => c.operador === op)
      if (!contacts.length) continue

      if (currentY > pageH - 45) {
        doc.addPage()
        currentY = 18
      }

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
        const historial = c.historialComentarios ?? []
        const last = historial.length > 0 ? historial[0] : null
        const lastTxt = last
          ? `[${last.rol}] ${last.contenido}`.substring(0, 55) +
            (last.contenido.length > 55 ? '…' : '')
          : (c.ultimosComentarios ?? '').substring(0, 55) +
            ((c.ultimosComentarios?.length ?? 0) > 55 ? '…' : '')

        return [
          c.nombreColaborador,
          c.poblacion ?? '-',
          c.telefonoContacto ?? '-',
          c.estado,
          c.estadoGestion,
          c.proponeVisitaGPV ? 'Sí' : 'No',
          fmtDate(c.fechaVisita),
          lastTxt || '-'
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
            'Último Comentario'
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
          7: { cellWidth: 'auto' }
        },
        didParseCell: (data: any) => {
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
        margin: { left: ML, right: MR, top: 18 }
      })
      lastTableFinalY = (doc as any).lastAutoTable.finalY as number
      currentY = lastTableFinalY + 10
    }

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

    const totalPages = (doc as any).internal.getNumberOfPages()
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
    <PageContainer size="wide">
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
          {OPERATORS.map((op) => {
            const c = OPERATOR_COLORS[op]
            const total = backofficeContacts.filter(
              (x) => x.operador === op
            ).length
            const firmados = backofficeContacts.filter(
              (x) => x.operador === op && x.estadoGestion === 'Firmado'
            ).length
            const pendientes = backofficeContacts.filter(
              (x) => x.operador === op && x.estadoGestion === 'Pendiente'
            ).length
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
            const colors = OPERATOR_COLORS[op]
            const isActive = selectedOperator === op
            const count =
              op !== 'Todos'
                ? backofficeContacts.filter((c) => c.operador === op).length
                : null
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
                    (
                    {
                      backofficeContacts.filter(
                        (c) =>
                          c.estadoGestion === s &&
                          (selectedOperator === 'Todos' ||
                            c.operador === selectedOperator)
                      ).length
                    }
                    )
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
          </div>
        </div>

        {/* Tabla */}
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
                        className={`px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${cx ?? ''}`}
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
                        className={`px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap ${cx ?? ''}`}
                      >
                        {children}
                      </th>
                    )
                    return (
                      <>
                        <SortTh col="operador">Operador</SortTh>
                        <SortTh col="nombreColaborador">
                          Nombre Colaborador
                        </SortTh>
                        <SortTh col="poblacion">Dirección / Población</SortTh>
                        <PlainTh>CP</PlainTh>
                        <PlainTh>Teléfono</PlainTh>
                        <PlainTh>Estado gestor</PlainTh>
                        <SortTh col="estadoGestion">Estado gestión GPV</SortTh>
                      </>
                    )
                  })()}
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[180px]">
                    Observaciones
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[220px]">
                    Últimos Comentarios
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap text-center">
                    Propone Visita GPV
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Fecha Visita
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Visitas
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Seguimiento / Próx.
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
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
                    const opColor = OPERATOR_COLORS[contact.operador]
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                                className="w-3.5 h-3.5 text-amber-500 shrink-0"
                                title="Duplicado en candidatos GPV"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {contact.nombreColaborador}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <div>{contact.direccion ?? '-'}</div>
                          {contact.poblacion && (
                            <div className="text-xs text-slate-400">
                              {contact.poblacion}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {contact.codigoPostal ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {contact.telefonoContacto ?? '-'}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {contact.observaciones ?? '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
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
                        <td className="px-4 py-3 text-center">
                          {contact.proponeVisitaGPV ? (
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                          {contact.fechaVisita ?? '-'}
                        </td>
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {contact.visitas ?? '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <div className="space-y-1">
                            {contact.proximoContacto && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 text-teal-500 shrink-0" />
                                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                                  {(() => {
                                    const p = contact.proximoContacto.split('-')
                                    return p.length === 3
                                      ? `${p[2]}/${p[1]}/${p[0].slice(2)}`
                                      : contact.proximoContacto
                                  })()}
                                </span>
                              </div>
                            )}
                            {(() => {
                              const sgs = (
                                contact.historialComentarios ?? []
                              ).filter((e) => e.rol === 'Seguimiento')
                              if (sgs.length === 0)
                                return !contact.proximoContacto ? (
                                  <span className="text-xs text-slate-400 italic">
                                    —
                                  </span>
                                ) : null
                              return (
                                <div>
                                  <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded px-1.5 py-0.5 font-semibold">
                                    {sgs.length} seguim.
                                  </span>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                    {sgs[0].contenido}
                                  </p>
                                </div>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {form.operador && OPERATOR_COLORS[form.operador] && (
                  <span
                    className={`w-3 h-3 rounded-full ${OPERATOR_COLORS[form.operador].dot}`}
                  />
                )}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Editar Contacto' : 'Nuevo Contacto Backoffice'}
                </h2>
                {editingId && form.nombreColaborador && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    — {form.nombreColaborador}
                  </span>
                )}
              </div>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body: two columns */}
            <div className="flex flex-1 min-h-0">
              {/* Left column: contact fields */}
              <form
                onSubmit={handleSubmit}
                className="w-[55%] border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-6 flex flex-col gap-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Operador */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Operador *
                    </label>
                    <select
                      value={form.operador ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, operador: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      {OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombre Colaborador */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Nombre Colaborador *
                    </label>
                    <input
                      type="text"
                      value={form.nombreColaborador ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nombreColaborador: e.target.value
                        }))
                      }
                      placeholder="Nombre del negocio o persona"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Dirección */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={form.direccion ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, direccion: e.target.value }))
                      }
                      placeholder="Calle, número..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Población */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Población
                    </label>
                    <input
                      type="text"
                      value={form.poblacion ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, poblacion: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Código Postal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={form.codigoPostal ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, codigoPostal: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Teléfono Contacto
                    </label>
                    <input
                      type="tel"
                      value={form.telefonoContacto ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          telefonoContacto: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Estado
                    </label>
                    <select
                      value={form.estado ?? 'PENDIENTE DE RESPUESTA'}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          estado: e.target.value as BackofficeContactEstado
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {ESTADOS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado gestión GPV */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Estado Gestión GPV
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ESTADOS_GESTION.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setForm((f) => {
                              if (f.estadoGestion === s) return f
                              const entry: BackofficeCommentEntry = {
                                id: `bc-sys-${Date.now().toString(36)}`,
                                timestamp: new Date().toISOString(),
                                autor: 'Sistema',
                                rol: 'Sistema',
                                contenido: `Estado de gestión → ${s}`
                              }
                              return {
                                ...f,
                                estadoGestion: s,
                                historialComentarios: [
                                  entry,
                                  ...(f.historialComentarios ?? [])
                                ]
                              }
                            })
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            form.estadoGestion === s
                              ? `${ESTADO_GESTION_STYLES[s]} border-transparent ring-2 ring-offset-1 ring-indigo-400`
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Propone visita GPV */}
                  <div className="flex items-center gap-3">
                    <input
                      id="proponeVisita"
                      type="checkbox"
                      checked={form.proponeVisitaGPV ?? false}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          proponeVisitaGPV: e.target.checked
                        }))
                      }
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="proponeVisita"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Propone Visita GPV
                    </label>
                  </div>

                  {/* Fecha Visita */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Fecha Visita
                    </label>
                    <input
                      type="date"
                      value={form.fechaVisita ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fechaVisita: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Próximo Contacto */}
                  <div>
                    <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">
                      Próximo Contacto
                    </label>
                    <input
                      type="date"
                      value={form.proximoContacto ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          proximoContacto: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Observaciones
                    </label>
                    <textarea
                      rows={2}
                      value={form.observaciones ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          observaciones: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Visitas */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                      Visitas realizadas
                    </label>
                    <input
                      type="text"
                      value={form.visitas ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, visitas: e.target.value }))
                      }
                      placeholder="Nº de visitas o descripción breve"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <Button type="button" variant="secondary" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary">
                    {editingId ? 'Guardar Cambios' : 'Añadir Contacto'}
                  </Button>
                </div>
              </form>

              {/* Right column: comment history */}
              <div className="w-[45%] flex flex-col min-h-0">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-indigo-400" />
                    Historial de Comentarios
                    <span className="ml-auto text-xs text-slate-400 font-normal">
                      {(form.historialComentarios ?? []).length} entradas
                    </span>
                  </h3>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(form.historialComentarios ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-600 py-8">
                      <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">Sin comentarios aún</p>
                      <p className="text-xs mt-1">Añade el primero abajo</p>
                    </div>
                  ) : (
                    [...(form.historialComentarios ?? [])]
                      .reverse()
                      .map((entry) => {
                        const rolCfg: Record<
                          string,
                          {
                            badge: string
                            label: string
                            abbr: string
                            left: string
                          }
                        > = {
                          Backoffice: {
                            badge:
                              'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
                            label: 'text-indigo-600 dark:text-indigo-400',
                            abbr: 'BO',
                            left: 'border-l-indigo-400'
                          },
                          GPV: {
                            badge:
                              'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                            label: 'text-emerald-600 dark:text-emerald-400',
                            abbr: 'GP',
                            left: 'border-l-emerald-400'
                          },
                          Observación: {
                            badge:
                              'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                            label: 'text-amber-600 dark:text-amber-400',
                            abbr: 'OB',
                            left: 'border-l-amber-400'
                          },
                          Seguimiento: {
                            badge:
                              'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
                            label: 'text-teal-600 dark:text-teal-400',
                            abbr: 'SG',
                            left: 'border-l-teal-400'
                          },
                          Sistema: {
                            badge:
                              'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                            label: 'text-slate-500 dark:text-slate-400',
                            abbr: 'SI',
                            left: 'border-l-slate-300 dark:border-l-slate-600'
                          }
                        }
                        const cfg = rolCfg[entry.rol] ?? rolCfg['Backoffice']
                        return (
                          <div
                            key={entry.id}
                            className={`flex gap-3 group pl-2 border-l-2 ${cfg.left}`}
                          >
                            <div className="shrink-0 mt-0.5">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${cfg.badge}`}
                              >
                                {cfg.abbr}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className={`text-xs font-semibold ${cfg.label}`}
                                >
                                  {entry.rol}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(entry.timestamp).toLocaleString(
                                    'es-ES',
                                    {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                {entry.contenido}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  historialComentarios: (
                                    f.historialComentarios ?? []
                                  ).filter((e) => e.id !== entry.id)
                                }))
                              }
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                              title="Eliminar entrada"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })
                  )}
                </div>

                {/* Add comment */}
                <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Tipo de entrada
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        'Backoffice',
                        'GPV',
                        'Observación',
                        'Seguimiento'
                      ] as const
                    ).map((rol) => {
                      const activeClass = {
                        Backoffice:
                          'bg-indigo-600 text-white border-indigo-600',
                        GPV: 'bg-emerald-600 text-white border-emerald-600',
                        Observación: 'bg-amber-500 text-white border-amber-500',
                        Seguimiento: 'bg-teal-600 text-white border-teal-600'
                      }[rol]
                      const dotClass = {
                        Backoffice: 'bg-indigo-400',
                        GPV: 'bg-emerald-400',
                        Observación: 'bg-amber-400',
                        Seguimiento: 'bg-teal-400'
                      }[rol]
                      return (
                        <button
                          key={rol}
                          type="button"
                          onClick={() => setNewCommentRol(rol)}
                          className={`py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                            newCommentRol === rol
                              ? activeClass
                              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${newCommentRol === rol ? 'bg-white/70' : dotClass}`}
                          />
                          {rol}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                    placeholder={`Escribe una nota de ${newCommentRol}… (Ctrl+Enter)`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className={`w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors ${
                      newCommentRol === 'Backoffice'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : newCommentRol === 'GPV'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : newCommentRol === 'Observación'
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    Añadir como {newCommentRol}
                  </button>
                </div>
              </div>
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
                  onChange={(e) => setConvertChannelType(e.target.value)}
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
                    setVisitForm((f) => ({ ...f, type: e.target.value }))
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
