import ConvertPage from '../../components/ConvertPage'
import { parseCSV, objectsToCSV, flattenForCSV } from '../../lib/formats/csv'
import { parseXML, stringifyXML } from '../../lib/formats/xml'

const csvSample = `sku,description,qty
A100,Widget,2
B200,Bracket,1`

const xmlSample = `<rows>
  <row>
    <sku>A100</sku>
    <description>Widget</description>
    <qty>2</qty>
  </row>
  <row>
    <sku>B200</sku>
    <description>Bracket</description>
    <qty>1</qty>
  </row>
</rows>`

export default function CsvXml() {
  return (
    <ConvertPage
      eyebrow="01 · convert"
      title="CSV ⇄ XML"
      description="Rows become repeating <row> elements; converting back flattens nested elements into dotted columns."
      formatA={{
        name: 'CSV',
        tag: 'csv',
        parse: (text) => parseCSV(text).rows,
        stringify: (v) => objectsToCSV(flattenForCSV(v)),
        sample: csvSample,
      }}
      formatB={{
        name: 'XML',
        tag: 'xml',
        parse: (text) => {
          const parsed = parseXML(text) as { rows?: { row?: unknown } }
          const rows = parsed.rows?.row
          return Array.isArray(rows) ? rows : rows ? [rows] : []
        },
        stringify: (v) => stringifyXML({ rows: { row: v } }, true),
        sample: xmlSample,
      }}
    />
  )
}
