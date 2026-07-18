import { useMemo, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import { parseCSV, objectsToCSV } from '../../lib/formats/csv'

const sample = `sku;description;qty
A100;Widget;2
B200;Bracket;1
C300;Bolt`

const delimiters = [
  { label: ', comma', value: ',' },
  { label: '; semicolon', value: ';' },
  { label: '\\t tab', value: '\t' },
  { label: '| pipe', value: '|' },
]

export default function CsvFormatter() {
  const [input, setInput] = useState(sample)
  const [outDelimiter, setOutDelimiter] = useState(',')

  const { output, error, warning, fieldCount, rowCount } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null, warning: null, fieldCount: 0, rowCount: 0 }
    try {
      const { rows, fields } = parseCSV(input)
      const uneven = rows.filter((r) => Object.keys(r).length !== fields.length)
      const warning = uneven.length
        ? `${uneven.length} row(s) have a different column count than the header (${fields.length} columns).`
        : null
      return {
        output: objectsToCSV(rows, outDelimiter),
        error: null,
        warning,
        fieldCount: fields.length,
        rowCount: rows.length,
      }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Could not parse CSV.', warning: null, fieldCount: 0, rowCount: 0 }
    }
  }, [input, outDelimiter])

  return (
    <>
      <ManifestStrip
        eyebrow="02 · format & validate"
        title="CSV normalizer"
        description="Checks header presence and consistent row length, then re-emits with a delimiter of your choice."
        badges={['csv']}
      />
      <StatusTicker error={error} ok={!error && !warning && output ? `valid — ${rowCount} rows × ${fieldCount} columns` : warning} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-mono text-[12px] text-ink-text-dim">
          <span>output delimiter</span>
          <select
            value={outDelimiter}
            onChange={(e) => setOutDelimiter(e.target.value)}
            className="bg-panel border border-line rounded-sm px-2 py-1 text-paper"
          >
            {delimiters.map((d) => (
              <option key={d.label} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <CodePane label="Input" tag="csv" value={input} onChange={setInput} placeholder="Paste CSV here…" />
          <CodePane label="Output" tag="csv" value={output} readOnly placeholder="Normalized CSV appears here." />
        </div>
      </div>
    </>
  )
}
