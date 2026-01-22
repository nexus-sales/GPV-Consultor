import * as XLSX from 'xlsx'
import type {
  Candidate,
  Distributor,
  ChannelType,
  DistributorStatus,
  PipelineStageId,
  CandidatePriority,
  EntityId
} from '../types'

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

export const downloadDistributorTemplate = (): void => {
  const workbook = XLSX.utils.book_new()
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
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  worksheet['!cols'] = [
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
  ]
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribuidores')
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
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
  instructionsSheet['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')
  XLSX.writeFile(
    workbook,
    `Plantilla_Distribuidores_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const downloadCandidateTemplate = (): void => {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [
    CANDIDATE_TEMPLATE_COLUMNS,
    [
      'Candidato Ejemplo',
      'Santa Cruz',
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
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 40 }
  ]
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatos')
  const instructionsData = [
    ['INSTRUCCIONES PARA IMPORTAR CANDIDATOS'],
    [''],
    ['1. Rellena los datos en la hoja "Candidatos"'],
    ['2. NO modifiques los nombres de las columnas'],
    ['3. Campos obligatorios: Nombre, Ciudad, Etapa'],
    ['4. Etapa puede ser: new, contacted, evaluation, approved, rejected'],
    [
      '5. Isla puede ser: Gran Canaria, Tenerife, Lanzarote, Fuerteventura, La Palma, La Gomera, El Hierro'
    ],
    ['6. Prioridad puede ser: high, medium, low'],
    ['7. Elimina la fila de ejemplo antes de importar'],
    ['8. Guarda el archivo y usa "Importar Excel" en la aplicación']
  ]
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
  instructionsSheet['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')
  XLSX.writeFile(
    workbook,
    `Plantilla_Candidatos_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const exportDistributors = (distributors: Distributor[]): void => {
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
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  worksheet['!cols'] = DISTRIBUTOR_TEMPLATE_COLUMNS.map((_, i) => {
    if (i === 3 || i === 4 || i === 14) return { wch: 40 }
    if (i === 1) return { wch: 30 }
    if (i === 7) return { wch: 25 }
    if (i === 5 || i === 6 || i === 10 || i === 11) return { wch: 20 }
    return { wch: 15 }
  })
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribuidores')
  XLSX.writeFile(
    workbook,
    `Distribuidores_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

export const exportCandidates = (candidates: Candidate[]): void => {
  const data = candidates.map((c) => ({
    Nombre: c.name || '',
    Ciudad: c.city || '',
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
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  worksheet['!cols'] = CANDIDATE_TEMPLATE_COLUMNS.map((_, i) => {
    if (i === 0 || i === 7 || i === 9) return { wch: 25 }
    if (i === 10) return { wch: 40 }
    if (i === 1) return { wch: 20 }
    return { wch: 15 }
  })
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatos')
  XLSX.writeFile(
    workbook,
    `Candidatos_${new Date().toISOString().split('T')[0]}.xlsx`
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
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]
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
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]
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
