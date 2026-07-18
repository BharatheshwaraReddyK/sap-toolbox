import { useMemo, useState, type ReactNode } from 'react'
import ManifestStrip from './ManifestStrip'
import StatusTicker from './StatusTicker'
import CodePane from './CodePane'

interface Props {
  eyebrow: string
  title: string
  description: string
  tag: string
  sample: string
  format: (text: string, minify: boolean) => string
  extraControls?: (props: { minify: boolean; setMinify: (v: boolean) => void }) => ReactNode
}

export default function FormatPage({ eyebrow, title, description, tag, sample, format, extraControls }: Props) {
  const [input, setInput] = useState(sample)
  const [minify, setMinify] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const output = useMemo(() => {
    if (!input.trim()) {
      setError(null)
      return ''
    }
    try {
      const result = format(input, minify)
      setError(null)
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Formatting failed.')
      return ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, minify, format])

  return (
    <>
      <ManifestStrip eyebrow={eyebrow} title={title} description={description} badges={[tag]} />
      <StatusTicker error={error} ok={!error && output ? 'valid' : null} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
            <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} className="accent-signal" />
            minify
          </label>
          {extraControls?.({ minify, setMinify })}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="Input" tag={tag} value={input} onChange={setInput} placeholder={`Paste ${tag.toUpperCase()} here…`} />
          <CodePane label="Output" tag={tag} value={output} readOnly placeholder="Formatted output appears here." />
        </div>
      </div>
    </>
  )
}
