import { useState } from 'react'
import ConvertPage from '../../components/ConvertPage'
import { parseEDI, stringifyEDI, ediToJSON, jsonToEDI } from '../../lib/formats/edi'
import { stringifyJSON, parseJSON } from '../../lib/formats/json'

const ediSample = [
  'ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *210101*1200*U*00401*000000001*0*P*>',
  'GS*PO*SENDERID*RECEIVERID*20210101*1200*1*X*004010',
  'ST*850*0001',
  'BEG*00*SA*PO123456**20210101',
  'REF*DP*DEPT01',
  'SE*4*0001',
  'GE*1*1',
  'IEA*1*000000001',
].join('~') + '~'

const jsonSample = stringifyJSON(ediToJSON(parseEDI(ediSample)), true)

export default function EdiJson() {
  const [override, setOverride] = useState(false)
  const [segSep, setSegSep] = useState('~')
  const [eleSep, setEleSep] = useState('*')
  const [compSep, setCompSep] = useState(':')

  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="EDI (X12/EDIFACT) ⇄ JSON"
      description="Separators are auto-detected from ISA (X12) or UNA/UNB (EDIFACT) — override below if your payload uses non-standard ones."
      formatA={{
        name: 'EDI',
        tag: 'edi',
        parse: (text) => {
          const doc = parseEDI(text, override ? { segment: segSep, element: eleSep, component: compSep } : undefined)
          return ediToJSON(doc)
        },
        stringify: (v) => stringifyEDI(jsonToEDI(v), true),
        sample: ediSample,
      }}
      formatB={{
        name: 'JSON',
        tag: 'json',
        parse: parseJSON,
        stringify: (v) => stringifyJSON(v, true),
        sample: jsonSample,
      }}
      extraControls={
        <>
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
            <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} className="accent-signal" />
            override separators
          </label>
          {override && (
            <>
              <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
                <span>segment</span>
                <input
                  value={segSep}
                  onChange={(e) => setSegSep(e.target.value)}
                  className="bg-panel border border-line rounded-sm px-2 py-1 text-paper w-12 text-center"
                />
              </label>
              <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
                <span>element</span>
                <input
                  value={eleSep}
                  onChange={(e) => setEleSep(e.target.value)}
                  className="bg-panel border border-line rounded-sm px-2 py-1 text-paper w-12 text-center"
                />
              </label>
              <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
                <span>component</span>
                <input
                  value={compSep}
                  onChange={(e) => setCompSep(e.target.value)}
                  className="bg-panel border border-line rounded-sm px-2 py-1 text-paper w-12 text-center"
                />
              </label>
            </>
          )}
        </>
      }
    />
  )
}
