import type {
  Candidate,
  Distributor,
  Sale,
  ChannelType,
  DistributorStatus,
  PipelineStageId,
  CandidatePriority,
  EntityId,
  Lead
} from '../types'
import {
  addAoASheet,
  addJsonSheet,
  createWorkbook,
  readFirstSheetRows,
  writeWorkbook
} from './excelWorkbook'

interface ExcelRow {
  [key: string]: string | number | undefined
}

const toStr = (value: string | number | undefined): string => {
  return value !== undefined ? String(value) : ''
}

export const DISTRIBUTOR_TEMPLATE_COLUMNS = [
  'Código',
  'Nombre',
  'CIF/NIF',
  'Razón Social',
  'Dirección Fiscal',
  'Contacto Principal',
  'Contacto Secundario',
  'Teléfono',
  'Email',
  'Tipo de Canal',
  'Ciudad',
  'Provincia',
  'Código Postal',
  'Estado',
  'Notas'
]

export const CANDIDATE_TEMPLATE_COLUMNS = [
  'Nombre',
  'Ciudad',
  'Provincia',
  'Isla',
  'Código de Canal',
  'Etapa',
  'Fuente',
  'Prioridad',
  'Contacto Nombre',
  'Contacto Teléfono',
  'Contacto Email',
  'Notas'
]

export const LEAD_TEMPLATE_COLUMNS = [
  'Nombre',
  'Fuente',
  'Teléfono',
  'Email',
  'Web',
  'Dirección',
  'Ciudad',
  'Sector',
  'Rating',
  'Reviews',
  'Estado',
  'Notas'
]

