import Papa from 'papaparse'

export interface CSVParseResult {
  rows: Record<string, string>[]
  fields: string[]
  warnings: string[]
}

export function parseCSV(text: string, delimiter = ''): CSVParseResult {
  if (!text.trim()) throw new Error('Input is empty.')
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: delimiter || undefined,
  })

  const fatal = result.errors.filter((e) => e.type !== 'FieldMismatch')
  if (fatal.length) {
    const first = fatal[0]
    throw new Error(`CSV parse error — ${first.message} (row ${first.row ?? '?'})`)
  }

  const warnings = result.errors.map((e) => `${e.message} (row ${e.row ?? '?'})`)
  return { rows: result.data, fields: result.meta.fields ?? [], warnings }
}

export function objectsToCSV(rows: Record<string, unknown>[], delimiter = ','): string {
  if (!rows.length) return ''
  return Papa.unparse(rows, { delimiter })
}

/** Flatten nested objects/arrays into dotted-key rows suitable for CSV, e.g. a.b[0].c */
export function flattenForCSV(value: unknown): Record<string, unknown>[] {
  const list = Array.isArray(value) ? value : [value]
  return list.map((item) => flattenObject(item as Record<string, unknown>))
}

function flattenObject(obj: unknown, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (obj === null || obj === undefined) {
    if (prefix) out[prefix] = obj
    return out
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      Object.assign(out, flattenObject(item, prefix ? `${prefix}[${i}]` : `[${i}]`))
    })
    return out
  }
  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      if (val !== null && typeof val === 'object') {
        Object.assign(out, flattenObject(val, nextPrefix))
      } else {
        out[nextPrefix] = val
      }
    }
    return out
  }
  out[prefix || 'value'] = obj
  return out
}
