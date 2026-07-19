import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import { parseEDI, stringifyEDI, validateEnvelope, type EdiSegment, type EdiDocument } from '../../lib/formats/edi'
import { describeSegment, X12_TRANSACTION_SETS, EDIFACT_MESSAGE_TYPES } from '../../lib/formats/ediGlossary'

const sample = [
  'ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *210101*1200*U*00401*000000001*0*P*>',
  'GS*PO*SENDERID*RECEIVERID*20210101*1200*1*X*004010',
  'ST*850*0001',
  'BEG*00*SA*PO123456**20210101',
  'REF*DP*DEPT01',
  'SE*4*0001',
  'GE*1*1',
  'IEA*1*000000001',
].join('~') + '~'

const standardBlurb: Record<EdiDocument['standard'], string> = {
  X12: 'ANSI ASC X12 — the standard most common in North America (retail, logistics, healthcare/HIPAA). Segments are separated by ~, elements by *.',
  EDIFACT: 'UN/EDIFACT — the international standard (common in Europe and global supply chains). Segments end with \', elements are separated by +.',
  unknown: 'Could not recognize an X12 (starts with ISA) or EDIFACT (starts with UNA/UNB) envelope.',
}

function documentTypeLabel(doc: EdiDocument): string | null {
  if (doc.standard === 'X12') {
    const st = doc.segments.find((s) => s.tag === 'ST')
    const code = st?.elements[0]
    if (typeof code === 'string' && X12_TRANSACTION_SETS[code]) return `Transaction set ${code} — ${X12_TRANSACTION_SETS[code]}`
    if (typeof code === 'string') return `Transaction set ${code} (not in the built-in glossary)`
  }
  if (doc.standard === 'EDIFACT') {
    const unh = doc.segments.find((s) => s.tag === 'UNH')
    const second = unh?.elements[1]
    const code = Array.isArray(second) ? second[0] : second
    if (typeof code === 'string' && EDIFACT_MESSAGE_TYPES[code]) return `${code} — ${EDIFACT_MESSAGE_TYPES[code]}`
    if (typeof code === 'string') return `Message type ${code} (not in the built-in glossary)`
  }
  return null
}

function SegmentRow({ segment, standard }: { segment: EdiSegment; standard: EdiDocument['standard'] }) {
  const description = describeSegment(segment.tag, standard)
  return (
    <div className="flex flex-col gap-1 px-3.5 py-2 border-b border-line-soft last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[12px] text-signal w-10 shrink-0">{segment.tag}</span>
        <div className="flex flex-wrap gap-1.5">
          {segment.elements.map((el, i) => (
            <span
              key={i}
              className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm border border-line text-ink-text"
              title={`element ${i + 1}`}
            >
              {Array.isArray(el) ? el.join(' : ') : el || '\u2205'}
            </span>
          ))}
        </div>
      </div>
      {description && <div className="text-[11px] text-ink-text-dim pl-[52px]">{description}</div>}
    </div>
  )
}

export default function EdiFormatter() {
  const [input, setInput] = useState(sample)
  const [minify, setMinify] = useState(false)

  const { output, doc, warnings, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', doc: null as EdiDocument | null, warnings: [] as string[], error: null }
    }
    try {
      const parsed = parseEDI(input)
      const envelopeWarnings = validateEnvelope(parsed).map((w) => w.message)
      return { output: stringifyEDI(parsed, !minify), doc: parsed, warnings: envelopeWarnings, error: null }
    } catch (e) {
      return {
        output: '',
        doc: null as EdiDocument | null,
        warnings: [] as string[],
        error: e instanceof Error ? e.message : 'Could not parse this EDI payload.',
      }
    }
  }, [input, minify])

  const docType = doc ? documentTypeLabel(doc) : null
  const ok =
    !error && doc
      ? warnings.length
        ? `${doc.standard === 'unknown' ? 'unrecognized envelope' : doc.standard} \u2014 ${doc.segments.length} segment(s) \u2014 ${warnings.length} warning(s)`
        : `${doc.standard} \u2014 ${doc.segments.length} segment(s), envelope balanced`
      : null

  return (
    <>
      <ManifestStrip
        eyebrow="02 · format & validate"
        title="EDI formatter & validator"
        description="Auto-detects X12 or EDIFACT separators, re-emits one segment per line (or minified), and checks envelope pairs balance (ISA/IEA, GS/GE, ST/SE, or UNB/UNZ, UNH/UNT)."
        badges={['edi']}
      />
      <StatusTicker error={error} ok={ok} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        {doc && (
          <div className="rounded-md border border-line bg-panel px-4 py-3 flex flex-col gap-1.5">
            <div className="text-[12px] text-ink-text">
              <span className="text-signal font-medium">{doc.standard === 'unknown' ? 'Unrecognized format' : doc.standard}</span>
              {' — '}
              {standardBlurb[doc.standard]}
            </div>
            {docType && <div className="text-[12px] text-paper">{docType}</div>}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
            <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} className="accent-signal" />
            minify (single line)
          </label>
          {doc && (
            <span className="font-mono text-[11px] text-ink-text-dim">
              separators — segment <code className="text-paper">{JSON.stringify(doc.separators.segment)}</code>, element{' '}
              <code className="text-paper">{JSON.stringify(doc.separators.element)}</code>, component{' '}
              <code className="text-paper">{JSON.stringify(doc.separators.component)}</code>
            </span>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {warnings.map((w, i) => (
              <div key={i} className="font-mono text-[12px] text-warn px-3.5 py-2 rounded-sm border border-warn/30 bg-warn/10">
                {w}
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="Input" tag="edi" value={input} onChange={setInput} placeholder="Paste X12 or EDIFACT text here…" minHeightClass="min-h-[380px]" />
          <CodePane label="Formatted" tag="edi" value={output} readOnly minHeightClass="min-h-[380px]" />
        </div>

        {doc && doc.segments.length > 0 && (
          <div className="border border-line rounded-md overflow-hidden bg-panel">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
              Segments — hover isn't needed, descriptions are inline for anything in the built-in glossary
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {doc.segments.map((s, i) => (
                <SegmentRow key={i} segment={s} standard={doc.standard} />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md border border-line-soft px-4 py-3 text-[12px] text-ink-text-dim">
          <div className="text-paper font-medium mb-1.5">New to EDI? A few places to go deeper:</div>
          <ul className="flex flex-col gap-1">
            <li>
              <a href="https://www.stedi.com/edi/x12/segment" target="_blank" rel="noreferrer" className="text-signal hover:underline">
                Stedi's X12 segment reference
              </a>{' '}
              — every segment, element, and transaction set across X12 releases, free and searchable.
            </li>
            <li>
              <a href="https://www.stedi.com/edi/edifact/segments" target="_blank" rel="noreferrer" className="text-signal hover:underline">
                Stedi's EDIFACT segment reference
              </a>{' '}
              — same idea, for UN/EDIFACT.
            </li>
            <li>
              <a href="https://github.com/Stedi/awesome-edi" target="_blank" rel="noreferrer" className="text-signal hover:underline">
                awesome-edi
              </a>{' '}
              — a curated list of EDI tools, guides, and an "EDI 101" style introduction, if you want the fundamentals before diving into segment-level detail.
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
