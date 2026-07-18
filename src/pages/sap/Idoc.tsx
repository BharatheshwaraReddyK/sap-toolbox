import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import { parseXML } from '../../lib/formats/xml'
import { stringifyJSON } from '../../lib/formats/json'

const sample = `<ORDERS05>
  <IDOC BEGIN="1">
    <EDI_DC40 SEGMENT="1">
      <DOCNUM>0000000012345</DOCNUM>
      <IDOCTYP>ORDERS05</IDOCTYP>
      <MESTYP>ORDERS</MESTYP>
      <SNDPRN>VENDOR01</SNDPRN>
      <RCVPRN>CUST0001</RCVPRN>
    </EDI_DC40>
    <E1EDK01 SEGMENT="1">
      <CURCY>EUR</CURCY>
      <WKURS>1.00000</WKURS>
      <BSART>ORDR</BSART>
    </E1EDK01>
    <E1EDP01 SEGMENT="1">
      <POSEX>000010</POSEX>
      <MENGE>2</MENGE>
      <E1EDP19 SEGMENT="1">
        <QUALF>002</QUALF>
        <IDTNR>A100</IDTNR>
      </E1EDP19>
    </E1EDP01>
    <E1EDP01 SEGMENT="1">
      <POSEX>000020</POSEX>
      <MENGE>1</MENGE>
      <E1EDP19 SEGMENT="1">
        <QUALF>002</QUALF>
        <IDTNR>B200</IDTNR>
      </E1EDP19>
    </E1EDP01>
  </IDOC>
</ORDERS05>`

interface Node {
  tag: string
  fields: { name: string; value: string }[]
  children: Node[]
}

function toTree(tag: string, value: unknown): Node {
  const node: Node = { tag, fields: [], children: [] }
  if (value === null || value === undefined) return node
  if (typeof value !== 'object') {
    node.fields.push({ name: '#text', value: String(value) })
    return node
  }
  const obj = value as Record<string, unknown>
  for (const [key, v] of Object.entries(obj)) {
    if (key.startsWith('@_')) {
      node.fields.push({ name: key.slice(2), value: String(v) })
    } else if (key === '#text') {
      node.fields.push({ name: '#text', value: String(v) })
    } else if (Array.isArray(v)) {
      v.forEach((item) => node.children.push(toTree(key, item)))
    } else if (typeof v === 'object') {
      node.children.push(toTree(key, v))
    } else {
      node.fields.push({ name: key, value: String(v) })
    }
  }
  return node
}

function SegmentNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  const isSegment = /^E1[A-Z0-9]+$/.test(node.tag) || node.tag === 'EDI_DC40'
  return (
    <div className={depth > 0 ? 'ml-4 border-l border-line-soft pl-3' : ''}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 py-1 w-full text-left group"
      >
        <span className="font-mono text-[10px] text-ink-text-dim w-3">{node.children.length ? (open ? '−' : '+') : '·'}</span>
        <span className={`font-mono text-[12px] ${isSegment ? 'text-signal' : 'text-paper'}`}>{node.tag}</span>
        {isSegment && <span className="font-mono text-[9px] text-ink-text-dim border border-line rounded-sm px-1">segment</span>}
      </button>
      {open && (
        <div className="pl-5">
          {node.fields.map((f) => (
            <div key={f.name} className="font-mono text-[11px] text-ink-text-dim py-0.5">
              {f.name} <span className="text-ink-text-dim/60">=</span> <span className="text-add/90">{f.value}</span>
            </div>
          ))}
          {node.children.map((c, i) => (
            <SegmentNode key={i} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Idoc() {
  const [input, setInput] = useState(sample)
  const [error, setError] = useState<string | null>(null)

  const { tree, json } = useMemo(() => {
    if (!input.trim()) {
      setError(null)
      return { tree: null, json: '' }
    }
    try {
      const parsed = parseXML(input) as Record<string, unknown>
      const rootTag = Object.keys(parsed)[0]
      setError(null)
      return { tree: toTree(rootTag, parsed[rootTag]), json: stringifyJSON(parsed, true) }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse this IDoc.')
      return { tree: null, json: '' }
    }
  }, [input])

  return (
    <>
      <ManifestStrip
        eyebrow="04 · SAP payload helpers"
        title="IDoc viewer & converter"
        description="Paste an IDoc XML payload to explore it segment-by-segment, or read off the clean JSON on the right."
        badges={['idoc xml', 'json']}
      />
      <StatusTicker error={error} />

      <div className="px-6 sm:px-8 py-6 grid lg:grid-cols-2 gap-4">
        <CodePane label="IDoc XML" tag="xml" value={input} onChange={setInput} minHeightClass="min-h-[460px]" />

        <div className="flex flex-col gap-4">
          <div className="border border-line rounded-md overflow-hidden bg-panel">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
              Segment tree
            </div>
            <div className="px-3.5 py-3 max-h-[280px] overflow-y-auto">
              {tree ? <SegmentNode node={tree} /> : <span className="text-ink-text-dim text-[12px]">Nothing parsed yet.</span>}
            </div>
          </div>
          <CodePane label="Clean JSON" tag="json" value={json} readOnly minHeightClass="min-h-[140px]" />
        </div>
      </div>
    </>
  )
}
