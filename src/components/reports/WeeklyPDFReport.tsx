import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer'

// Registrar fuentes personalizadas (opcional)
// Font.register({ family: 'Roboto', src: 'path/to/font' });

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #818CF8',
    paddingBottom: 15
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    borderLeft: '4 solid #818CF8',
    paddingLeft: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    fontSize: 10,
    color: '#6B7280'
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  kpiCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    border: '1 solid #E5E7EB'
  },
  kpiTitle: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#818CF8',
    marginBottom: 2
  },
  kpiSubtitle: {
    fontSize: 8,
    color: '#9CA3AF'
  },
  chartContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1 solid #E5E7EB'
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  chartImage: {
    width: '100%',
    height: 200,
    objectFit: 'contain'
  },
  table: {
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#818CF8',
    padding: 8,
    borderRadius: 4
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #E5E7EB'
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    flex: 1
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10
  },
  highlight: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15
  },
  highlightText: {
    fontSize: 10,
    color: '#92400E'
  }
})

// Tipos
export interface WeeklyReportData {
  week: string
  dateRange: string
  generatedAt: string
  kpis: {
    totalSales: number
    totalVisits: number
    activeDistributors: number
    newCandidates: number
    conversionRate: number
    avgResponseTime: string
    networkHealth: number
    criticalDistributors: number
    stuckCandidates: number
  }
  salesByBrand: Array<{
    brand: string
    operations: number
    percentage: number
  }>
  topPerformers: Array<{
    name: string
    operations: number
    rank: number
  }>
  chartImages?: {
    salesByBrand?: string
    trends?: string
    topMunicipalities?: string
  }
  highlights?: string[]
  visitsDetail?: Array<{
    distributor: string
    date: string
    opportunity?: string
    status?: string
  }>
  opportunities?: Array<{
    distributor: string
    description: string
    status: string
    value?: number
  }>
  incidents?: Array<{
    distributor: string
    description: string
    resolved: boolean
    date: string
  }>
  weeklyComparison?: {
    prevWeekSales: number
    prevWeekVisits: number
    prevWeekConversion: number
    deltaSales: number
    deltaVisits: number
    deltaConversion: number
  }
  segmentation?: Array<{
    segment: string
    sales: number
    visits: number
    conversion: number
  }>
}

interface WeeklyPDFReportProps {
  data: WeeklyReportData
}

