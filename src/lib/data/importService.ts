/**
 * Servicio de importación de archivos CSV y Excel
 * §6.3: Wizard de importación con mapeo, validación y preview
 * FIXED: Correcciones para validación CIF/NIF y mapeo de contacto
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { validateEmail, validatePhone, validateTaxId } from './validators' // ✅ CHANGED: Use validateTaxId instead of validateNIF
import type { Distributor, Candidate } from '../types'

// Funciones de normalización locales
const normalizePhone = (value: string): string => {
  return value.replace(/\s+/g, '').replace(/[^0-9]/g, '')
}

const normalizePostalCode = (value: string): string => {
  return value
    .replace(/\s+/g, '')
    .replace(/[^0-9]/g, '')
    .slice(0, 5)
}

export type ImportEntityType = 'distributor' | 'candidate'

export interface ImportField {
  key: string
  label: string
  required: boolean
  type: 'text' | 'email' | 'phone' | 'select' | 'number'
  options?: string[]
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
}

export interface ValidationError {
  row: number
  field: string
  value: string
  error: string
}

export interface ImportPreviewRow {
  rowIndex: number
  data: Record<string, string>
  errors: ValidationError[]
  warnings: string[]
}

export interface ParsedFileData {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
}

// Campos disponibles para mapeo
export const DISTRIBUTOR_FIELDS: ImportField[] = [
  { key: 'name', label: 'Nombre', required: true, type: 'text' },
  { key: 'nif', label: 'NIF/CIF', required: true, type: 'text' },
  { key: 'phone', label: 'Teléfono', required: true, type: 'phone' },
  { key: 'email', label: 'Email', required: false, type: 'email' },
  {
    key: 'contactPerson',
    label: 'Persona de Contacto',
    required: true,
    type: 'text'
  },
  {
    key: 'province',
    label: 'Provincia',
    required: true,
    type: 'select',
    options: ['Las Palmas', 'Santa Cruz de Tenerife']
  },
  { key: 'city', label: 'Ciudad/Municipio', required: true, type: 'text' },
  { key: 'address', label: 'Dirección', required: false, type: 'text' },
  { key: 'postalCode', label: 'Código Postal', required: true, type: 'text' },
  {
    key: 'channelType',
    label: 'Tipo de Canal',
    required: true,
    type: 'select',
    options: ['exclusive', 'non_exclusive', 'd2d']
  },
  {
    key: 'status',
    label: 'Estado',
    required: false,
    type: 'select',
    options: ['active', 'pending', 'blocked']
  },
  { key: 'notes', label: 'Notas', required: false, type: 'text' }
]

export const CANDIDATE_FIELDS: ImportField[] = [
  { key: 'name', label: 'Nombre', required: true, type: 'text' },
  { key: 'phone', label: 'Teléfono', required: true, type: 'phone' },
  { key: 'email', label: 'Email', required: false, type: 'email' },
  {
    key: 'contactPerson',
    label: 'Persona de Contacto',
    required: false,
    type: 'text'
  },
  {
    key: 'province',
    label: 'Provincia',
    required: true,
    type: 'select',
    options: ['Las Palmas', 'Santa Cruz de Tenerife']
  },
  { key: 'city', label: 'Ciudad/Municipio', required: true, type: 'text' },
  { key: 'address', label: 'Dirección', required: false, type: 'text' },
  { key: 'postalCode', label: 'Código Postal', required: false, type: 'text' },
  {
    key: 'interest',
    label: 'Interés',
    required: false,
    type: 'select',
    options: ['high', 'medium', 'low']
  },
  { key: 'source', label: 'Fuente', required: false, type: 'text' },
  { key: 'notes', label: 'Notas', required: false, type: 'text' }
]

/**
 * Parsea un archivo CSV
 */
export const parseCSVFile = (file: File): Promise<ParsedFileData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as Record<string, string>[]

        resolve({
          headers,
          rows,
          totalRows: rows.length
        })
      },
      error: (error) => {
        reject(new Error(`Error al parsear CSV: ${error.message}`))
      }
    })
  })
}

/**
 * Parsea un archivo Excel
 */
