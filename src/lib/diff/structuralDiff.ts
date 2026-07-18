export type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged'

export interface DiffEntry {
  path: string
  kind: DiffKind
  before?: unknown
  after?: unknown
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
  if (deepEqual(a, b)) return

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
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
    for (const key of keys) {
      const childPath = `${path}.${key}`
      if (!(key in aObj)) {
        out.push({ path: childPath, kind: 'added', after: bObj[key] })
      } else if (!(key in bObj)) {
        out.push({ path: childPath, kind: 'removed', before: aObj[key] })
      } else {
        walk(aObj[key], bObj[key], childPath, out, opts)
      }
    }
    return
  }

  // type mismatch or primitive change
  if (a === undefined) {
    out.push({ path, kind: 'added', after: b })
  } else if (b === undefined) {
    out.push({ path, kind: 'removed', before: a })
  } else {
    out.push({ path, kind: 'changed', before: a, after: b })
  }
}

function diffArrays(a: unknown[], b: unknown[], path: string, out: DiffEntry[], opts: Options) {
  if (opts.ignoreArrayOrder && a.every(isPrimitive) && b.every(isPrimitive)) {
    const aSet = [...a].sort()
    const bSet = [...b].sort()
    for (let i = 0; i < Math.max(aSet.length, bSet.length); i++) {
      if (!deepEqual(aSet[i], bSet[i])) {
        out.push({ path: `${path}[${i}]`, kind: aSet[i] === undefined ? 'added' : bSet[i] === undefined ? 'removed' : 'changed', before: aSet[i], after: bSet[i] })
      }
    }
    return
  }
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    const childPath = `${path}[${i}]`
    if (i >= a.length) out.push({ path: childPath, kind: 'added', after: b[i] })
    else if (i >= b.length) out.push({ path: childPath, kind: 'removed', before: a[i] })
    else walk(a[i], b[i], childPath, out, opts)
  }
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
