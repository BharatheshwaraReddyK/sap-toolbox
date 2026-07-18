import { useState } from 'react'
import ConvertPage from '../../components/ConvertPage'
import { parseCSV, objectsToCSV, flattenForCSV } from '../../lib/formats/csv'
import { parseXML, stringifyXML } from '../../lib/formats/xml'

const csvSample = `sku,description,qty
A100,Widget,2
B200,Bracket,1`

const delimiters = [
  { label: ', comma', value: ',' },
  { label: '; semicolon', value: ';' },
  { label: '\\t tab', value: '\t' },
  { label: '| pipe', value: '|' },
]

function xmlSampleFor(root: string, row: string) {
  return `<${root}>
  <${row}>
    <sku>A100</sku>
    <description>Widget</description>
    <qty>2</qty>
  </${row}>
  <${row}>
    <sku>B200</sku>
    <description>Bracket</description>
    <qty>1</qty>
  </${row}>
</${root}>`
}

export default function CsvXml() {
  const [rootName, setRootName] = useState('rows')
  const [rowName, setRowName] = useState('row')
  const [delimiter, setDelimiter] = useState(',')

  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="CSV ⇄ XML"
      description="Rows become repeating elements under a root you name; converting back flattens nested elements into dotted columns."
      formatA={{
        name: 'CSV',
        tag: 'csv',
        parse: (text) => parseCSV(text, delimiter).rows,
        stringify: (v) => objectsToCSV(flattenForCSV(v), delimiter),
        sample: csvSample,
      }}
      formatB={{
        name: 'XML',
        tag: 'xml',
        parse: (text) => {
          const parsed = parseXML(text) as Record<string, unknown>
          const root = parsed[rootName] as Record<string, unknown> | undefined
          const rows = root?.[rowName]
          if (rows === undefined) {
            throw new Error(`Expected a "<${rootName}><${rowName}>…" structure — adjust the root/row names above to match your XML.`)
          }
          return Array.isArray(rows) ? rows : [rows]
        },
        stringify: (v) => stringifyXML({ [rootName || 'rows']: { [rowName || 'row']: v } }, true),
        sample: xmlSampleFor(rootName || 'rows', rowName || 'row'),
      }}
      extraControls={
        <>
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
            <span>root element</span>
            <input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="rows"
              className="bg-panel border border-line rounded-sm px-2 py-1 text-paper w-24"
            />
          </label>
          <label className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
            <span>row element</span>
            <input
              value={rowName}
              onChange={(e) => setRowName(e.target.value)}
              placeholder="row"
              className="bg-panel border border-line rounded-sm px-2 py-1 text-paper w-24"
            />
          </label>
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
        </>
      }
    />
  )
}