export const parseExcelFile = (file: File): Promise<ParsedFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        // Tomar la primera hoja
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1
        }) as string[][]

        if (jsonData.length === 0) {
          reject(new Error('El archivo Excel está vacío'))
          return
        }

        // Primera fila como headers
        const headers = jsonData[0].map((h) => String(h).trim())

        // Resto como filas
        const rows = jsonData.slice(1).map((row) => {
          const rowObj: Record<string, string> = {}
          headers.forEach((header, index) => {
            rowObj[header] = String(row[index] || '').trim()
          })
          return rowObj
        })

        resolve({
          headers,
          rows: rows.filter((row) => Object.values(row).some((v) => v !== '')), // Filtrar filas vacías
          totalRows: rows.length
        })
      } catch (error) {
        reject(new Error(`Error al parsear Excel: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Detecta automáticamente el mapeo de columnas
 */
export const autoDetectMapping = (
  headers: string[],
  entityType: ImportEntityType
): ColumnMapping[] => {
  const fields =
    entityType === 'distributor' ? DISTRIBUTOR_FIELDS : CANDIDATE_FIELDS
  const mapping: ColumnMapping[] = []

  // Normalizar headers para comparación
  const normalizeHeader = (header: string): string => {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]/g, '')
  }

  // Mapas de sinónimos comunes
  const synonyms: Record<string, string[]> = {
    name: ['nombre', 'razon', 'razonsocial', 'empresa', 'company'],
    nif: ['nif', 'cif', 'dni', 'identificacion', 'tax'],
    phone: ['telefono', 'tel', 'movil', 'celular', 'phone'],
    email: ['email', 'correo', 'mail', 'e-mail'],
    contactPerson: [
      'contacto',
      'persona',
      'responsable',
      'contact',
      'principal',
      'contactoprincipal'
    ], // ✅ FIXED: Added 'principal' and 'contactoprincipal'
    province: ['provincia', 'prov', 'province'],
    city: ['ciudad', 'municipio', 'localidad', 'city'],
    address: ['direccion', 'calle', 'domicilio', 'address'],
    postalCode: ['codigopostal', 'cp', 'postal', 'zip'],
    channelType: ['canal', 'tipodecanal', 'channel'],
    status: ['estado', 'status'],
    interest: ['interes', 'interest'],
    source: ['fuente', 'origen', 'source'],
    notes: ['notas', 'observaciones', 'comentarios', 'notes']
  }

  headers.forEach((header) => {
    const normalizedHeader = normalizeHeader(header)

    // Buscar coincidencia exacta o en sinónimos
    for (const field of fields) {
      const fieldSynonyms = synonyms[field.key] || []
      const normalizedFieldKey = normalizeHeader(field.key)

      if (
        normalizedHeader === normalizedFieldKey ||
        fieldSynonyms.some((syn) => normalizedHeader.includes(syn))
      ) {
        mapping.push({
          sourceColumn: header,
          targetField: field.key
        })
        break
      }
    }
  })

  return mapping
}

/**
 * Aplica mapeo y normalización a una fila
 */
export const applyMappingToRow = (
  row: Record<string, string>,
  mapping: ColumnMapping[]
): Record<string, string> => {
  const mappedRow: Record<string, string> = {}

  mapping.forEach((map) => {
    const value = row[map.sourceColumn] || ''

    // Aplicar normalización según el campo
    let normalizedValue = value.trim()

    switch (map.targetField) {
      case 'phone':
        normalizedValue = normalizePhone(value)
        break
      case 'postalCode':
        normalizedValue = normalizePostalCode(value)
        break
      case 'email':
        normalizedValue = value.toLowerCase().trim()
        break
      case 'nif':
        normalizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        break
      case 'province':
        // Normalizar nombre de provincia incluyendo todas las islas
        if (/palmas|gc|gran canaria|lanzarote|fuerteventura/i.test(value)) {
          normalizedValue = 'Las Palmas'
        } else if (/tenerife|sc|santa cruz|gomera|hierro|palma/i.test(value)) {
          normalizedValue = 'Santa Cruz de Tenerife'
        }
        break
      case 'channelType':
        // Normalizar tipo de canal
        if (/exclusiv[oa]/i.test(value)) {
          normalizedValue = 'exclusive'
        } else if (/no.?exclusiv[oa]/i.test(value)) {
          normalizedValue = 'non_exclusive'
        } else if (/d2d|puerta/i.test(value)) {
          normalizedValue = 'd2d'
        }
        break
      case 'status':
        // Normalizar estado
        if (/activ[oa]/i.test(value)) {
          normalizedValue = 'active'
        } else if (/pendiente/i.test(value)) {
          normalizedValue = 'pending'
        } else if (/bloqueado|inactiv[oa]|blocked/i.test(value)) {
          normalizedValue = 'blocked'
        }
        break
      case 'interest':
        // Normalizar interés
        if (/alto|high/i.test(value)) {
          normalizedValue = 'high'
        } else if (/medio|medium/i.test(value)) {
          normalizedValue = 'medium'
        } else if (/bajo|low/i.test(value)) {
          normalizedValue = 'low'
        }
        break
    }

    mappedRow[map.targetField] = normalizedValue
  })

  return mappedRow
}

/**
 * Valida una fila mapeada
 */
export const validateMappedRow = (
  row: Record<string, string>,
  entityType: ImportEntityType,
  rowIndex: number
): ValidationError[] => {
  const fields =
    entityType === 'distributor' ? DISTRIBUTOR_FIELDS : CANDIDATE_FIELDS
  const errors: ValidationError[] = []

  fields.forEach((field) => {
    const value = row[field.key] || ''

    // Validar campos requeridos
    if (field.required && !value) {
      errors.push({
        row: rowIndex,
        field: field.key,
        value: '',
        error: `El campo "${field.label}" es obligatorio`
      })
      return
    }

    // Validaciones específicas por tipo
    if (value) {
      switch (field.type) {
        case 'email':
          if (!validateEmail(value)) {
            errors.push({
              row: rowIndex,
              field: field.key,
              value,
              error: `Email inválido: "${value}"`
            })
          }
          break
        case 'phone':
          if (!validatePhone(value)) {
            errors.push({
              row: rowIndex,
              field: field.key,
              value,
              error: `Teléfono inválido: "${value}". Debe tener 9 dígitos`
            })
          }
          break
        case 'select':
          if (field.options && !field.options.includes(value)) {
            errors.push({
              row: rowIndex,
              field: field.key,
              value,
              error: `Valor no válido: "${value}". Debe ser uno de: ${field.options.join(', ')}`
            })
          }
          break
      }

      // ✅ FIXED: Use validateTaxId instead of validateNIF for proper CIF/NIF validation
      if (field.key === 'nif') {
        const taxIdValidation = validateTaxId(value)
        if (!taxIdValidation.valid) {
          errors.push({
            row: rowIndex,
            field: field.key,
            value,
            error: taxIdValidation.message || `NIF/CIF inválido: "${value}"`
          })
        }
      }
    }
  })

  return errors
}

/**
 * Genera preview con validaciones
 */
export const generateImportPreview = (
  rows: Record<string, string>[],
  mapping: ColumnMapping[],
  entityType: ImportEntityType
): ImportPreviewRow[] => {
  return rows.map((row, index) => {
    const mappedRow = applyMappingToRow(row, mapping)
    const errors = validateMappedRow(mappedRow, entityType, index + 1)
    const warnings: string[] = []

    // Generar warnings para campos opcionales vacíos importantes
    if (entityType === 'distributor') {
      if (!mappedRow.email) warnings.push('Email no proporcionado')
      if (!mappedRow.address) warnings.push('Dirección no proporcionada')
    }

    return {
      rowIndex: index + 1,
      data: mappedRow,
      errors,
      warnings
    }
  })
}

/**
 * Obtiene estadísticas del preview
 */
export const getPreviewStats = (preview: ImportPreviewRow[]) => {
  const totalRows = preview.length
  const validRows = preview.filter((r) => r.errors.length === 0).length
  const rowsWithErrors = totalRows - validRows
  const totalErrors = preview.reduce((sum, r) => sum + r.errors.length, 0)
  const totalWarnings = preview.reduce((sum, r) => sum + r.warnings.length, 0)

  return {
    totalRows,
    validRows,
    rowsWithErrors,
    totalErrors,
    totalWarnings,
    validPercentage:
      totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0
  }
}
