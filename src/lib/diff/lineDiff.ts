import { diffLines, diffWords, type Change } from 'diff'

export type LineKind = 'same' | 'added' | 'removed' | 'moved-from' | 'moved-to' | 'modified-from' | 'modified-to'

export interface WordToken {
  value: string
  added?: boolean
  removed?: boolean
}

export interface LineEntry {
  kind: LineKind
  lineNumber: number
  text: string
  /** e.g. "moved to line 12" / "moved from line 4" */
  moveNote?: string
  /** word-level tokens, only present on modified-from/modified-to lines */
  tokens?: WordToken[]
}

export interface LineDiffStats {
  same: number
  moved: number
  modified: number
  added: number
  removed: number
}

export interface LineDiffResult {
  entries: LineEntry[]
  stats: LineDiffStats
}

interface RawOp {
  type: 'common' | 'removed' | 'added'
  text: string
}

/** Splits a diffLines Change block into individual line ops, dropping a single trailing empty line. */
function toLineOps(parts: Change[]): RawOp[] {
  const ops: RawOp[] = []
  for (const part of parts) {
    const type: RawOp['type'] = part.added ? 'added' : part.removed ? 'removed' : 'common'
    const lines = part.value.split('\n')
    if (lines.length && lines[lines.length - 1] === '') lines.pop()
    for (const text of lines) ops.push({ type, text })
  }
  return ops
}

export function computeLineDiff(a: string, b: string): LineDiffResult {
  const ops = toLineOps(diffLines(a, b))

  const resolved: (LineKind | null)[] = ops.map((op) => (op.type === 'common' ? 'same' : null))
  const tokensByIndex = new Map<number, WordToken[]>()

  // Pass 1: global exact-match — a removed line that reappears verbatim as an added line
  // elsewhere is a move, not a delete+insert.
  const addedIndicesByText = new Map<string, number[]>()
  ops.forEach((op, i) => {
    if (op.type !== 'added') return
    const list = addedIndicesByText.get(op.text) ?? []
    list.push(i)
    addedIndicesByText.set(op.text, list)
  })

  const usedAdded = new Set<number>()
  const movedPair = new Map<number, number>()
  ops.forEach((op, i) => {
    if (op.type !== 'removed' || resolved[i]) return
    const candidates = addedIndicesByText.get(op.text)
    if (!candidates) return
    const j = candidates.find((idx) => !usedAdded.has(idx))
    if (j === undefined) return
    usedAdded.add(j)
    resolved[i] = 'moved-from'
    resolved[j] = 'moved-to'
    movedPair.set(i, j)
    movedPair.set(j, i)
  })

  // Pass 2: within the remaining removed/added runs, pair lines 1:1 as "modified" —
  // the common case of a value changing in place — and word-diff them.
  let i = 0
  while (i < ops.length) {
    if (resolved[i] !== null) {
      i++
      continue
    }
    const runStart = i
    while (i < ops.length && resolved[i] === null && (ops[i].type === 'removed' || ops[i].type === 'added')) i++
    const run = ops.slice(runStart, i).map((op, k) => ({ op, idx: runStart + k }))
    const removedRun = run.filter((r) => r.op.type === 'removed')
    const addedRun = run.filter((r) => r.op.type === 'added')
    const pairs = Math.min(removedRun.length, addedRun.length)
    for (let k = 0; k < pairs; k++) {
      const from = removedRun[k]
      const to = addedRun[k]
      resolved[from.idx] = 'modified-from'
      resolved[to.idx] = 'modified-to'
      const tokens = diffWords(from.op.text, to.op.text)
      tokensByIndex.set(from.idx, tokens.filter((t) => !t.added))
      tokensByIndex.set(to.idx, tokens.filter((t) => !t.removed))
    }
    for (let k = pairs; k < removedRun.length; k++) resolved[removedRun[k].idx] = 'removed'
    for (let k = pairs; k < addedRun.length; k++) resolved[addedRun[k].idx] = 'added'
  }

  const entries: LineEntry[] = []
  const stats: LineDiffStats = { same: 0, moved: 0, modified: 0, added: 0, removed: 0 }

  ops.forEach((op, idx) => {
    const kind = resolved[idx] as LineKind
    if (kind === 'same') stats.same++
    else if (kind === 'added') stats.added++
    else if (kind === 'removed') stats.removed++
    else if (kind === 'moved-from') stats.moved++
    else if (kind === 'modified-from') stats.modified++

    entries.push({
      kind,
      lineNumber: idx + 1,
      text: op.text,
      tokens: tokensByIndex.get(idx),
    })
  })

  // Fill in move notes ("moved to/from line N") using the exact pairing recorded above.
  entries.forEach((e, i) => {
    if (e.kind !== 'moved-from' && e.kind !== 'moved-to') return
    const j = movedPair.get(i)
    if (j === undefined) return
    const other = entries[j]
    e.moveNote = e.kind === 'moved-from' ? `moved to line ${other.lineNumber}` : `moved from line ${other.lineNumber}`
  })

  return { entries, stats }
}
