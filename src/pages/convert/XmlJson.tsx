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

export default function XmlJson() {
  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="XML ⇄ JSON"
      description="Attributes come through as @_name, text nodes as #text — round-trips cleanly in both directions."
      formatA={{ name: 'XML', tag: 'xml', parse: parseXML, stringify: (v) => stringifyXML(v, true), sample: xmlSample }}
      formatB={{ name: 'JSON', tag: 'json', parse: parseJSON, stringify: (v) => stringifyJSON(v, true), sample: jsonSample }}
    />
  )
}
