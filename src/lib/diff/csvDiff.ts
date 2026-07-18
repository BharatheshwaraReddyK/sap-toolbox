import type { CSVParseResult } from '../formats/csv'

export interface CSVRowDiff {
  key: string
  status: 'added' | 'removed' | 'changed' | 'unchanged'
  before?: Record<string, string>
  after?: Record<string, string>
  changedFields: string[]
}

export function diffCSV(a: CSVParseResult, b: CSVParseResult, keyField?: string): CSVRowDiff[] {
  const results: CSVRowDiff[] = []

  if (keyField) {
    const aMap = new Map(a.rows.map((r) => [r[keyField] ?? '', r]))
    const bMap = new Map(b.rows.map((r) => [r[keyField] ?? '', r]))
    const keys = new Set([...aMap.keys(), ...bMap.keys()])
    for (const key of keys) {
      const before = aMap.get(key)
      const after = bMap.get(key)
      results.push(buildEntry(key, before, after))
    }
    results.sort((x, y) => x.key.localeCompare(y.key))
    return results
  }

  const max = Math.max(a.rows.length, b.rows.length)
  for (let i = 0; i < max; i++) {
    results.push(buildEntry(`row ${i + 1}`, a.rows[i], b.rows[i]))
  }
  return results
}

function buildEntry(key: string, before?: Record<string, string>, after?: Record<string, string>): CSVRowDiff {
  if (!before) return { key, status: 'added', after, changedFields: [] }
  if (!after) return { key, status: 'removed', before, changedFields: [] }
  const fields = new Set([...Object.keys(before), ...Object.keys(after)])
  const changedFields = [...fields].filter((f) => (before[f] ?? '') !== (after[f] ?? ''))
  return {
    key,
    status: changedFields.length ? 'changed' : 'unchanged',
    before,
    after,
    changedFields,
  }
}
