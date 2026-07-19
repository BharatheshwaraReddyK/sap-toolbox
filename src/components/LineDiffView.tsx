import type { LineEntry } from '../lib/diff/lineDiff'

interface Props {
  entries: LineEntry[]
}

const rowStyle: Record<LineEntry['kind'], string> = {
  same: '',
  added: 'bg-add/10',
  removed: 'bg-alert/10',
  'moved-from': 'bg-move/10',
  'moved-to': 'bg-move/10',
  'modified-from': 'bg-warn/10',
  'modified-to': 'bg-warn/10',
}

const symbolStyle: Record<LineEntry['kind'], string> = {
  same: 'text-ink-text-dim',
  added: 'text-add',
  removed: 'text-alert',
  'moved-from': 'text-move',
  'moved-to': 'text-move',
  'modified-from': 'text-warn',
  'modified-to': 'text-warn',
}

const symbolFor: Record<LineEntry['kind'], string> = {
  same: '',
  added: '+',
  removed: '−',
  'moved-from': '⇄',
  'moved-to': '⇄',
  'modified-from': '~',
  'modified-to': '~',
}

export default function LineDiffView({ entries }: Props) {
  return (
    <div className="border border-line rounded-md overflow-hidden bg-panel">
      <div className="px-3.5 py-2 border-b border-line bg-panel-raised text-[12px] font-medium text-ink-text">
        Line-by-line diff
      </div>
      <div className="max-h-[480px] overflow-auto font-mono text-[12.5px]">
        {entries.map((e, i) => (
          <div key={i} className={`flex ${rowStyle[e.kind]}`}>
            <div className="w-11 shrink-0 text-right px-2.5 py-0.5 text-ink-text-dim border-r border-line-soft select-none">
              {e.lineNumber}
            </div>
            <div className="flex-1 px-3 py-0.5 whitespace-pre-wrap break-all">
              <span className={`inline-block w-3.5 ${symbolStyle[e.kind]}`}>{symbolFor[e.kind]}</span>
              {e.tokens ? (
                e.tokens.map((t, ti) =>
                  t.added ? (
                    <span key={ti} className="bg-add/25 text-add rounded-sm">
                      {t.value}
                    </span>
                  ) : t.removed ? (
                    <span key={ti} className="bg-alert/25 text-alert line-through rounded-sm">
                      {t.value}
                    </span>
                  ) : (
                    <span key={ti} className="text-ink-text-dim">
                      {t.value}
                    </span>
                  ),
                )
              ) : (
                <span className={e.kind === 'same' ? 'text-ink-text-dim' : 'text-paper'}>{e.text}</span>
              )}
              {e.moveNote && <span className="text-move/70 text-[11px] ml-2">{e.moveNote}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
