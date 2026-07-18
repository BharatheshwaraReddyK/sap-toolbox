import { useState } from 'react'
import ConvertPage from '../../components/ConvertPage'
import { parseCSV, objectsToCSV, flattenForCSV } from '../../lib/formats/csv'
import { parseJSON, stringifyJSON } from '../../lib/formats/json'

const csvSample = `sku,description,qty,price
A100,Widget,2,19.99
B200,Bracket,1,4.50`

const jsonSample = `[
  { "sku": "A100", "description": "Widget", "qty": "2", "price": "19.99" },
  { "sku": "B200", "description": "Bracket", "qty": "1", "price": "4.50" }
]`

const delimiters = [
  { label: ', comma', value: ',' },
  { label: '; semicolon', value: ';' },
  { label: '\\t tab', value: '\t' },
  { label: '| pipe', value: '|' },
]

export default function CsvJson() {
  const [delimiter, setDelimiter] = useState(',')

  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="CSV ⇄ JSON"
      description="First row becomes object keys. Nested JSON (objects/arrays inside a record) is flattened into dotted columns, e.g. a.b[0].c."
      formatA={{
        name: 'CSV',
        tag: 'csv',
        parse: (text) => parseCSV(text, delimiter).rows,
        stringify: (v) => objectsToCSV(flattenForCSV(v), delimiter),
        sample: csvSample,
      }}
      formatB={{ name: 'JSON', tag: 'json', parse: parseJSON, stringify: (v) => stringifyJSON(v, true), sample: jsonSample }}
      extraControls={
        <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
          <span>CSV delimiter</span>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="bg-panel border border-line rounded-sm px-2 py-1 text-paper"
          >
            {delimiters.map((d) => (
              <option key={d.label} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      }
    />
  )
}
