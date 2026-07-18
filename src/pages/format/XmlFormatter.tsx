import { useState } from 'react'
import FormatPage from '../../components/FormatPage'
import { parseXML, stringifyXML, stripNamespaces } from '../../lib/formats/xml'

const sample = `<ns0:Order xmlns:ns0="urn:sap:order"><ns0:Id>4711</ns0:Id><ns0:Customer>Acme Corp</ns0:Customer></ns0:Order>`

export default function XmlFormatter() {
  const [stripNs, setStripNs] = useState(false)

  return (
    <FormatPage
      eyebrow="02 · format & validate"
      title="XML formatter"
      description="Validate well-formedness, beautify or minify, and optionally strip namespace prefixes for easier reading."
      tag="xml"
      sample={sample}
      format={(text, minify) => {
        const cleaned = stripNs ? stripNamespaces(text) : text
        const parsed = parseXML(cleaned)
        return stringifyXML(parsed, !minify)
      }}
      extraControls={() => (
        <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim cursor-pointer">
          <input type="checkbox" checked={stripNs} onChange={(e) => setStripNs(e.target.checked)} className="accent-signal" />
          strip namespaces
        </label>
      )}
    />
  )
}
