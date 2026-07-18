import ConvertPage from '../../components/ConvertPage'
import { parseCSV, objectsToCSV } from '../../lib/formats/csv'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

const csvSample = `sku,description,qty,price
A100,Widget,2,19.99
B200,Bracket,1,4.50`

const jsonSample = `[
  { "sku": "A100", "description": "Widget", "qty": "2", "price": "19.99" },
  { "sku": "B200", "description": "Bracket", "qty": "1", "price": "4.50" }
]`

export default function CsvJson() {
  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="CSV ⇄ JSON"
      description="First row becomes object keys. JSON input must be an array of flat objects."
      formatA={{
        name: 'CSV',
        tag: 'csv',
        parse: (text) => parseCSV(text).rows,
        stringify: (v) => objectsToCSV(asRows(v)),
        sample: csvSample,
      }}
      formatB={{ name: 'JSON', tag: 'json', parse: parseJSON, stringify: (v) => stringifyJSON(v, true), sample: jsonSample }}
    />
  )
}

function asRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[]
  return [value as Record<string, unknown>]
}
