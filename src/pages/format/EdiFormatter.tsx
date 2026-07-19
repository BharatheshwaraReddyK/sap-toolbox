import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import { parseEDI, stringifyEDI, validateEnvelope, type EdiSegment } from '../../lib/formats/edi'

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

function SegmentRow({ segment }: { segment: EdiSegment }) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-1.5 border-b border-line-soft last:border-b-0">
      <span className="font-mono text-[12px] text-signal w-10 shrink-0">{segment.tag}</span>
      <div className="flex flex-wrap gap-1.5">
        {segment.elements.map((el, i) => (
          <span
            key={i}
            className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm border border-line text-ink-text"
            title={`element ${i + 1}`}
          >
            {Array.isArray(el) ? el.join(' : ') : el || '∅'}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function EdiFormatter() {
  const [input, setInput] = useState(sample)
  const [minify, setMinify] = useState(false)

  const { output, segments, warnings, standard, separators, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', segments: [] as EdiSegment[], warnings: [] as string[], standard: '', separators: null, error: null }
    }
    try {
      const doc = parseEDI(input)
      const envelopeWarnings = validateEnvelope(doc).map((w) => w.message)
      return {
        output: stringifyEDI(doc, !minify),
        segments: doc.segments,
        warnings: envelopeWarnings,
        standard: doc.standard,
        separators: doc.separators,
        error: null,
      }
    } catch (e) {
      return {
        output: '',
        segments: [] as EdiSegment[],
        warnings: [] as string[],
        standard: '',
        separators: null,
        error: e instanceof Error ? e.message : 'Could not parse this EDI payload.',
      }
    }
  }, [input, minify])

  const ok = !error && segments.length
    ? warnings.length
      ? `${standard === 'unknown' ? 'unrecognized envelope' : standard} — ${segments.length} segment(s) — ${warnings.length} warning(s)`
      : `${standard} — ${segments.length} segment(s), envelope balanced`
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
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
            <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} className="accent-signal" />
            minify (single line)
          </label>
          {separators && (
            <span className="font-mono text-[11px] text-ink-text-dim">
              separators — segment <code className="text-paper">{JSON.stringify(separators.segment)}</code>, element{' '}
              <code className="text-paper">{JSON.stringify(separators.element)}</code>, component{' '}
              <code className="text-paper">{JSON.stringify(separators.component)}</code>
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

        {segments.length > 0 && (
          <div className="border border-line rounded-md overflow-hidden bg-panel">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
              Segments
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {segments.map((s, i) => (
                <SegmentRow key={i} segment={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
