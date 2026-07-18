import { useState, type ReactNode } from 'react'

interface Props {
  label: string
  tag?: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  placeholder?: string
  onDownload?: () => void
  downloadName?: string
  extraActions?: ReactNode
  minHeightClass?: string
}

export default function CodePane({
  label,
  tag,
  value,
  onChange,
  readOnly,
  placeholder,
  onDownload,
  downloadName,
  extraActions,
  minHeightClass = 'min-h-[420px]',
}: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="flex flex-col border border-line rounded-md overflow-hidden bg-panel">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-line bg-panel-raised">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-text">{label}</span>
          {tag && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border border-line text-ink-text-dim">
              {tag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {extraActions}
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-mono text-ink-text-dim hover:text-signal transition-colors"
            >
              {copied ? 'copied' : 'copy'}
            </button>
          )}
          {onDownload && value && (
            <button
              type="button"
              onClick={onDownload}
              className="text-[11px] font-mono text-ink-text-dim hover:text-signal transition-colors"
              title={downloadName}
            >
              download
            </button>
          )}
        </div>
      </div>
      <textarea
        className={`pane-code flex-1 w-full resize-none bg-transparent px-3.5 py-3 text-[13px] leading-6 text-paper placeholder:text-ink-text-dim/60 focus:outline-none ${minHeightClass}`}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  )
}
