import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

const sample = `{
  "d": {
    "results": [
      {
        "__metadata": { "type": "GWSAMPLE_BASIC.Product" },
        "ProductID": "HT-1000",
        "Name": "Notebook Basic 15",
        "Price": "956.00",
        "CurrencyCode": "EUR"
      },
      {
        "__metadata": { "type": "GWSAMPLE_BASIC.Product" },
        "ProductID": "HT-1001",
        "Name": "Notebook Basic 17",
        "Price": "1249.00",
        "CurrencyCode": "EUR"
      }
    ]
  }
}`

interface Shape {
  entitySet: string
  count: number
  version: 'v2' | 'v4' | 'unknown'
  fields: { name: string; type: string }[]
}

function detectShape(value: unknown): Shape | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>

  // OData v2: { d: { results: [...] } } or { d: {...} }
  if ('d' in obj) {
    const d = obj.d as Record<string, unknown>
    const results = Array.isArray(d.results) ? d.results : d ? [d] : []
    return buildShape(results, 'v2')
  }

  // OData v4: { value: [...] }
  if (Array.isArray(obj.value)) {
    return buildShape(obj.value as unknown[], 'v4')
  }

  return null
}

function buildShape(rows: unknown[], version: 'v2' | 'v4'): Shape {
  const first = (rows[0] as Record<string, unknown>) ?? {}
  const meta = first.__metadata as Record<string, unknown> | undefined
  const entitySet = (meta?.type as string) ?? 'unknown entity'
  const fields = Object.entries(first)
    .filter(([k]) => k !== '__metadata')
    .map(([k, v]) => ({ name: k, type: typeof v }))
  return { entitySet, count: rows.length, version, fields }
}

export default function OData() {
  const [input, setInput] = useState(sample)
  const [error, setError] = useState<string | null>(null)

  const { output, shape } = useMemo(() => {
    if (!input.trim()) {
      setError(null)
      return { output: '', shape: null as Shape | null }
    }
    try {
      const parsed = parseJSON(input)
      setError(null)
      return { output: stringifyJSON(parsed, true), shape: detectShape(parsed) }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse this response.')
      return { output: '', shape: null }
    }
  }, [input])

  return (
    <>
      <ManifestStrip
        eyebrow="04 · SAP payload helpers"
        title="OData response beautifier"
        description="Format Gateway (v2) or v4 JSON responses and surface the entity shape at a glance."
        badges={['odata json']}
      />
      <StatusTicker error={error} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="Input" tag="json" value={input} onChange={setInput} minHeightClass="min-h-[380px]" />
          <CodePane label="Formatted" tag="json" value={output} readOnly minHeightClass="min-h-[380px]" />
        </div>

        {shape && (
          <div className="border border-line rounded-md overflow-hidden bg-panel">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text flex items-center gap-2">
              <span>Entity shape</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border border-line text-signal">
                {shape.version === 'v2' ? 'OData v2' : 'OData v4'}
              </span>
            </div>
            <div className="px-3.5 py-3 text-[12px] flex flex-col gap-2">
              <div className="font-mono text-ink-text-dim">
                {shape.entitySet} <span className="text-ink-text-dim/70">· {shape.count} row(s)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shape.fields.map((f) => (
                  <span key={f.name} className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm border border-line text-ink-text">
                    {f.name}
                    <span className="text-ink-text-dim">:{f.type}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
