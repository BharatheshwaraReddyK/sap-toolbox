export function parseJSON(text: string): unknown {
  if (!text.trim()) throw new Error('Input is empty.')
  try {
    return JSON.parse(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON'
    throw new Error(`JSON parse error — ${msg}`)
  }
}

export function stringifyJSON(value: unknown, pretty = true): string {
  return JSON.stringify(value, null, pretty ? 2 : 0)
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeysDeep((value as Record<string, unknown>)[key])
    }
    return out
  }
  return value
}
