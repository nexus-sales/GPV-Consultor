import React, { useState, useMemo } from 'react'
import {
  UserGroupIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
// import { generateId } from '../lib/data/helpers'
import type { Candidate, NewCandidate, Visit, NoteEntry } from '../lib/types'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const OPERATORS = ['Carmen', 'Mirian', 'Rosa', 'Ainhoa', 'Cesar']

const Backoffice: React.FC = () => {
  const { candidates, addCandidate, updateCandidate, visits, addVisit } = useAppData()
  const [selectedOperator, setSelectedOperator] = useState<string>(OPERATORS[0])
  const [isImporting, setIsImporting] = useState(false)

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => c.operator === selectedOperator)
  }, [candidates, selectedOperator])

  const stats = useMemo(() => {
    const total = filteredCandidates.length
    const withProposal = filteredCandidates.filter(c => c.gpvProposal).length
    const collaborating = filteredCandidates.filter(c => c.stage === 'approved').length
    return { total, withProposal, collaborating }
  }, [filteredCandidates])

  const handleExportExcel = () => {
    const data = filteredCandidates.map(c => {
      const lastVisit = visits.find(v => v.candidateId === c.id)
      return {
        'OPERADOR': c.operator,
        'NOMBRE COLABORADOR': c.name,
        'DIRECCIÓN': c.address || '',
        'POBLACIÓN': c.city || '',
        'CODIGO POSTAL': c.postalCode || '',
        'CONTACTO': c.contact?.name || '',
        'ESTADO': c.stage,
        'OBSERVACIONES': c.notes || '',
        'ULTIMOS COMENTARIOS': c.notesHistory?.[0]?.content || '',
        'PROPUESTA GPV': c.gpvProposal ? 'SI' : 'NO',
        'FECHA VISITA': lastVisit?.date || '',
        'VISITAS': lastVisit?.summary || '',
        'SEGUIMIENTO': lastVisit?.nextSteps || ''
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Backoffice_${selectedOperator}`)
    XLSX.writeFile(wb, `Backoffice_${selectedOperator}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('Excel exportado correctamente')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const title = `Informe Semanal Backoffice: ${selectedOperator}`
    
    doc.setFontSize(18)
    doc.text(title, 14, 22)
    doc.setFontSize(11)
    doc.text(`Fecha: ${format(new Date(), 'dd MMMM yyyy', { locale: es })}`, 14, 30)

    const tableData = filteredCandidates.map(c => [
      c.name,
      c.city || '-',
      c.stage,
      c.gpvProposal ? 'SI' : 'NO',
      c.notesHistory?.[0]?.content.substring(0, 50) || '-'
    ])

    ;(doc as any).autoTable({
      startY: 40,
      head: [['Nombre', 'Población', 'Estado', 'Propuesta', 'Últ. Comentario']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    })

    doc.save(`Informe_${selectedOperator}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    toast.success('PDF exportado correctamente')
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        let importedCount = 0
        for (const row of rows) {
          const operator = row['OPERADOR'] || selectedOperator
          const name = row['NOMBRE COLABORADOR'] || row['Nombre']
          if (!name) continue

          // Buscar si ya existe
          const existing = candidates.find(c => c.name.toLowerCase() === name.toLowerCase())

          const candidateData: Partial<Candidate> = {
            name,
            operator,
            address: row['DIRECCIÓN'] || row['Dirección'],
            city: row['POBLACIÓN'] || row['Población'],
            postalCode: row['CODIGO POSTAL'] || row['CP'],
            contact: {
              name: row['CONTACTO'] || '',
              phone: '',
              email: ''
            },
            notes: row['OBSERVACIONES'] || '',
            gpvProposal: row['PROPUESTA GPV'] === 'SI' || row['Propuesta'] === 'SI',
            stage: row['ESTADO'] === 'COLABORA' ? 'approved' : row['ESTADO'] === 'NO COLABORA' ? 'rejected' : 'evaluation'
          }

          if (existing) {
            await updateCandidate(existing.id, candidateData)
          } else {
            await addCandidate(candidateData as NewCandidate)
          }

          // Si hay datos de visita
          const visitDate = row['Fecha visita'] || row['FECHA VISITA']
          if (visitDate) {
            const newVisit: Partial<Visit> = {
              candidateId: existing?.id || 'new', // Esto se arreglará tras creación real si es nuevo, pero para el mock vale
              date: format(new Date(visitDate), 'yyyy-MM-dd'),
              summary: row['VISITAS'] || '',
              nextSteps: row['Seguimiento'] || '',
              type: 'seguimiento',
              result: 'completada'
            }
            // Aquí idealmente esperaríamos al ID real si es nuevo. 
            // En este sistema simplificado, lo añadimos.
            if (existing) {
              await addVisit(newVisit)
            }
          }

          importedCount++
        }

        toast.success(`Se han procesado ${importedCount} registros`)
      } catch (error) {
        console.error(error)
        toast.error('Error al procesar el archivo Excel')
      } finally {
        setIsImporting(false)
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <UserGroupIcon className="w-8 h-8 text-indigo-500" />
              Módulo Backoffice
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gestión y reporte semanal de candidatos por operadora.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="file"
                id="excel-import"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                disabled={isImporting}
              />
              <Button 
                variant="secondary" 
                onClick={() => document.getElementById('excel-import')?.click()}
                className="bg-white dark:bg-slate-800"
              >
                <ArrowUpTrayIcon className="w-5 h-5 mr-2 text-green-500" />
                Importar Excel
              </Button>
            </div>
            
            <Button onClick={handleExportExcel} variant="secondary" className="bg-white dark:bg-slate-800">
              <TableCellsIcon className="w-5 h-5 mr-2 text-emerald-500" />
              Exportar Excel
            </Button>

            <Button onClick={handleExportPDF} variant="primary">
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Informe PDF
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Candidatos
                </p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.total}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                <UserGroupIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Propuestas GPV
                </p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.withProposal}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  En Colaboración
                </p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.collaborating}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                <ShoppingBagIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Operator Selector Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
          {OPERATORS.map(op => (
            <button
              key={op}
              onClick={() => setSelectedOperator(op)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                selectedOperator === op
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        {/* Main List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Colaborador</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Ubicación</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Propuesta GPV</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Último Comentario</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <ClockIcon className="w-10 h-10 opacity-20" />
                        <p>No hay candidatos registrados para {selectedOperator}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map(candidate => (
                    <tr key={candidate.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{candidate.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <PhoneIcon className="w-3 h-3" />
                          {candidate.contact?.phone || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4 text-slate-400" />
                          {candidate.city}, {candidate.province}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          candidate.stage === 'approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : candidate.stage === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {candidate.stage === 'approved' ? 'Colabora' : candidate.stage === 'rejected' ? 'No Colabora' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {candidate.gpvProposal ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircleIcon className="w-5 h-5" /> SI
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-600 font-medium">
                            <XCircleIcon className="w-5 h-5" /> NO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-xs">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                            {candidate.notesHistory?.[0]?.content || candidate.notes || 'Sin comentarios registrados'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}

export default Backoffice
