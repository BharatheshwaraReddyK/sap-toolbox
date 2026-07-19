export type DiffKind = 'added' | 'removed' | 'changed' | 'moved' | 'unchanged'

export interface DiffEntry {
  path: string
  kind: DiffKind
  before?: unknown
  after?: unknown
  /** For 'moved' entries: the index it moved from/to within its parent array. */
  fromIndex?: number
  toIndex?: number
}

interface Options {
  ignoreArrayOrder?: boolean
}

/** Deep-compares two parsed values (objects/arrays/primitives) and returns a flat list of differences. */
export function structuralDiff(a: unknown, b: unknown, opts: Options = {}): DiffEntry[] {
  const entries: DiffEntry[] = []
  walk(a, b, '$', entries, opts)
  return entries
}

function walk(a: unknown, b: unknown, path: string, out: DiffEntry[], opts: Options) {
  const aIsObj = isPlainObject(a)
  const bIsObj = isPlainObject(b)
  const aIsArr = Array.isArray(a)
  const bIsArr = Array.isArray(b)

  if (aIsArr && bIsArr) {
    diffArrays(a as unknown[], b as unknown[], path, out, opts)
    return
  }

  if (aIsObj && bIsObj) {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)
    const keys = new Set([...aKeys, ...bKeys])
    for (const key of keys) {
      const childPath = `${path}.${key}`
      if (!(key in aObj)) {
        out.push({ path: childPath, kind: 'added', after: bObj[key] })
        continue
      }
      if (!(key in bObj)) {
        out.push({ path: childPath, kind: 'removed', before: aObj[key] })
        continue
      }
      const av = aObj[key]
      const bv = bObj[key]
      if (deepEqual(av, bv)) {
        // Content is fully identical (at every nested level) — the only thing left worth
        // reporting *at this level* is whether this key changed position relative to its
        // siblings, e.g. two XML sibling tags swapping places with no value change. We still
        // recurse below even though content matches here, since a deeper level could have its
        // own internal reordering while still being "equal" content-wise overall.
        const ai = aKeys.indexOf(key)
        const bi = bKeys.indexOf(key)
        if (ai !== bi) {
          out.push({ path: childPath, kind: 'moved', before: av, after: bv, fromIndex: ai, toIndex: bi })
        }
      }
      walk(av, bv, childPath, out, opts)
    }
    return
  }

  // primitive / mismatched-type comparison
  if (deepEqual(a, b)) return
  if (a === undefined) {
    out.push({ path, kind: 'added', after: b })
  } else if (b === undefined) {
    out.push({ path, kind: 'removed', before: a })
  } else {
    out.push({ path, kind: 'changed', before: a, after: b })
  }
}

/**
 * Array diffing in two passes:
 * 1. Exact-match pass — elements that are deeply equal but sit at a different index are
 *    reported once as 'moved' rather than as a spurious removed+added pair.
 * 2. Remaining, unmatched elements are compared positionally (changed/added/removed),
 *    or — if ignoreArrayOrder is set and everything left is a primitive — sorted first.
 */
function diffArrays(a: unknown[], b: unknown[], path: string, out: DiffEntry[], opts: Options) {
  const usedA = new Set<number>()
  const usedB = new Set<number>()
  const bByValue = new Map<string, number[]>()

  b.forEach((val, i) => {
    const key = stableKey(val)
    const list = bByValue.get(key) ?? []
    list.push(i)
    bByValue.set(key, list)
  })

  // Pass 1: exact matches, tracking moves.
  a.forEach((val, i) => {
    const key = stableKey(val)
    const candidates = bByValue.get(key)
    if (!candidates || candidates.length === 0) return
    const j = candidates.shift()!
    usedA.add(i)
    usedB.add(j)
    if (i !== j) {
      out.push({ path: `${path}[${i}\u2192${j}]`, kind: 'moved', before: val, after: val, fromIndex: i, toIndex: j })
    }
    // stableKey matching ignores nested key order by design (so reordered-but-equal elements
    // still match), which means a deeper reorder inside this element wouldn't otherwise be
    // seen — recurse so that's still caught. Since content is already confirmed equal here,
    // anything this recursion finds will purely be 'moved' entries, never spurious changes.
    walk(val, b[j], `${path}[${j}]`, out, opts)
  })

  const remainingA = a.map((_v, i) => i).filter((i) => !usedA.has(i))
  const remainingB = b.map((_v, i) => i).filter((i) => !usedB.has(i))

  if (opts.ignoreArrayOrder && remainingA.every((i) => isPrimitive(a[i])) && remainingB.every((i) => isPrimitive(b[i]))) {
    const aVals = remainingA.map((i) => a[i]).sort()
    const bVals = remainingB.map((i) => b[i]).sort()
    for (let k = 0; k < Math.max(aVals.length, bVals.length); k++) {
      if (k >= aVals.length) out.push({ path: `${path}[+${k}]`, kind: 'added', after: bVals[k] })
      else if (k >= bVals.length) out.push({ path: `${path}[-${k}]`, kind: 'removed', before: aVals[k] })
      else if (!deepEqual(aVals[k], bVals[k])) out.push({ path: `${path}[~${k}]`, kind: 'changed', before: aVals[k], after: bVals[k] })
    }
    return
  }

  // Pass 2: pair remaining indices positionally.
  const max = Math.max(remainingA.length, remainingB.length)
  for (let k = 0; k < max; k++) {
    const ai = remainingA[k]
    const bi = remainingB[k]
    if (ai === undefined) out.push({ path: `${path}[${bi}]`, kind: 'added', after: b[bi] })
    else if (bi === undefined) out.push({ path: `${path}[${ai}]`, kind: 'removed', before: a[ai] })
    else walk(a[ai], b[bi], `${path}[${ai === bi ? ai : `${ai}\u2192${bi}`}]`, out, opts)
  }
}

function stableKey(v: unknown): string {
  try {
    return JSON.stringify(v, sortedReplacer)
  } catch {
    return String(v)
  }
}

function sortedReplacer(_key: string, value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value as object)
      .sort()
      .reduce((acc: Record<string, unknown>, k) => {
        acc[k] = (value as Record<string, unknown>)[k]
        return acc
      }, {})
  }
  return value
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isPrimitive(v: unknown): boolean {
  return v === null || typeof v !== 'object'
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object)
    const bKeys = Object.keys(b as object)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
  }
  return false
}
