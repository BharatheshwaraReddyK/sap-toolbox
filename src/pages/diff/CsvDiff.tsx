import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import ReportDownload from '../../components/ReportDownload'
import WordDiff from '../../components/WordDiff'
import { parseCSV } from '../../lib/formats/csv'
import { diffCSV, type CSVRowDiff } from '../../lib/diff/csvDiff'
import { computeLineDiff } from '../../lib/diff/lineDiff'
import type { DiffReportData } from '../../lib/report'

const a = `sku,description,qty
A100,Widget,2
B200,Bracket,1
C300,Bolt,5`

const b = `sku,description,qty
B200,Bracket,1
A100,Widget Mk II,2
D400,Washer,10`

const statusStyle: Record<CSVRowDiff['status'], string> = {
  added: 'text-add border-add/30 bg-add/10',
  removed: 'text-alert border-alert/30 bg-alert/10',
  changed: 'text-warn border-warn/30 bg-warn/10',
  moved: 'text-move border-move/30 bg-move/10',
  unchanged: 'text-ink-text-dim border-line',
}

const statusSymbol: Record<CSVRowDiff['status'], string> = {
  added: '+',
  removed: '−',
  changed: '~',
  moved: '⇄',
  unchanged: '=',
}

const statusLabel: Record<CSVRowDiff['status'], string> = {
  added: 'only in B',
  removed: 'only in A',
  changed: 'modified',
  moved: 'moved / shuffled',
  unchanged: 'unchanged',
}

export default function CsvDiff() {
  const [left, setLeft] = useState(a)
  const [right, setRight] = useState(b)
  const [keyField, setKeyField] = useState('')

  const { rows, fields, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) return { rows: [] as CSVRowDiff[], fields: [] as string[], error: null }
    try {
      const parsedA = parseCSV(left)
      const parsedB = parseCSV(right)
      const fields = [...new Set([...parsedA.fields, ...parsedB.fields])]
      return { rows: diffCSV(parsedA, parsedB, keyField || undefined), fields, error: null }
    } catch (e) {
      return { rows: [] as CSVRowDiff[], fields: [] as string[], error: e instanceof Error ? e.message : 'Could not compare inputs.' }
    }
  }, [left, right, keyField])

  const changedCount = rows.filter((r) => r.status !== 'unchanged').length
  const summary = !error && rows.length ? `${changedCount} of ${rows.length} row(s) differ` : null

  function buildReportData(): DiffReportData {
    const { entries: lines, stats } = computeLineDiff(left, right)
    return {
      title: 'CSV diff',
      generatedAt: new Date(),
      labelA: 'Source (A) — as pasted',
      labelB: 'Target (B) — as pasted',
      rawA: left,
      rawB: right,
      stats,
      lines,
      note: 'The diff below compares the pasted CSV text line-by-line.',
    }
  }

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
        <div className="flex items-center justify-between flex-wrap gap-3">
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
          <ReportDownload filenameBase="csv-diff-report" buildData={buildReportData} disabled={changedCount === 0} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="A — before" tag="csv" value={left} onChange={setLeft} minHeightClass="min-h-[240px]" />
          <CodePane label="B — after" tag="csv" value={right} onChange={setRight} minHeightClass="min-h-[240px]" />
        </div>

        {rows.length > 0 && (
          <div className="border border-line rounded-md overflow-hidden bg-panel">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
              Row-level differences
            </div>
            <ul className="divide-y divide-line-soft">
              {rows.map((r) => (
                <li key={r.key} className="px-3.5 py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${statusStyle[r.status]}`}>
                      {statusSymbol[r.status]} {statusLabel[r.status]}
                    </span>
                    <code className="text-[12px] text-paper">{r.key}</code>
                  </div>
                  {r.status === 'changed' &&
                    r.changedFields.map((f) => {
                      const beforeVal = r.before?.[f] ?? ''
                      const afterVal = r.after?.[f] ?? ''
                      return (
                        <div key={f} className="pl-1">
                          <div className="text-[11px] font-mono text-ink-text-dim mb-0.5">{f}</div>
                          <WordDiff before={beforeVal} after={afterVal} />
                        </div>
                      )
                    })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
