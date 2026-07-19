export interface EdiSeparators {
  segment: string
  element: string
  component: string
  release?: string
}

export interface EdiSegment {
  tag: string
  /** Each element is a plain string, or an array of strings if it has sub-components. */
  elements: (string | string[])[]
}

export interface EdiDocument {
  segments: EdiSegment[]
  separators: EdiSeparators
  standard: 'X12' | 'EDIFACT' | 'unknown'
}

const X12_DEFAULTS: EdiSeparators = { segment: '~', element: '*', component: ':' }
const EDIFACT_DEFAULTS: EdiSeparators = { segment: "'", element: '+', component: ':', release: '?' }

/** Reads the fixed-position ISA segment to recover the exact separators an X12 interchange was written with. */
function detectX12Separators(text: string): EdiSeparators | null {
  if (!text.startsWith('ISA')) return null
  const element = text[3]
  if (!element) return null
  let pos = 3
  for (let i = 0; i < 15; i++) {
    const next = text.indexOf(element, pos + 1)
    if (next === -1) return null
    pos = next
  }
  const component = text[pos + 1]
  const segment = text[pos + 2]
  if (!component || !segment) return null
  return { segment, element, component }
}

/** Reads an explicit EDIFACT UNA service-string-advice segment, if present. */
function detectEdifactSeparators(text: string): EdiSeparators | null {
  const trimmed = text.trimStart()
  if (trimmed.startsWith('UNA') && trimmed.length >= 9) {
    return {
      component: trimmed[3],
      element: trimmed[4],
      release: trimmed[6],
      segment: trimmed[8],
    }
  }
  if (trimmed.startsWith('UNB')) return EDIFACT_DEFAULTS
  return null
}

export function detectSeparators(text: string): { separators: EdiSeparators; standard: EdiDocument['standard'] } {
  const trimmed = text.trim()
  const x12 = detectX12Separators(trimmed)
  if (x12) return { separators: x12, standard: 'X12' }
  const edifact = detectEdifactSeparators(trimmed)
  if (edifact) return { separators: edifact, standard: 'EDIFACT' }
  return { separators: X12_DEFAULTS, standard: 'unknown' }
}

/** Splits on `sep`, treating `sep` as literal (not a delimiter) wherever it's preceded by the release character. */
function splitRespectingRelease(text: string, sep: string, release?: string): string[] {
  if (!release) return text.split(sep)
  const parts: string[] = []
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === release && i + 1 < text.length) {
      current += text[i + 1]
      i++
      continue
    }
    if (ch === sep) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

export function parseEDI(text: string, overrides?: Partial<EdiSeparators>): EdiDocument {
  if (!text.trim()) throw new Error('Input is empty.')
  const detected = detectSeparators(text)
  const separators: EdiSeparators = { ...detected.separators, ...overrides }

  const rawSegments = splitRespectingRelease(text, separators.segment, separators.release)
    .map((s) => s.replace(/[\r\n]+/g, '').trim())
    .filter(Boolean)

  if (rawSegments.length === 0) throw new Error('No segments found — check the segment terminator.')

  const segments: EdiSegment[] = rawSegments.map((raw) => {
    const parts = splitRespectingRelease(raw, separators.element, separators.release)
    const tag = parts[0]
    const elements = parts.slice(1).map((el) => {
      if (!el.includes(separators.component)) return el
      const comps = splitRespectingRelease(el, separators.component, separators.release)
      return comps.length > 1 ? comps : el
    })
    return { tag, elements }
  })

  return { segments, separators, standard: detected.standard }
}

export function stringifyEDI(doc: EdiDocument, pretty = true): string {
  const { segment: segSep, element: eleSep, component: compSep } = doc.separators
  const lines = doc.segments.map((seg) => {
    const elementText = seg.elements.map((el) => (Array.isArray(el) ? el.join(compSep) : el)).join(eleSep)
    return `${seg.tag}${elementText ? eleSep + elementText : ''}${segSep}`
  })
  return lines.join(pretty ? '\n' : '')
}

export function ediToJSON(doc: EdiDocument): { standard: string; separators: EdiSeparators; segments: EdiSegment[] } {
  return { standard: doc.standard, separators: doc.separators, segments: doc.segments }
}

export function jsonToEDI(value: unknown): EdiDocument {
  const v = value as { standard?: EdiDocument['standard']; separators?: EdiSeparators; segments?: EdiSegment[] }
  if (!v.segments || !v.separators) {
    throw new Error('Expected an object with "separators" and "segments" — did this come from the EDI\u2192JSON conversion?')
  }
  return { standard: v.standard ?? 'unknown', separators: v.separators, segments: v.segments }
}

export interface EnvelopeWarning {
  message: string
}

/** Soft, non-fatal envelope checks — balanced header/trailer pairs and matching control numbers where the position is unambiguous. */
export function validateEnvelope(doc: EdiDocument): EnvelopeWarning[] {
  const warnings: EnvelopeWarning[] = []
  const tags = doc.segments.map((s) => s.tag)
  const count = (t: string) => tags.filter((x) => x === t).length

  const checkPair = (open: string, close: string) => {
    const openCount = count(open)
    const closeCount = count(close)
    if (openCount !== closeCount) {
      warnings.push({ message: `${openCount} ${open} segment(s) but ${closeCount} ${close} segment(s) — these should match.` })
    }
  }

  if (doc.standard === 'X12' || tags.includes('ISA')) {
    checkPair('ISA', 'IEA')
    checkPair('GS', 'GE')
    checkPair('ST', 'SE')
    const isa = doc.segments.find((s) => s.tag === 'ISA')
    const iea = doc.segments.find((s) => s.tag === 'IEA')
    if (isa && iea) {
      const isaCtrl = isa.elements[12]
      const ieaCtrl = iea.elements[1]
      if (isaCtrl !== undefined && ieaCtrl !== undefined && isaCtrl !== ieaCtrl) {
        warnings.push({ message: `ISA interchange control number (${isaCtrl}) doesn't match IEA (${ieaCtrl}).` })
      }
    }
  } else if (doc.standard === 'EDIFACT' || tags.includes('UNB')) {
    checkPair('UNB', 'UNZ')
    checkPair('UNH', 'UNT')
    const unb = doc.segments.find((s) => s.tag === 'UNB')
    const unz = doc.segments.find((s) => s.tag === 'UNZ')
    if (unb && unz) {
      const unbCtrl = unb.elements[4]
      const unzCtrl = unz.elements[1]
      if (unbCtrl !== undefined && unzCtrl !== undefined && unbCtrl !== unzCtrl) {
        warnings.push({ message: `UNB interchange control reference (${unbCtrl}) doesn't match UNZ (${unzCtrl}).` })
      }
    }
  } else {
    warnings.push({ message: 'Could not recognize an X12 (ISA…) or EDIFACT (UNB…) envelope — showing raw segments only.' })
  }

  return warnings
}
