import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import { parseCSV } from '../../lib/formats/csv'
import { diffCSV } from '../../lib/diff/csvDiff'

const a = `sku,description,qty
A100,Widget,2
B200,Bracket,1`

const b = `sku,description,qty
A100,Widget,3
B200,Bracket,1
C300,Bolt,5`

const statusStyle: Record<string, string> = {
  added: 'text-add border-add/30 bg-add/10',
  removed: 'text-alert border-alert/30 bg-alert/10',
  changed: 'text-signal border-signal/30 bg-signal/10',
  unchanged: 'text-ink-text-dim border-line',
}

export default function CsvDiff() {
  const [left, setLeft] = useState(a)
  const [right, setRight] = useState(b)
  const [keyField, setKeyField] = useState('')

  const { rows, fields, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) return { rows: [], fields: [] as string[], error: null }
    try {
      const parsedA = parseCSV(left)
      const parsedB = parseCSV(right)
      const fields = [...new Set([...parsedA.fields, ...parsedB.fields])]
      return { rows: diffCSV(parsedA, parsedB, keyField || undefined), fields, error: null }
    } catch (e) {
      return { rows: [], fields: [] as string[], error: e instanceof Error ? e.message : 'Could not compare inputs.' }
    }
  }, [left, right, keyField])

  const summary = !error && rows.length
    ? `${rows.filter((r) => r.status !== 'unchanged').length} of ${rows.length} row(s) differ`
    : null

  return (
    <>
      <ManifestStrip
        eyebrow="03 · compare"
        title="CSV diff"
        description="Compares row-by-row by default. Pick a key column to match rows regardless of order."
        badges={['csv', 'diff']}
      />
      <StatusTicker error={error} ok={summary} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
          <span>match rows by</span>
          <select
            value={keyField}
            onChange={(e) => setKeyField(e.target.value)}
            className="bg-panel border border-line rounded-sm px-2 py-1 text-paper"
          >
            <option value="">row position</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="A — before" tag="csv" value={left} onChange={setLeft} minHeightClass="min-h-[240px]" />
          <CodePane label="B — after" tag="csv" value={right} onChange={setRight} minHeightClass="min-h-[240px]" />
        </div>

        {rows.length > 0 && (
          <div className="border border-line rounded-md overflow-hidden">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
              Row-level differences
            </div>
            <ul className="divide-y divide-line-soft">
              {rows.map((r) => (
                <li key={r.key} className="px-3.5 py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                    <code className="text-[12px] text-paper">{r.key}</code>
                  </div>
                  {r.status === 'changed' &&
                    r.changedFields.map((f) => (
                      <div key={f} className="text-[12px] font-mono pl-1">
                        <span className="text-ink-text-dim">{f}: </span>
                        <span className="text-alert/90">{r.before?.[f] ?? '∅'}</span>
                        <span className="text-ink-text-dim"> → </span>
                        <span className="text-add/90">{r.after?.[f] ?? '∅'}</span>
                      </div>
                    ))}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
