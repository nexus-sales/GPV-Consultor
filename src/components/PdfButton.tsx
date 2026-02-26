import React from 'react'
import jsPDF from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'

type PdfButtonProps = {
  rows: RowInput[]
  fileName?: string
  title?: string
  className?: string
  disabled?: boolean
  headers?: string[]
  children?: React.ReactNode
  onError?: (error: Error) => void
}

const DEFAULT_HEADERS = [
  'Fecha',
  'Nombre',
  'Tipo',
  'Municipio',
  'Estado',
  'Próximos pasos'
]

export const PdfButton: React.FC<PdfButtonProps> = ({
  rows,
  fileName = 'informe-semanal.pdf',
  title = 'Informe semanal – GPV Canarias',
  className,
  disabled = false,
  headers = DEFAULT_HEADERS,
  children = 'Descargar PDF semanal',
  onError
}) => {
  const handleDownload = (): void => {
    try {
      if (!rows.length) return

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })

      doc.setFontSize(16)
      doc.text(title, 40, 40)

      doc.setFontSize(10)
      doc.text(new Date().toLocaleString('es-ES'), 40, 60)

      autoTable(doc, {
        startY: 80,
        head: [headers],
        body: rows,
        styles: {
          fontSize: 8,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { top: 80, right: 40, bottom: 40, left: 40 }
      })

      doc.save(fileName)
    } catch (error) {
      if (onError) {
        const parsedError =
          error instanceof Error ? error : new Error(String(error))
        onError(parsedError)
      }
    }
  }

  const buttonClassName =
    className ??
    'rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100'

  return (
    <button
      className={buttonClassName}
      onClick={handleDownload}
      disabled={disabled || !rows.length}
      type="button"
      aria-label={`Descargar ${fileName}`}
      title={disabled ? 'No hay datos para exportar' : `Descargar ${fileName}`}
    >
      {children}
    </button>
  )
}

export default PdfButton
