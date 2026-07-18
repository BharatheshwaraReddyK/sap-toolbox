import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import Button from '../../components/Button'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

interface MappingRow {
  id: string
  source: string
  target: string
}

const sample = `{
  "ProductID": "HT-1000",
  "Name": "Notebook Basic 15",
  "Price": "956.00",
  "CurrencyCode": "EUR",
  "Supplier": { "Name": "Notebook Company" }
}`

const defaultRows: MappingRow[] = [
  { id: '1', source: 'ProductID', target: 'sku' },
  { id: '2', source: 'Name', target: 'description' },
  { id: '3', source: 'Price', target: 'price.amount' },
  { id: '4', source: 'CurrencyCode', target: 'price.currency' },
  { id: '5', source: 'Supplier.Name', target: 'supplierName' },
]

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split(/\.|\[(\d+)\]/).filter((p) => p !== undefined && p !== '')
  let node: unknown = obj
  for (const part of parts) {
    if (node === null || node === undefined) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return node
}

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let node = target
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (typeof node[p] !== 'object' || node[p] === null) node[p] = {}
    node = node[p] as Record<string, unknown>
  }
  node[parts[parts.length - 1]] = value
}

export default function MappingDesigner() {
  const [input, setInput] = useState(sample)
  const [rows, setRows] = useState<MappingRow[]>(defaultRows)
  const [error, setError] = useState<string | null>(null)

  const output = useMemo(() => {
    if (!input.trim()) {
      setError(null)
      return ''
    }
    try {
      const source = parseJSON(input)
      const target: Record<string, unknown> = {}
      for (const row of rows) {
        if (!row.source.trim() || !row.target.trim()) continue
        setPath(target, row.target.trim(), getPath(source, row.source.trim()))
      }
      setError(null)
      return stringifyJSON(target, true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply this mapping.')
      return ''
    }
  }, [input, rows])

  function updateRow(id: string, field: 'source' | 'target', value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), source: '', target: '' }])
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <>
      <ManifestStrip
        eyebrow="04 · SAP payload helpers"
        title="Mapping designer"
        description="Define source → target field paths (dot notation, e.g. Supplier.Name) and preview the result on a sample payload."
        badges={['json']}
      />
      <StatusTicker error={error} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="border border-line rounded-md overflow-hidden bg-panel">
          <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
            Field mappings
          </div>
          <div className="divide-y divide-line-soft">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 px-3.5 py-2">
                <input
                  value={row.source}
                  onChange={(e) => updateRow(row.id, 'source', e.target.value)}
                  placeholder="source path"
                  className="flex-1 bg-transparent border border-line rounded-sm px-2 py-1 text-[12px] font-mono text-paper placeholder:text-ink-text-dim/60"
                />
                <span className="font-mono text-signal text-[12px]">→</span>
                <input
                  value={row.target}
                  onChange={(e) => updateRow(row.id, 'target', e.target.value)}
                  placeholder="target path"
                  className="flex-1 bg-transparent border border-line rounded-sm px-2 py-1 text-[12px] font-mono text-paper placeholder:text-ink-text-dim/60"
                />
                <button
                  onClick={() => removeRow(row.id)}
                  className="font-mono text-[11px] text-ink-text-dim hover:text-alert px-1"
                  aria-label="Remove mapping"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="px-3.5 py-2 border-t border-line-soft">
            <Button variant="ghost" onClick={addRow}>
              + add mapping
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="Source sample" tag="json" value={input} onChange={setInput} minHeightClass="min-h-[280px]" />
          <CodePane label="Mapped output" tag="json" value={output} readOnly minHeightClass="min-h-[280px]" />
        </div>
      </div>
    </>
  )
}
