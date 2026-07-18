import { useState } from 'react'
import ConvertPage from '../../components/ConvertPage'
import { parseXML, stringifyXML } from '../../lib/formats/xml'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

const xmlSample = `<order id="4711">
  <customer>Acme Corp</customer>
  <items>
    <item sku="A100" qty="2"/>
    <item sku="B200" qty="1"/>
  </items>
</order>`

const jsonSample = `{
  "order": {
    "@_id": "4711",
    "customer": "Acme Corp",
    "items": {
      "item": [
        { "@_sku": "A100", "@_qty": 2 },
        { "@_sku": "B200", "@_qty": 1 }
      ]
    }
  }
}`

const jsonSampleStripped = `{
  "@_id": "4711",
  "customer": "Acme Corp",
  "items": {
    "item": [
      { "@_sku": "A100", "@_qty": 2 },
      { "@_sku": "B200", "@_qty": 1 }
    ]
  }
}`

export default function XmlJson() {
  const [stripRoot, setStripRoot] = useState(false)
  const [rootName, setRootName] = useState('root')

  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="XML ⇄ JSON"
      description="Attributes come through as @_name, text nodes as #text — round-trips cleanly in both directions."
      formatA={{
        name: 'XML',
        tag: 'xml',
        parse: (text) => {
          const parsed = parseXML(text) as Record<string, unknown>
          if (!stripRoot) return parsed
          const rootTag = Object.keys(parsed)[0]
          return parsed[rootTag]
        },
        stringify: (v) => stringifyXML(stripRoot ? { [rootName || 'root']: v } : v, true),
        sample: xmlSample,
      }}
      formatB={{
        name: 'JSON',
        tag: 'json',
        parse: parseJSON,
        stringify: (v) => stringifyJSON(v, true),
        sample: stripRoot ? jsonSampleStripped : jsonSample,
      }}
      extraControls={
        <>
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
            <input type="checkbox" checked={stripRoot} onChange={(e) => setStripRoot(e.target.checked)} className="accent-signal" />
            strip root element
          </label>
          {stripRoot && (
            <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
              <span>root name (when rebuilding XML)</span>
              <input
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="root"
                className="bg-panel border border-line rounded-sm px-2 py-1 text-paper w-28"
              />
            </label>
          )}
        </>
      }
    />
  )
}
