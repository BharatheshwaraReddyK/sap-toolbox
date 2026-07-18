import DiffPage from '../../components/DiffPage'
import { parseJSON } from '../../lib/formats/json'

const a = `{
  "order": { "id": 4711, "status": "open", "items": [{"sku":"A100","qty":2}] }
}`
const b = `{
  "order": { "id": 4711, "status": "shipped", "items": [{"sku":"A100","qty":3}], "carrier": "DHL" }
}`

export default function JsonDiff() {
  return (
    <DiffPage
      eyebrow="03 · compare"
      title="JSON diff"
      description="Structural comparison — added, removed, and changed keys, at any depth."
      tag="json"
      sampleA={a}
      sampleB={b}
      parse={parseJSON}
      ignoreArrayOrderOption
    />
  )
}
