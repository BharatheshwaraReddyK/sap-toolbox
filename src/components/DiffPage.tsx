import { useMemo, useState } from 'react'
import ManifestStrip from './ManifestStrip'
import StatusTicker from './StatusTicker'
import CodePane from './CodePane'
import { structuralDiff, type DiffEntry } from '../lib/diff/structuralDiff'

interface Props {
  eyebrow: string
  title: string
  description: string
  tag: string
  sampleA: string
  sampleB: string
  parse: (text: string) => unknown
  ignoreArrayOrderOption?: boolean
}

const kindStyle: Record<DiffEntry['kind'], string> = {
  added: 'text-add border-add/30 bg-add/10',
  removed: 'text-alert border-alert/30 bg-alert/10',
  changed: 'text-signal border-signal/30 bg-signal/10',
  unchanged: 'text-ink-text-dim border-line',
}

const kindLabel: Record<DiffEntry['kind'], string> = {
  added: '+ added',
  removed: '− removed',
  changed: '~ changed',
  unchanged: '= same',
}

export default function DiffPage({ eyebrow, title, description, tag, sampleA, sampleB, parse, ignoreArrayOrderOption }: Props) {
  const [left, setLeft] = useState(sampleA)
  const [right, setRight] = useState(sampleB)
  const [ignoreOrder, setIgnoreOrder] = useState(false)

  const { entries, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) return { entries: [] as DiffEntry[], error: null }
    try {
      const a = parse(left)
      const b = parse(right)
      return { entries: structuralDiff(a, b, { ignoreArrayOrder: ignoreOrder }), error: null }
    } catch (e) {
      return { entries: [] as DiffEntry[], error: e instanceof Error ? e.message : 'Could not compare inputs.' }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right, ignoreOrder, parse])

  const summary = !error && (left.trim() && right.trim())
    ? entries.length === 0
      ? 'identical'
      : `${entries.length} difference(s) — ${entries.filter((e) => e.kind === 'added').length} added, ${entries.filter((e) => e.kind === 'removed').length} removed, ${entries.filter((e) => e.kind === 'changed').length} changed`
    : null

  return (
    <>
      <ManifestStrip eyebrow={eyebrow} title={title} description={description} badges={[tag, 'diff']} />
      <StatusTicker error={error} ok={summary} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        {ignoreArrayOrderOption && (
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer w-fit">
            <input type="checkbox" checked={ignoreOrder} onChange={(e) => setIgnoreOrder(e.target.checked)} className="accent-signal" />
            ignore array ordering (primitive lists only)
          </label>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="A — before" tag={tag} value={left} onChange={setLeft} minHeightClass="min-h-[300px]" />
          <CodePane label="B — after" tag={tag} value={right} onChange={setRight} minHeightClass="min-h-[300px]" />
        </div>

        {entries.length > 0 && (
          <div className="border border-line rounded-md overflow-hidden">
            <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
              Field-level differences
            </div>
            <ul className="divide-y divide-line-soft">
              {entries.map((e, i) => (
                <li key={i} className="px-3.5 py-2.5 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${kindStyle[e.kind]}`}>
                      {kindLabel[e.kind]}
                    </span>
                    <code className="text-[12px] text-paper">{e.path}</code>
                  </div>
                  {(e.kind === 'changed' || e.kind === 'removed') && (
                    <div className="text-[12px] font-mono text-alert/90 pl-1">− {formatValue(e.before)}</div>
                  )}
                  {(e.kind === 'changed' || e.kind === 'added') && (
                    <div className="text-[12px] font-mono text-add/90 pl-1">+ {formatValue(e.after)}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}

function formatValue(v: unknown): string {
  if (v === undefined) return '(absent)'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
