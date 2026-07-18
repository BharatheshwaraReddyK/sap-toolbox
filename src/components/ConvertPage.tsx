import { useMemo, useState } from 'react'
import ManifestStrip from './ManifestStrip'
import StatusTicker from './StatusTicker'
import CodePane from './CodePane'
import Button from './Button'

interface FormatDef {
  name: string
  tag: string
  parse: (text: string) => unknown
  stringify: (value: unknown) => string
  sample: string
}

interface Props {
  eyebrow: string
  title: string
  description: string
  formatA: FormatDef
  formatB: FormatDef
}

export default function ConvertPage({ eyebrow, title, description, formatA, formatB }: Props) {
  const [reversed, setReversed] = useState(false)
  const source = reversed ? formatB : formatA
  const target = reversed ? formatA : formatB

  const [input, setInput] = useState(source.sample)
  const [error, setError] = useState<string | null>(null)

  const output = useMemo(() => {
    if (!input.trim()) {
      setError(null)
      return ''
    }
    try {
      const parsed = source.parse(input)
      const result = target.stringify(parsed)
      setError(null)
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed.')
      return ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, reversed])

  function swap() {
    setReversed((v) => !v)
    setInput(target.sample)
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${target.tag.toLowerCase()}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <ManifestStrip eyebrow={eyebrow} title={title} description={description} badges={[source.tag, target.tag]} />
      <StatusTicker error={error} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] text-ink-text-dim">
            {source.name} <span className="text-signal mx-1">→</span> {target.name}
          </div>
          <Button variant="ghost" onClick={swap}>
            ⇄ swap direction
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane
            label={source.name}
            tag={source.tag}
            value={input}
            onChange={setInput}
            placeholder={`Paste ${source.name} here…`}
          />
          <CodePane
            label={target.name}
            tag={target.tag}
            value={output}
            readOnly
            placeholder="Output appears here once the input parses cleanly."
            onDownload={output ? download : undefined}
          />
        </div>
      </div>
    </>
  )
}
