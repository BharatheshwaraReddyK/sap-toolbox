import { useMemo, useState } from 'react'
import ManifestStrip from './ManifestStrip'
import StatusTicker from './StatusTicker'
import CodePane from './CodePane'
import ReportDownload from './ReportDownload'
import WordDiff from './WordDiff'
import LineDiffView from './LineDiffView'
import { structuralDiff, type DiffEntry } from '../lib/diff/structuralDiff'
import { computeLineDiff, type LineEntry, type LineDiffStats } from '../lib/diff/lineDiff'
import type { DiffReportData } from '../lib/report'

interface Props {
  eyebrow: string
  title: string
  description: string
  tag: string
  sampleA: string
  sampleB: string
  parse: (text: string) => unknown
  /** Re-serializes a parsed value to canonical text for the report's line-level diff. Defaults to pretty JSON. */
  normalize?: (parsed: unknown) => string
  ignoreArrayOrderOption?: boolean
}

const kindStyle: Record<DiffEntry['kind'], string> = {
  added: 'text-add border-add/30 bg-add/10',
  removed: 'text-alert border-alert/30 bg-alert/10',
  changed: 'text-warn border-warn/30 bg-warn/10',
  moved: 'text-move border-move/30 bg-move/10',
  unchanged: 'text-ink-text-dim border-line',
}

const kindSymbol: Record<DiffEntry['kind'], string> = {
  added: '+',
  removed: '\u2212',
  changed: '~',
  moved: '\u21c4',
  unchanged: '=',
}

const kindLabel: Record<DiffEntry['kind'], string> = {
  added: 'only in B',
  removed: 'only in A',
  changed: 'modified',
  moved: 'moved / shuffled',
  unchanged: 'unchanged',
}

const kindHex: Record<DiffEntry['kind'], string> = {
  added: '#2f8a4e',
  removed: '#c2402c',
  changed: '#ad7a1e',
  moved: '#3568a8',
  unchanged: '#838f98',
}

