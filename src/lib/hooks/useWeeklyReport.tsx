import React, { useCallback } from 'react'
import html2canvas from 'html2canvas'
import { pdf } from '@react-pdf/renderer'
import WeeklyPDFReport, {
  type WeeklyReportData
} from '../../components/reports/WeeklyPDFReport'
import { createPrefixedLogger } from '../utils/logger'

const log = createPrefixedLogger('[WeeklyReport]')

/**
 * Hook para generar reportes PDF semanales
 *
 * Captura gráficos del DOM como imágenes y genera un PDF con @react-pdf/renderer
 */
export const useWeeklyReport = () => {
  /**
   * Captura un elemento HTML como imagen base64
   */
  const captureChart = useCallback(
    async (elementId: string): Promise<string | null> => {
      const element = document.getElementById(elementId)

      if (!element) {
        log.warn(`Elemento ${elementId} no encontrado`)
        return null
      }

      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2, // Mayor calidad
          logging: false,
          useCORS: true
        })

        return canvas.toDataURL('image/png')
      } catch (error) {
        log.error(`Error capturando ${elementId}:`, error)
        return null
      }
    },
    []
  )

  /**
   * Genera y descarga el PDF del reporte semanal
   */
  const generateWeeklyPDF = useCallback(
    async (
      data: WeeklyReportData,
      chartElementIds?: {
        salesByBrand?: string
        trends?: string
        topMunicipalities?: string
      }
    ): Promise<void> => {
      try {
        // Capturar gráficos si se proporcionan IDs
        const chartImages: WeeklyReportData['chartImages'] = {}

        if (chartElementIds?.salesByBrand) {
          chartImages.salesByBrand =
            (await captureChart(chartElementIds.salesByBrand)) || undefined
        }

        if (chartElementIds?.trends) {
          chartImages.trends =
            (await captureChart(chartElementIds.trends)) || undefined
        }

        if (chartElementIds?.topMunicipalities) {
          chartImages.topMunicipalities =
            (await captureChart(chartElementIds.topMunicipalities)) || undefined
        }

        // Datos completos con imágenes
        const reportData: WeeklyReportData = {
          ...data,
          chartImages
        }

        // Generar PDF
        const pdfDocument = <WeeklyPDFReport data={reportData} />
        const blob = await pdf(pdfDocument).toBlob()

        // Descargar PDF
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `informe-semanal-${data.week}.pdf`
        link.click()

        // Limpiar
        URL.revokeObjectURL(url)
      } catch (error) {
        log.error('Error generando PDF:', error)
        throw new Error('No se pudo generar el informe PDF')
      }
    },
    [captureChart]
  )

  return {
    generateWeeklyPDF,
    captureChart
  }
}

export default useWeeklyReport
