import type { CSVParseResult } from '../formats/csv'

export interface CSVRowDiff {
  key: string
  status: 'added' | 'removed' | 'changed' | 'moved' | 'unchanged'
  before?: Record<string, string>
  after?: Record<string, string>
  changedFields: string[]
  fromIndex?: number
  toIndex?: number
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

  // Position mode: first find rows that are byte-for-byte identical but sit at a different
  // index — report those once as 'moved' instead of a spurious removed+added pair — then
  // diff whatever's left positionally.
  const usedA = new Set<number>()
  const usedB = new Set<number>()
  const bByValue = new Map<string, number[]>()
  b.rows.forEach((row, i) => {
    const key = rowKey(row)
    const list = bByValue.get(key) ?? []
    list.push(i)
    bByValue.set(key, list)
  })

  a.rows.forEach((row, i) => {
    const candidates = bByValue.get(rowKey(row))
    if (!candidates || candidates.length === 0) return
    const j = candidates.shift()!
    usedA.add(i)
    usedB.add(j)
    if (i !== j) {
      results.push({ key: `row ${i + 1}→${j + 1}`, status: 'moved', before: row, after: b.rows[j], changedFields: [], fromIndex: i, toIndex: j })
    }
  })

  const remainingA = a.rows.map((_r, i) => i).filter((i) => !usedA.has(i))
  const remainingB = b.rows.map((_r, i) => i).filter((i) => !usedB.has(i))
  const max = Math.max(remainingA.length, remainingB.length)
  for (let k = 0; k < max; k++) {
    const ai = remainingA[k]
    const bi = remainingB[k]
    const label = ai !== undefined && bi !== undefined && ai !== bi ? `row ${ai + 1}→${bi + 1}` : `row ${(ai ?? bi) + 1}`
    results.push(buildEntry(label, ai !== undefined ? a.rows[ai] : undefined, bi !== undefined ? b.rows[bi] : undefined))
  }

  results.sort((x, y) => rowNumberOf(x.key) - rowNumberOf(y.key))
  return results
}

function rowKey(row: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(row)
      .sort()
      .reduce((acc: Record<string, string>, k) => {
        acc[k] = row[k]
        return acc
      }, {}),
  )
}

function rowNumberOf(key: string): number {
  const match = key.match(/row (\d+)/)
  return match ? Number(match[1]) : 0
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