export const downloadDistributorTemplate = async (): Promise<void> => {
  const workbook = createWorkbook()
  const worksheetData = [
    DISTRIBUTOR_TEMPLATE_COLUMNS,
    [
      'DIST001',
      'Distribuidora Ejemplo S.L.',
      'B12345678',
      'Distribuidora Ejemplo Sociedad Limitada',
      'Calle Principal 123',
      'Juan Pérez',
      'María González',
      '922123456',
      'contacto@ejemplo.com',
      'exclusive',
      'Las Palmas',
      'Las Palmas',
      '35001',
      'active',
      'Cliente nuevo, alta prioridad'
    ]
  ]
  addAoASheet(workbook, 'Distribuidores', worksheetData, [
    { wch: 10 },
    { wch: 30 },
    { wch: 12 },
    { wch: 35 },
    { wch: 35 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 40 }
  ])
  const instructionsData = [
    ['INSTRUCCIONES PARA IMPORTAR DISTRIBUIDORES'],
    [''],
    ['1. Rellena los datos en la hoja "Distribuidores"'],
    ['2. NO modifiques los nombres de las columnas'],
    [
      '3. Campos obligatorios: Código, Nombre, CIF/NIF, Tipo de Canal, Ciudad, Estado'
    ],
    ['4. Tipo de Canal puede ser: exclusive, non_exclusive, d2d'],
    ['5. Estado puede ser: active, pending, blocked'],
    ['6. Elimina la fila de ejemplo antes de importar'],
    ['7. Guarda el archivo y usa "Importar Excel" en la aplicación']
  ]
  addAoASheet(workbook, 'Instrucciones', instructionsData, [{ wch: 80 }])
  await writeWorkbook(
    workbook,
    `Plantilla_Distribuidores_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const downloadCandidateTemplate = async (): Promise<void> => {
  const workbook = createWorkbook()
  const worksheetData = [
    CANDIDATE_TEMPLATE_COLUMNS,
    [
      'Candidato Ejemplo',
      'Santa Cruz de Tenerife',
      'Santa Cruz de Tenerife',
      'Tenerife',
      'CAND001',
      'new',
      'Referido',
      'high',
      'Pedro López',
      '922654321',
      'pedro@ejemplo.com',
      'Muy interesado en marcas premium'
    ]
  ]
  addAoASheet(workbook, 'Candidatos', worksheetData, [
    { wch: 30 }, // Nombre
    { wch: 25 }, // Ciudad
    { wch: 25 }, // Provincia
    { wch: 15 }, // Isla
    { wch: 15 }, // Código de Canal
    { wch: 12 }, // Etapa
    { wch: 15 }, // Fuente
    { wch: 10 }, // Prioridad
    { wch: 25 }, // Contacto Nombre
    { wch: 15 }, // Contacto Teléfono
    { wch: 25 }, // Contacto Email
    { wch: 40 } // Notas
  ])
  const instructionsData = [
    ['INSTRUCCIONES PARA IMPORTAR CANDIDATOS'],
    [''],
    ['1. Rellena los datos en la hoja "Candidatos"'],
    ['2. NO modifiques los nombres de las columnas'],
    ['3. Campos obligatorios: Nombre, Ciudad, Provincia, Etapa'],
    ['   Provincia debe ser: Las Palmas o Santa Cruz de Tenerife'],
    ['4. Etapa puede ser: new, contacted, evaluation, approved, rejected'],
    [
      '5. Isla puede ser: Gran Canaria, Tenerife, Lanzarote, Fuerteventura, La Palma, La Gomera, El Hierro'
    ],
    ['6. Prioridad puede ser: high, medium, low'],
    ['7. Elimina la fila de ejemplo antes de importar'],
    ['8. Guarda el archivo y usa "Importar Excel" en la aplicación']
  ]
  addAoASheet(workbook, 'Instrucciones', instructionsData, [{ wch: 80 }])
  await writeWorkbook(
    workbook,
    `Plantilla_Candidatos_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const exportDistributors = async (
  distributors: Distributor[]
): Promise<void> => {
  const data = distributors.map((d) => ({
    Código: d.code || '',
    Nombre: d.name || '',
    'CIF/NIF': d.taxId || '',
    'Razón Social': d.fiscalName || '',
    'Dirección Fiscal': d.fiscalAddress || '',
    'Contacto Principal': d.contactPerson || '',
    'Contacto Secundario': d.contactPersonBackup || '',
    Teléfono: d.phone || '',
    Email: d.email || '',
    'Tipo de Canal': d.channelType || '',
    Ciudad: d.city || '',
    Provincia: d.province || '',
    'Código Postal': d.postalCode || '',
    Estado: d.status || '',
    Notas: d.notes || ''
  }))
  const workbook = createWorkbook()
  addJsonSheet(workbook, 'Distribuidores', data, DISTRIBUTOR_TEMPLATE_COLUMNS.map((_, i) => {
    if (i === 3 || i === 4 || i === 14) return { wch: 40 }
    if (i === 1) return { wch: 30 }
    if (i === 7) return { wch: 25 }
    if (i === 5 || i === 6 || i === 10 || i === 11) return { wch: 20 }
    return { wch: 15 }
  }))
  await writeWorkbook(
    workbook,
    `Distribuidores_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const exportCandidates = async (
  candidates: Candidate[]
): Promise<void> => {
  const data = candidates.map((c) => ({
    Nombre: c.name || '',
    Ciudad: c.city || '',
    Provincia: c.province || '',
    Isla: c.island || '',
    'Código de Canal': c.channelCode || '',
    Etapa: c.stage || '',
    Fuente: c.source || '',
    Prioridad: c.priority || '',
    'Contacto Nombre': c.contact?.name || '',
    'Contacto Teléfono': c.contact?.phone || '',
    'Contacto Email': c.contact?.email || '',
    Notas: c.notes || ''
  }))
  const workbook = createWorkbook()
  addJsonSheet(workbook, 'Candidatos', data, CANDIDATE_TEMPLATE_COLUMNS.map((_, i) => {
    if (i === 0 || i === 7 || i === 9) return { wch: 25 }
    if (i === 10) return { wch: 40 }
    if (i === 1) return { wch: 20 }
    return { wch: 15 }
  }))
  await writeWorkbook(
    workbook,
    `Candidatos_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const exportLeads = async (leads: Lead[]): Promise<void> => {
  const data = leads.map((l) => ({
    Nombre: l.nombre || '',
    Fuente: l.fuente || '',
    Teléfono: l.telefono || '',
    Email: l.email || '',
    Web: l.web || '',
    Dirección: l.direccion || '',
    Ciudad: l.ciudad || '',
    Sector: l.sector || '',
    Rating: l.rating || '',
    Reviews: l.reviews_count || 0,
    Estado: l.estado || '',
    Notas: l.notas || ''
  }))
  const workbook = createWorkbook()
  addJsonSheet(workbook, 'Leads', data, LEAD_TEMPLATE_COLUMNS.map((_, i) => {
    if (i === 0 || i === 5 || i === 11) return { wch: 30 }
    if (i === 4 || i === 3) return { wch: 25 }
    return { wch: 15 }
  }))
  await writeWorkbook(
    workbook,
    `Leads_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const exportSales = async (sales: Sale[]): Promise<void> => {
  const data = sales.map((s) => ({
    Distribuidor: s.distributorName || '',
    Código: s.distributorCode || '',
    Cliente: s.nombreCliente || '',
    Documento: s.documento || '',
    'Tipo doc.': s.tipoDocumento || '',
    Marca: s.brand || '',
    Familia: s.family || '',
    Sector: s.sector || '',
    Modo: s.modo || '',
    Estado: s.status || '',
    Operaciones: s.operations ?? 1,
    'Fecha oferta': s.fechaOferta
      ? new Date(s.fechaOferta).toLocaleDateString('es-ES')
      : '',
    'Fecha cierre': s.fechaCierre
      ? new Date(s.fechaCierre).toLocaleDateString('es-ES')
      : '',
    'Fecha activación': s.fechaActivacion
      ? new Date(s.fechaActivacion).toLocaleDateString('es-ES')
      : '',
    'Fecha baja': s.fechaBaja
      ? new Date(s.fechaBaja).toLocaleDateString('es-ES')
      : '',
    Observaciones: s.observaciones || s.notes || ''
  }))
  const workbook = createWorkbook()
  addJsonSheet(workbook, 'Ventas', data, [
    { wch: 30 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 35 }
  ])
  await writeWorkbook(
    workbook,
    `Ventas_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export interface ImportResult<T> {
  success: boolean
  data: T[]
  errors: string[]
  warnings: string[]
  created?: number
  updated?: number
}

export const importDistributors = async (
  file: File
): Promise<ImportResult<Partial<Distributor>>> => {
  const errors: string[] = []
  const warnings: string[] = []
  const data: Partial<Distributor>[] = []
  try {
    const jsonData = (await readFirstSheetRows(file)) as ExcelRow[]
    if (jsonData.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos')
      return { success: false, data: [], errors, warnings }
    }
    jsonData.forEach((row, index) => {
      const rowNumber = index + 2
      const rowErrors: string[] = []
      if (!row['Código']) rowErrors.push(`Fila ${rowNumber}: Falta el Código`)
      if (!row['Nombre']) rowErrors.push(`Fila ${rowNumber}: Falta el Nombre`)
      if (!row['CIF/NIF']) rowErrors.push(`Fila ${rowNumber}: Falta el CIF/NIF`)
      if (!row['Tipo de Canal'])
        rowErrors.push(`Fila ${rowNumber}: Falta el Tipo de Canal`)
      if (!row['Ciudad']) rowErrors.push(`Fila ${rowNumber}: Falta la Ciudad`)
      if (!row['Estado']) rowErrors.push(`Fila ${rowNumber}: Falta el Estado`)
      const validChannelTypes = ['exclusive', 'non_exclusive', 'd2d']
      const channelType = String(row['Tipo de Canal'] || '')
      if (row['Tipo de Canal'] && !validChannelTypes.includes(channelType)) {
        rowErrors.push(
          `Fila ${rowNumber}: Tipo de Canal inválido. Debe ser: ${validChannelTypes.join(', ')}`
        )
      }
      const validStatuses = ['active', 'pending', 'blocked']
      const status = String(row['Estado'] || '')
      if (row['Estado'] && !validStatuses.includes(status)) {
        rowErrors.push(
          `Fila ${rowNumber}: Estado inválido. Debe ser: ${validStatuses.join(', ')}`
        )
      }
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else {
        if (!row['Teléfono']) warnings.push(`Fila ${rowNumber}: Sin teléfono`)
        if (!row['Email']) warnings.push(`Fila ${rowNumber}: Sin email`)
        const distributor: Partial<Distributor> = {
          code: toStr(row['Código']),
          name: toStr(row['Nombre']),
          taxId: toStr(row['CIF/NIF']),
          fiscalName: toStr(row['Razón Social'] || row['Nombre']),
          fiscalAddress: toStr(row['Dirección Fiscal']),
          contactPerson: toStr(row['Contacto Principal']),
          contactPersonBackup: toStr(row['Contacto Secundario']),
          phone: toStr(row['Teléfono']),
          email: toStr(row['Email']),
          channelType: toStr(row['Tipo de Canal']) as ChannelType,
          city: toStr(row['Ciudad']),
          province: toStr(row['Provincia']),
          postalCode: toStr(row['Código Postal']),
          status: toStr(row['Estado']) as DistributorStatus,
          notes: toStr(row['Notas']),
          brands: [],
          pendingData: false,
          upgradeRequested: false,
          salesYtd: 0,
          completion: 0,
          checklistComplete: false,
          createdAt: new Date().toISOString()
        }
        data.push(distributor)
      }
    })
    return {
      success: errors.length === 0,
      data,
      errors,
      warnings
    }
  } catch (error) {
    errors.push(
      `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
    )
    return { success: false, data: [], errors, warnings }
  }
}

export const importCandidates = async (
  file: File
): Promise<ImportResult<Partial<Candidate>>> => {
  const errors: string[] = []
  const warnings: string[] = []
  const data: Partial<Candidate>[] = []
  try {
    const jsonData = (await readFirstSheetRows(file)) as ExcelRow[]
    if (jsonData.length === 0) {
      errors.push('El archivo está vacío o no contiene datos válidos')
      return { success: false, data: [], errors, warnings }
    }
    jsonData.forEach((row, index) => {
      const rowNumber = index + 2
      const rowErrors: string[] = []
      if (!row['Nombre']) rowErrors.push(`Fila ${rowNumber}: Falta el Nombre`)
      if (!row['Ciudad']) rowErrors.push(`Fila ${rowNumber}: Falta la Ciudad`)
      if (!row['Etapa']) rowErrors.push(`Fila ${rowNumber}: Falta la Etapa`)
      const validStages = [
        'new',
        'contacted',
        'evaluation',
        'approved',
        'rejected'
      ]
      const stage = toStr(row['Etapa'])
      if (row['Etapa'] && !validStages.includes(stage)) {
        rowErrors.push(
          `Fila ${rowNumber}: Etapa inválida. Debe ser: ${validStages.join(', ')}`
        )
      }
      const validPriorities = ['high', 'medium', 'low']
      const priority = toStr(row['Prioridad'])
      if (row['Prioridad'] && !validPriorities.includes(priority)) {
        rowErrors.push(
          `Fila ${rowNumber}: Prioridad inválida. Debe ser: ${validPriorities.join(', ')}`
        )
      }
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else {
        if (!row['Contacto Teléfono'] && !row['Contacto Email']) {
          warnings.push(
            `Fila ${rowNumber}: Sin datos de contacto (teléfono o email)`
          )
        }
        const candidate: Partial<Candidate> = {
          name: toStr(row['Nombre']),
          city: toStr(row['Ciudad']),
          province: toStr(row['Provincia']) || undefined,
          island: toStr(row['Isla']),
          channelCode: toStr(row['Código de Canal']),
          stage: toStr(row['Etapa']) as PipelineStageId,
          source: toStr(row['Fuente']) || 'Importación Excel',
          priority: (toStr(row['Prioridad']) || 'medium') as CandidatePriority,
          notes: toStr(row['Notas']),
          contact: {
            name: toStr(row['Contacto Nombre']),
            phone: toStr(row['Contacto Teléfono']),
            email: toStr(row['Contacto Email'])
          },
          createdAt: new Date().toISOString()
        }
        data.push(candidate)
      }
    })
    return {
      success: errors.length === 0,
      data,
      errors,
      warnings
    }
  } catch (error) {
    errors.push(
      `Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
    )
    return { success: false, data: [], errors, warnings }
  }
}

export const importDistributorsWithUpdate = async (
  file: File,
  existingDistributors: Distributor[]
): Promise<
  ImportResult<
    Partial<Distributor> & { isUpdate?: boolean; existingId?: EntityId }
  >
> => {
  const baseResult = await importDistributors(file)
  if (!baseResult.success) {
    return baseResult
  }
  let created = 0
  let updated = 0
  const dataWithUpdateInfo = baseResult.data.map((dist) => {
    const existing = existingDistributors.find((d) => d.code === dist.code)
    if (existing) {
      updated++
      return { ...dist, isUpdate: true, existingId: existing.id }
    } else {
      created++
      return { ...dist, isUpdate: false }
    }
  })
  return {
    ...baseResult,
    data: dataWithUpdateInfo,
    created,
    updated
  }
}

export const importCandidatesWithUpdate = async (
  file: File,
  existingCandidates: Candidate[]
): Promise<
  ImportResult<
    Partial<Candidate> & { isUpdate?: boolean; existingId?: EntityId }
  >
> => {
  const baseResult = await importCandidates(file)
  if (!baseResult.success) {
    return baseResult
  }
  let created = 0
  let updated = 0
  const dataWithUpdateInfo = baseResult.data.map((cand) => {
    const existing = existingCandidates.find(
      (c) => c.name === cand.name && c.city === cand.city
    )
    if (existing) {
      updated++
      return { ...cand, isUpdate: true, existingId: existing.id }
    } else {
      created++
      return { ...cand, isUpdate: false }
    }
  })
  return {
    ...baseResult,
    data: dataWithUpdateInfo,
    created,
    updated
  }
}