export default function DiffPage({
  eyebrow,
  title,
  description,
  tag,
  sampleA,
  sampleB,
  parse,
  normalize,
  ignoreArrayOrderOption,
}: Props) {
  const [left, setLeft] = useState(sampleA)
  const [right, setRight] = useState(sampleB)
  const [ignoreOrder, setIgnoreOrder] = useState(false)

  const { entries, lineEntries, lineStats, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) {
      return { entries: [] as DiffEntry[], lineEntries: [] as LineEntry[], lineStats: null as LineDiffStats | null, error: null }
    }
    try {
      const a = parse(left)
      const b = parse(right)
      const structural = structuralDiff(a, b, { ignoreArrayOrder: ignoreOrder })
      const normalizeFn = normalize ?? ((v: unknown) => JSON.stringify(v, null, 2))
      const { entries: lines, stats } = computeLineDiff(normalizeFn(a), normalizeFn(b))
      return { entries: structural, lineEntries: lines, lineStats: stats, error: null }
    } catch (e) {
      return {
        entries: [] as DiffEntry[],
        lineEntries: [] as LineEntry[],
        lineStats: null as LineDiffStats | null,
        error: e instanceof Error ? e.message : 'Could not compare inputs.',
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right, ignoreOrder, parse, normalize])

  const counts = {
    added: entries.filter((e) => e.kind === 'added').length,
    removed: entries.filter((e) => e.kind === 'removed').length,
    changed: entries.filter((e) => e.kind === 'changed').length,
    moved: entries.filter((e) => e.kind === 'moved').length,
  }

  const lineDiffCount = lineStats ? lineStats.moved + lineStats.modified + lineStats.added + lineStats.removed : 0
  const hasAnyDifference = entries.length > 0 || lineDiffCount > 0

  const summary =
    !error && left.trim() && right.trim()
      ? !hasAnyDifference
        ? 'identical'
        : entries.length === 0
          ? `no field-level differences — ${lineDiffCount} line(s) differ (see line-by-line diff below)`
          : `${entries.length} difference(s) — ${counts.added} only in B, ${counts.removed} only in A, ${counts.changed} modified, ${counts.moved} moved`
      : null

  function buildReportData(): DiffReportData {
    return {
      title,
      generatedAt: new Date(),
      labelA: 'Source (A) — as pasted',
      labelB: 'Target (B) — as pasted',
      rawA: left,
      rawB: right,
      stats: lineStats ?? { same: 0, moved: 0, modified: 0, added: 0, removed: 0 },
      lines: lineEntries,
      fields: entries.map((e) => ({
        symbol: kindSymbol[e.kind],
        label: kindLabel[e.kind],
        path: e.path,
        before: e.before !== undefined ? formatValue(e.before) : undefined,
        after: e.after !== undefined ? formatValue(e.after) : undefined,
        colorHex: kindHex[e.kind],
      })),
      fieldsSummary: summary ?? undefined,
      note: 'The line-by-line diff below was computed after normalizing formatting and re-serializing both sides — its line numbers correspond to that normalized form, not necessarily the raw payloads above.',
    }
  }

  return (
    <>
      <ManifestStrip eyebrow={eyebrow} title={title} description={description} badges={[tag, 'diff']} />
      <StatusTicker error={error} ok={summary} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {ignoreArrayOrderOption ? (
            <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer w-fit">
              <input type="checkbox" checked={ignoreOrder} onChange={(e) => setIgnoreOrder(e.target.checked)} className="accent-signal" />
              ignore array ordering (primitive lists only)
            </label>
          ) : (
            <span />
          )}
          <ReportDownload filenameBase={`${tag}-diff-report`} buildData={buildReportData} disabled={!hasAnyDifference} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="A — before" tag={tag} value={left} onChange={setLeft} minHeightClass="min-h-[300px]" />
          <CodePane label="B — after" tag={tag} value={right} onChange={setRight} minHeightClass="min-h-[300px]" />
        </div>

        {entries.length > 0 && (
          <div className="border border-line rounded-md overflow-hidden bg-panel">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text flex items-center gap-3 flex-wrap">
              <span>Field-level differences</span>
              <span className="font-mono text-[10px] text-ink-text-dim">
                <span className="text-add">+ {counts.added} only in B</span>
                {'  ·  '}
                <span className="text-alert">− {counts.removed} only in A</span>
                {'  ·  '}
                <span className="text-move">⇄ {counts.moved} moved</span>
                {'  ·  '}
                <span className="text-warn">~ {counts.changed} modified</span>
              </span>
            </div>
            <ul className="divide-y divide-line-soft">
              {entries.map((e, i) => (
                <li key={i} className="px-3.5 py-2.5 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${kindStyle[e.kind]}`}>
                      {kindSymbol[e.kind]} {kindLabel[e.kind]}
                    </span>
                    <code className="text-[12px] text-paper">{e.path}</code>
                  </div>

                  {e.kind === 'changed' && typeof e.before === 'string' && typeof e.after === 'string' ? (
                    <WordDiff before={e.before} after={e.after} />
                  ) : (
                    <>
                      {(e.kind === 'changed' || e.kind === 'removed') && (
                        <div className="text-[12px] font-mono text-alert/90 pl-1">− {formatValue(e.before)}</div>
                      )}
                      {(e.kind === 'changed' || e.kind === 'added') && (
                        <div className="text-[12px] font-mono text-add/90 pl-1">+ {formatValue(e.after)}</div>
                      )}
                      {e.kind === 'moved' && (
                        <div className="text-[12px] font-mono text-move/90 pl-1">
                          index {e.fromIndex} → {e.toIndex} — {formatValue(e.before)}
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lineEntries.length > 0 && lineDiffCount > 0 && <LineDiffView entries={lineEntries} />}
      </div>
    </>
  )
}

function formatValue(v: unknown): string {
  if (v === undefined) return '(absent)'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
