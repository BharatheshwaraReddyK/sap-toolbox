import { useRef, useState } from 'react'
import ManifestStrip from '../../components/ManifestStrip'
import StatusTicker from '../../components/StatusTicker'
import CodePane from '../../components/CodePane'
import Button from '../../components/Button'
import { parseExcelFile, downloadExcel, type ExcelSheet } from '../../lib/formats/excel'
import { objectsToCSV, parseCSV } from '../../lib/formats/csv'
import { stringifyJSON, parseJSON } from '../../lib/formats/json'

export default function Excel() {
  const [sheets, setSheets] = useState<ExcelSheet[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [textIn, setTextIn] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    try {
      const parsed = await parseExcelFile(file)
      setSheets(parsed)
      setActiveSheet(0)
      setFileName(file.name)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  function exportFromText(kind: 'json' | 'csv') {
    try {
      let rows: Record<string, unknown>[]
      if (kind === 'json') {
        const parsed = parseJSON(textIn)
        rows = Array.isArray(parsed) ? parsed : [parsed as Record<string, unknown>]
      } else {
        rows = parseCSV(textIn).rows
      }
      downloadExcel(rows, 'converted.xlsx')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build a workbook from that input.')
    }
  }

  const activeRows = sheets[activeSheet]?.rows ?? []
  const jsonOut = activeRows.length ? stringifyJSON(activeRows, true) : ''
  const csvOut = activeRows.length ? objectsToCSV(activeRows) : ''

  return (
    <>
      <ManifestStrip
        eyebrow="01 · convert"
        title="Excel ⇄ JSON / CSV"
        description="Upload a workbook to export JSON or CSV, or paste JSON/CSV below to download a fresh .xlsx."
        badges={['xlsx', 'json/csv']}
      />
      <StatusTicker error={error} />

      <div className="px-6 sm:px-8 py-6 flex flex-col gap-8">
        <section>
          <div className="flex items-center gap-3 mb-3">
            <Button onClick={() => fileInput.current?.click()}>choose workbook…</Button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {fileName && <span className="font-mono text-[12px] text-ink-text-dim">{fileName}</span>}
          </div>

          {sheets.length > 0 && (
            <>
              {sheets.length > 1 && (
                <div className="flex gap-2 mb-3">
                  {sheets.map((s, i) => (
                    <button
                      key={s.name}
                      onClick={() => setActiveSheet(i)}
                      className={`font-mono text-[11px] px-2.5 py-1 rounded-sm border ${
                        i === activeSheet ? 'border-signal text-signal' : 'border-line text-ink-text-dim'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid lg:grid-cols-2 gap-4">
                <CodePane label="As JSON" tag="json" value={jsonOut} readOnly minHeightClass="min-h-[300px]" />
                <CodePane label="As CSV" tag="csv" value={csvOut} readOnly minHeightClass="min-h-[300px]" />
              </div>
            </>
          )}
        </section>

        <section className="border-t border-line-soft pt-6">
          <div className="font-mono text-[11px] text-ink-text-dim mb-3">
            or paste JSON / CSV below to build a workbook
          </div>
          <CodePane
            label="Input"
            value={textIn}
            onChange={setTextIn}
            placeholder="Paste a JSON array of objects, or CSV rows…"
            minHeightClass="min-h-[220px]"
          />
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" onClick={() => exportFromText('json')} disabled={!textIn.trim()}>
              download .xlsx from JSON
            </Button>
            <Button variant="ghost" onClick={() => exportFromText('csv')} disabled={!textIn.trim()}>
              download .xlsx from CSV
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}

