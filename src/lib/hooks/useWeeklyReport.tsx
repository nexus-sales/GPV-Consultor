import React, { useCallback } from 'react'
import { createPrefixedLogger } from '../utils/logger'
import type { WeeklyReportData } from '../../components/reports/WeeklyPDFReport'

const log = createPrefixedLogger('[WeeklyReport]')

export const useWeeklyReport = () => {
  const captureChart = useCallback(
    async (elementId: string): Promise<string | null> => {
      const element = document.getElementById(elementId)
      if (!element) {
        log.warn(`Elemento ${elementId} no encontrado`)
        return null
      }
      try {
        // Load html2canvas on demand — not in the initial bundle
        const { default: html2canvas } = await import('html2canvas')
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
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

        const reportData: WeeklyReportData = { ...data, chartImages }

        // Load @react-pdf/renderer and the report component on demand
        const [{ pdf }, { default: WeeklyPDFReport }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('../../components/reports/WeeklyPDFReport')
        ])

        const pdfDocument = React.createElement(WeeklyPDFReport, { data: reportData })
        const blob = await pdf(pdfDocument as React.ReactElement).toBlob()

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `informe-semanal-${data.week}.pdf`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        log.error('Error generando PDF:', error)
        throw new Error('No se pudo generar el informe PDF')
      }
    },
    [captureChart]
  )

  return { generateWeeklyPDF, captureChart }
}

export default useWeeklyReport
