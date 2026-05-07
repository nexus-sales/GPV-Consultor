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
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns'
import { es } from 'date-fns/locale'
import type { BackofficeContact, NewBackofficeContact, BackofficeContactEstado } from '../lib/types'

const OPERATORS = ['Carmen', 'Mirian', 'Rosa', 'Ainhoa', 'Cesar']

const ESTADOS: BackofficeContactEstado[] = [
  'COLABORA',
  'NO COLABORA',
  'PENDIENTE DE RESPUESTA',
  'ENVIADO CORREO'
]

const ESTADO_STYLES: Record<BackofficeContactEstado, string> = {
  'COLABORA': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'NO COLABORA': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'PENDIENTE DE RESPUESTA': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'ENVIADO CORREO': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
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
  observaciones: '',
  ultimosComentarios: '',
  proponeVisitaGPV: false,
  fechaVisita: '',
  visitas: '',
  seguimiento: ''
})

const Backoffice: React.FC = () => {
  const {
    backofficeContacts,
    addBackofficeContact,
    updateBackofficeContact,
    deleteBackofficeContact,
    candidates
  } = useAppData()

  const [selectedOperator, setSelectedOperator] = useState<string>('Todos')
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('semanal')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<BackofficeContact>>(emptyForm())
  const [isImporting, setIsImporting] = useState(false)
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Nombres de candidatos para detección de duplicados (normalizado)
  const candidateNames = useMemo(
    () => new Set(candidates.map((c) => c.name.toLowerCase().trim())),
    [candidates]
  )

  const isDuplicate = (contact: BackofficeContact) =>
    candidateNames.has(contact.nombreColaborador.toLowerCase().trim())

  const allOperators = ['Todos', ...OPERATORS]

  const filtered = useMemo(() => {
    if (selectedOperator === 'Todos') return backofficeContacts
    return backofficeContacts.filter((c) => c.operador === selectedOperator)
  }, [backofficeContacts, selectedOperator])

  const stats = useMemo(() => {
    const base = selectedOperator === 'Todos' ? backofficeContacts : filtered
    return {
      total: base.length,
      colabora: base.filter((c) => c.estado === 'COLABORA').length,
      proponeVisita: base.filter((c) => c.proponeVisitaGPV).length,
      duplicados: base.filter(isDuplicate).length
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backofficeContacts, filtered, selectedOperator, candidateNames])

  // ── Formulario ──────────────────────────────────────────────────────────────

  const openNew = () => {
    setForm({ ...emptyForm(), operador: selectedOperator === 'Todos' ? OPERATORS[0] : selectedOperator })
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
      'OPERADOR': c.operador,
      'NOMBRE COLABORADOR': c.nombreColaborador,
      'DIRECCIÓN': c.direccion ?? '',
      'POBLACION': c.poblacion ?? '',
      'CODIGO POSTAL': c.codigoPostal ?? '',
      'TELEFONO CONTACTO': c.telefonoContacto ?? '',
      'ESTADO': c.estado,
      'OBSERVACIONES': c.observaciones ?? '',
      'ULTIMOS COMENTARIOS': c.ultimosComentarios ?? '',
      'PROPONE VISITA GPV (S/NO)': c.proponeVisitaGPV ? 'S' : 'NO',
      'Fecha visita': c.fechaVisita ?? '',
      'VISITAS': c.visitas ?? '',
      'Seguimiento': c.seguimiento ?? '',
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
    const sheetName = selectedOperator === 'Todos' ? 'Backoffice_Todos' : `Backoffice_${selectedOperator}`
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
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
        let count = 0
        for (const row of rows) {
          const nombre = String(row['NOMBRE COLABORADOR'] ?? row['Nombre Colaborador'] ?? '').trim()
          if (!nombre) continue
          const existing = backofficeContacts.find(
            (c) => c.nombreColaborador.toLowerCase() === nombre.toLowerCase()
          )
          const payload: NewBackofficeContact = {
            operador: String(row['OPERADOR'] ?? selectedOperator),
            nombreColaborador: nombre,
            direccion: row['DIRECCIÓN'] ? String(row['DIRECCIÓN']) : undefined,
            poblacion: row['POBLACION'] ? String(row['POBLACION']) : undefined,
            codigoPostal: row['CODIGO POSTAL'] ? String(row['CODIGO POSTAL']) : undefined,
            telefonoContacto: row['TELEFONO CONTACTO'] ? String(row['TELEFONO CONTACTO']) : undefined,
            estado: (String(row['ESTADO'] ?? 'PENDIENTE DE RESPUESTA')) as BackofficeContactEstado,
            observaciones: row['OBSERVACIONES'] ? String(row['OBSERVACIONES']) : undefined,
            ultimosComentarios: row['ULTIMOS COMENTARIOS'] ? String(row['ULTIMOS COMENTARIOS']) : undefined,
            proponeVisitaGPV: String(row['PROPONE VISITA GPV (S/NO)'] ?? '').toUpperCase() === 'S',
            fechaVisita: row['Fecha visita'] ? String(row['Fecha visita']) : undefined,
            visitas: row['VISITAS'] ? String(row['VISITAS']) : undefined,
            seguimiento: row['Seguimiento'] ? String(row['Seguimiento']) : undefined
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
    const { label, start, end } = getPeriodRange()
    const operadorLabel = selectedOperator === 'Todos' ? 'Todos los Operadores' : selectedOperator
    const doc = new jsPDF({ orientation: 'landscape' })

    // Cabecera
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`Informe Backoffice – ${label}`, 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Operador: ${operadorLabel}`, 14, 26)
    doc.text(
      `Período: ${format(start, 'dd/MM/yyyy')} – ${format(end, 'dd/MM/yyyy')}`,
      14, 32
    )
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 38)

    // Resumen
    const resumen = [
      ['Total contactos', String(stats.total)],
      ['En colaboración', String(stats.colabora)],
      ['Proponen visita GPV', String(stats.proponeVisita)],
      ['Duplicados en candidatos', String(stats.duplicados)]
    ]
    ;(doc as any).autoTable({
      startY: 44,
      head: [['Métrica', 'Valor']],
      body: resumen,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 30 } },
      margin: { left: 14 }
    })

    // Tabla de contactos agrupados por operador
    const groups = selectedOperator === 'Todos'
      ? OPERATORS.filter((op) => backofficeContacts.some((c) => c.operador === op))
      : [selectedOperator]

    let currentY = (doc as any).lastAutoTable.finalY + 10

    for (const op of groups) {
      const contacts = backofficeContacts.filter((c) => c.operador === op)
      if (!contacts.length) continue

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`Operador: ${op} (${contacts.length} contactos)`, 14, currentY)
      currentY += 4

      const rows = contacts.map((c) => [
        c.nombreColaborador,
        c.poblacion ?? '-',
        c.telefonoContacto ?? '-',
        c.estado,
        c.proponeVisitaGPV ? 'S' : 'NO',
        c.fechaVisita ?? '-',
        (c.ultimosComentarios ?? '').substring(0, 60) + ((c.ultimosComentarios?.length ?? 0) > 60 ? '…' : '')
      ])

      ;(doc as any).autoTable({
        startY: currentY,
        head: [['Colaborador', 'Población', 'Teléfono', 'Estado', 'Visita GPV', 'Fecha Visita', 'Últimos Comentarios']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        didParseCell: (data: any) => {
          const contact = contacts[data.row.index]
          if (data.section === 'body' && contact && isDuplicate(contact)) {
            data.cell.styles.fillColor = [255, 237, 213]
          }
        },
        margin: { left: 14, right: 14 }
      })
      currentY = (doc as any).lastAutoTable.finalY + 8

      if (currentY > 180 && op !== groups[groups.length - 1]) {
        doc.addPage()
        currentY = 14
      }
    }

    // Leyenda duplicados
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(180, 100, 0)
    doc.text('* Filas en naranja: contacto duplicado en la lista de Candidatos GPV', 14, doc.internal.pageSize.height - 8)

    const fileName = `Informe_Backoffice_${label}_${operadorLabel}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(fileName)
    toast.success('Informe PDF generado')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const periodLabels: Record<ReportPeriod, string> = {
    semanal: 'Semanal',
    mensual: 'Mensual',
    trimestral: 'Trimestral'
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <UserGroupIcon className="w-8 h-8 text-indigo-500" />
              Módulo Backoffice
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Seguimiento de contactos propuestos por los gestores de cuenta para captación de distribuidores.
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
                        onClick={() => { setReportPeriod(p); setShowPeriodMenu(false) }}
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
            { label: 'Total Contactos', value: stats.total, color: 'indigo', Icon: UserGroupIcon },
            { label: 'En Colaboración', value: stats.colabora, color: 'emerald', Icon: CheckCircleIcon },
            { label: 'Proponen Visita GPV', value: stats.proponeVisita, color: 'violet', Icon: CalendarDaysIcon },
            { label: 'Duplicados en Candidatos', value: stats.duplicados, color: 'amber', Icon: ExclamationTriangleIcon }
          ].map(({ label, value, color, Icon }) => (
            <Card key={label} className={`p-5 border-l-4 border-${color}-500`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`p-2.5 bg-${color}-50 dark:bg-${color}-900/30 rounded-xl`}>
                  <Icon className={`w-7 h-7 text-${color}-600 dark:text-${color}-400`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Nota duplicados */}
        {stats.duplicados > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
            <span>
              <strong>{stats.duplicados} contactos</strong> coinciden con nombres de candidatos en el listado GPV.
              Se marcan en <span className="font-semibold text-orange-600">naranja</span> en la tabla.
            </span>
          </div>
        )}

        {/* Tabs de operador */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl flex-wrap">
          {allOperators.map((op) => (
            <button
              key={op}
              onClick={() => setSelectedOperator(op)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                selectedOperator === op
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {op}
              {op !== 'Todos' && (
                <span className="ml-1.5 text-xs text-slate-400">
                  ({backofficeContacts.filter((c) => c.operador === op).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Operador</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Nombre Colaborador</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Dirección / Población</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">CP</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Teléfono</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[180px]">Observaciones</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[220px]">Últimos Comentarios</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap text-center">Propone Visita GPV</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Fecha Visita</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Visitas</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Seguimiento</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-14 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <ClockIcon className="w-10 h-10 opacity-20" />
                        <p>No hay contactos registrados{selectedOperator !== 'Todos' ? ` para ${selectedOperator}` : ''}.</p>
                        <p className="text-xs">Usa "Nuevo Contacto" o importa un Excel para comenzar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((contact) => {
                    const dup = isDuplicate(contact)
                    const rowCls = dup
                      ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100/60 dark:hover:bg-orange-900/20'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    return (
                      <tr key={contact.id} className={`transition-colors group ${rowCls}`}>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {contact.operador}
                          </span>
                          {dup && (
                            <span title="Duplicado en candidatos GPV" className="ml-1 inline-flex items-center">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {contact.nombreColaborador}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <div>{contact.direccion ?? '-'}</div>
                          {contact.poblacion && (
                            <div className="text-xs text-slate-400">{contact.poblacion}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {contact.codigoPostal ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {contact.telefonoContacto ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ESTADO_STYLES[contact.estado]}`}>
                            {contact.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {contact.observaciones ?? '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 italic">
                            {contact.ultimosComentarios ?? '-'}
                          </p>
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
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {contact.seguimiento ?? '-'}
                          </p>
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
                              onClick={() => handleDelete(contact.id, contact.nombreColaborador)}
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
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <FunnelIcon className="w-3.5 h-3.5" />
              Mostrando {filtered.length} contacto{filtered.length !== 1 ? 's' : ''}
              {selectedOperator !== 'Todos' && ` de ${selectedOperator}`}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Contacto' : 'Nuevo Contacto Backoffice'}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Operador */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Operador *
                </label>
                <select
                  value={form.operador ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, operador: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>{op}</option>
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
                  onChange={(e) => setForm((f) => ({ ...f, nombreColaborador: e.target.value }))}
                  placeholder="Nombre del negocio o persona"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.direccion ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, poblacion: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, codigoPostal: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, telefonoContacto: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as BackofficeContactEstado }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Propone visita GPV */}
              <div className="flex items-center gap-3 mt-1">
                <input
                  id="proponeVisita"
                  type="checkbox"
                  checked={form.proponeVisitaGPV ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, proponeVisitaGPV: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="proponeVisita" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Propone Visita GPV (S/NO)
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
                  onChange={(e) => setForm((f) => ({ ...f, fechaVisita: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={form.observaciones ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Últimos Comentarios */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Últimos Comentarios
                </label>
                <textarea
                  rows={4}
                  value={form.ultimosComentarios ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, ultimosComentarios: e.target.value }))}
                  placeholder="Registro cronológico de contactos y novedades..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              {/* Visitas */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Visitas
                </label>
                <input
                  type="text"
                  value={form.visitas ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, visitas: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Seguimiento */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Seguimiento
                </label>
                <input
                  type="text"
                  value={form.seguimiento ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, seguimiento: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Botones */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Guardar Cambios' : 'Añadir Contacto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default Backoffice
