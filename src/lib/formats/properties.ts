/** Parse Java-style key=value / key:value files into a nested object via dotted keys. */
export function parseProperties(text: string): Record<string, unknown> {
  if (!text.trim()) throw new Error('Input is empty.')
  const out: Record<string, unknown> = {}
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (!line || /^\s*[#!]/.test(line)) continue
    // handle trailing backslash line continuation
    while (/\\\s*$/.test(line) && i + 1 < lines.length) {
      line = line.replace(/\\\s*$/, '') + lines[++i]
    }
    const match = line.match(/^\s*([^=:\s][^=:]*?)\s*[=:]\s*(.*)\s*$/)
    if (!match) continue
    const key = unescapeProps(match[1])
    const value = unescapeProps(match[2])
    setDotted(out, key, value)
  }
  return out
}

function unescapeProps(s: string): string {
  return s.replace(/\\:/g, ':').replace(/\\=/g, '=').replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}

function setDotted(target: Record<string, unknown>, dottedKey: string, value: unknown) {
  const parts = dottedKey.split('.')
  let node = target
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (typeof node[p] !== 'object' || node[p] === null || Array.isArray(node[p])) {
      node[p] = {}
    }
    node = node[p] as Record<string, unknown>
  }
  node[parts[parts.length - 1]] = value
}

/** Flatten a nested object into dotted key=value lines. */
export function stringifyProperties(value: unknown): string {
  const lines: string[] = []
  flatten(value, '', lines)
  return lines.join('\n')
}

function flatten(value: unknown, prefix: string, lines: string[]) {
  if (value === null || value === undefined) {
    lines.push(`${prefix}=`)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, prefix ? `${prefix}[${i}]` : `[${i}]`, lines))
    return
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      lines.push(`${prefix}=`)
      return
    }
    for (const [key, val] of entries) {
      flatten(val, prefix ? `${prefix}.${key}` : key, lines)
    }
    return
  }
  lines.push(`${prefix}=${escapeProps(String(value))}`)
}

function escapeProps(s: string): string {
  return s.replace(/\n/g, '\\n').replace(/\t/g, '\\t')
}
