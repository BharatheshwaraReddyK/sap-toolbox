import { useState } from 'react'
import FormatPage from '../../components/FormatPage'
import { parseJSON, stringifyJSON, sortKeysDeep } from '../../lib/formats/json'

const sample = `{ "order": {"id":4711,"items":[{"sku":"B200","qty":1},{"sku":"A100","qty":2}]}}`

export default function JsonFormatter() {
  const [sortKeys, setSortKeys] = useState(false)

  return (
    <FormatPage
      eyebrow="02 · format & validate"
      title="JSON formatter"
      description="Validate syntax, beautify or minify, and optionally sort object keys alphabetically."
      tag="json"
      sample={sample}
      format={(text, minify) => {
        let value = parseJSON(text)
        if (sortKeys) value = sortKeysDeep(value)
        return stringifyJSON(value, !minify)
      }}
      extraControls={() => (
        <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
          <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} className="accent-signal" />
          sort keys
        </label>
      )}
    />
  )
}
