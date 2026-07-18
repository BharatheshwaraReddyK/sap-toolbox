import * as XLSX from 'xlsx'

export interface ExcelSheet {
  name: string
  rows: Record<string, unknown>[]
}

export async function parseExcelFile(file: File): Promise<ExcelSheet[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  return workbook.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' }),
  }))
}

export function rowsToExcelBuffer(rows: Record<string, unknown>[], sheetName = 'Sheet1'): Uint8Array {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array
}

export function downloadExcel(rows: Record<string, unknown>[], filename: string, sheetName = 'Sheet1') {
  const buf = rowsToExcelBuffer(rows, sheetName)
  const blob = new Blob([buf.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  triggerDownload(blob, filename)
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