const WeeklyPDFReport: React.FC<WeeklyPDFReportProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Informe Semanal</Text>
          <Text style={styles.subtitle}>Semana {data.week}</Text>
          <Text style={styles.subtitle}>{data.dateRange}</Text>
          <Text style={styles.subtitle}>Generado: {data.generatedAt}</Text>
        </View>

        {/* KPIs Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores Clave</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Ventas Totales</Text>
              <Text style={styles.kpiValue}>{data.kpis.totalSales}</Text>
              <Text style={styles.kpiSubtitle}>operaciones registradas</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Visitas Realizadas</Text>
              <Text style={styles.kpiValue}>{data.kpis.totalVisits}</Text>
              <Text style={styles.kpiSubtitle}>esta semana</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Distribuidores Activos</Text>
              <Text style={styles.kpiValue}>
                {data.kpis.activeDistributors}
              </Text>
              <Text style={styles.kpiSubtitle}>en operación</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>Nuevos Candidatos</Text>
              <Text style={styles.kpiValue}>{data.kpis.newCandidates}</Text>
              <Text style={styles.kpiSubtitle}>captados</Text>
            </View>
          </View>
        </View>

        {/* Smart Health & Recruitment Radar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Radar de Operaciones y Salud</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.kpiCard, { flex: 1, backgroundColor: data.kpis.networkHealth < 70 ? '#FEF2F2' : '#F0FDF4' }]}>
               <Text style={[styles.kpiTitle, { color: data.kpis.networkHealth < 70 ? '#EF4444' : '#10B981' }]}>Salud de la Red</Text>
               <Text style={[styles.kpiValue, { color: data.kpis.networkHealth < 70 ? '#B91C1C' : '#047857' }]}>{data.kpis.networkHealth}%</Text>
               <Text style={styles.kpiSubtitle}>{data.kpis.criticalDistributors} puntos en riesgo crítico</Text>
            </View>
            <View style={[styles.kpiCard, { flex: 1, backgroundColor: data.kpis.stuckCandidates > 2 ? '#FFFBEB' : '#F0F9FF' }]}>
               <Text style={[styles.kpiTitle, { color: data.kpis.stuckCandidates > 2 ? '#D97706' : '#0284C7' }]}>Pipeline de Talento</Text>
               <Text style={[styles.kpiValue, { color: data.kpis.stuckCandidates > 2 ? '#B45309' : '#0369A1' }]}>{data.kpis.newCandidates} Cand.</Text>
               <Text style={styles.kpiSubtitle}>{data.kpis.stuckCandidates} fichajes estancados</Text>
            </View>
          </View>
        </View>

        {/* Comparativa semanal */}
        {data.weeklyComparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comparativa con semana anterior
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                  Indicador
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Semana actual
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Semana previa
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Variación
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Ventas</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.kpis.totalSales}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.weeklyComparison.prevWeekSales}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.weeklyComparison.deltaSales}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Visitas</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.kpis.totalVisits}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.weeklyComparison.prevWeekVisits}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.weeklyComparison.deltaVisits}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Conversión</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.kpis.conversionRate}%
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.weeklyComparison.prevWeekConversion}%
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {data.weeklyComparison.deltaConversion}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Segmentación */}
        {data.segmentation && data.segmentation.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Segmentación</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                  Segmento
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Ventas
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Visitas
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Conversión
                </Text>
              </View>
              {data.segmentation.map((seg, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {seg.segment}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {seg.sales}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {seg.visits}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {seg.conversion}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Puntos Destacados</Text>
            <View style={styles.highlight}>
              {data.highlights.map((highlight, index) => (
                <Text key={index} style={styles.highlightText}>
                  • {highlight}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Detalle de visitas */}
        {data.visitsDetail && data.visitsDetail.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalle de Visitas</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                  Distribuidor
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Fecha</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                  Oportunidad
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Estado
                </Text>
              </View>
              {data.visitsDetail.map((visit, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {visit.distributor}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {visit.date}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {visit.opportunity || '-'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {visit.status || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Oportunidades */}
        {data.opportunities && data.opportunities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Oportunidades Comerciales</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                  Distribuidor
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>
                  Descripción
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Estado
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Valor</Text>
              </View>
              {data.opportunities.map((op, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {op.distributor}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {op.description}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {op.status}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {op.value != null ? op.value : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Incidencias */}
        {data.incidents && data.incidents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incidencias y Acciones</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                  Distribuidor
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>
                  Descripción
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                  Resuelta
                </Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Fecha</Text>
              </View>
              {data.incidents.map((inc, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {inc.distributor}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {inc.description}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {inc.resolved ? 'Sí' : 'No'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {inc.date}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sales by Brand Chart */}
        {data.chartImages?.salesByBrand && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Ventas por Marca</Text>
            <Image
              src={data.chartImages.salesByBrand}
              style={styles.chartImage}
            />
          </View>
        )}

        {/* Page Break for second page */}
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Trends Chart */}
        {data.chartImages?.trends && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Tendencias Semanales</Text>
            <Image src={data.chartImages.trends} style={styles.chartImage} />
          </View>
        )}

        {/* Top Performers Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 10 Distribuidores</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>Rank</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                Distribuidor
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                Operaciones
              </Text>
            </View>
            {data.topPerformers.slice(0, 10).map((performer, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>
                  {performer.rank}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {performer.name}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {performer.operations}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sales by Brand Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose por Marca</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Marca</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                Operaciones
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>%</Text>
            </View>
            {data.salesByBrand.map((brand, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {brand.brand}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {brand.operations}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {brand.percentage.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>GPV Canarias - Informe Semanal</Text>
          <Text>Documento confidencial - Solo para uso interno</Text>
        </View>
      </Page>
    </Document>
  )
}

export default WeeklyPDFReport
