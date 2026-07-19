import DiffPage from '../../components/DiffPage'
import { parseXML, stringifyXML } from '../../lib/formats/xml'

const a = `<order id="4711">
  <status>open</status>
  <items><item sku="A100" qty="2"/></items>
</order>`
const b = `<order id="4711">
  <status>shipped</status>
  <items><item sku="A100" qty="3"/></items>
  <carrier>DHL</carrier>
</order>`

export default function XmlDiff() {
  return (
    <DiffPage
      eyebrow="03 · compare"
      title="XML diff"
      description="Documents are canonicalized to a tag-based structure before comparing, so whitespace and formatting don't count as differences."
      tag="xml"
      sampleA={a}
      sampleB={b}
      parse={parseXML}
      normalize={(v) => stringifyXML(v, true)}
      ignoreArrayOrderOption
    />
  )
}
