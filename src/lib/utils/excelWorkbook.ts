import ExcelJS from 'exceljs'

type CellValue = string | number | boolean | Date | null | undefined

interface ColumnWidth {
  wch?: number
  width?: number
}

const normaliseCell = (value: CellValue): ExcelJS.CellValue => {
  if (value === undefined) return ''
  if (value === null) return ''
  return value
}

const saveBlob = (buffer: ExcelJS.Buffer, filename: string): void => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const createWorkbook = (): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'GPV Canarias'
  workbook.created = new Date()
  return workbook
}

export const addAoASheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  rows: CellValue[][],
  widths: ColumnWidth[] = []
): ExcelJS.Worksheet => {
  const worksheet = workbook.addWorksheet(name)
  rows.forEach((row) => worksheet.addRow(row.map(normaliseCell)))
  widths.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = column.wch ?? column.width ?? 15
  })
  return worksheet
}

export const addJsonSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Record<string, CellValue>[],
  widths: ColumnWidth[] = []
): ExcelJS.Worksheet => {
  const worksheet = workbook.addWorksheet(name)
  const headers = rows[0] ? Object.keys(rows[0]) : []

  worksheet.addRow(headers)
  rows.forEach((row) => {
    worksheet.addRow(headers.map((header) => normaliseCell(row[header])))
  })

  widths.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = column.wch ?? column.width ?? 15
  })

  return worksheet
}

export const writeWorkbook = async (
  workbook: ExcelJS.Workbook,
  filename: string
): Promise<void> => {
  const buffer = await workbook.xlsx.writeBuffer()
  saveBlob(buffer, filename)
}

export const readFirstSheetRows = async (
  file: File
): Promise<Record<string, string>[]> => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const headers: string[] = []
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '').trim()
  })

  const rows: Record<string, string>[] = []
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    const item: Record<string, string> = {}

    headers.forEach((header, index) => {
      if (!header) return
      const value = row.getCell(index + 1).value
      item[header] =
        typeof value === 'object' && value !== null && 'text' in value
          ? String(value.text ?? '').trim()
          : String(value ?? '').trim()
    })

    if (Object.values(item).some((value) => value !== '')) {
      rows.push(item)
    }
  })

  return rows
}

export const readFirstSheetMatrix = async (file: File): Promise<string[][]> => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const matrix: string[][] = []
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = []
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber - 1] = String(cell.value ?? '').trim()
    })
    matrix.push(values)
  })
  return matrix
}
