import { useState } from 'react'
import Button from './Button'
import { downloadDiffReportImage, downloadDiffReportPdf, downloadHtmlFile, buildDiffReportHtml, type DiffReportData, type ReportFormat } from '../lib/report'

interface Props {
  filenameBase: string
  buildData: () => DiffReportData
  disabled?: boolean
}

export default function ReportDownload({ filenameBase, buildData, disabled }: Props) {
  const [format, setFormat] = useState<ReportFormat>('html')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setError(null)
    try {
      const data = buildData()
      if (format === 'html') {
        downloadHtmlFile(buildDiffReportHtml(data), `${filenameBase}.html`)
        return
      }
      setBusy(true)
      if (format === 'image') {
        await downloadDiffReportImage(data, `${filenameBase}.png`)
      } else {
        await downloadDiffReportPdf(data, `${filenameBase}.pdf`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate that report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="font-mono text-[11px] text-alert">{error}</span>}
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as ReportFormat)}
        className="bg-panel border border-line rounded-sm px-2 py-1.5 text-[11px] font-mono text-paper"
        aria-label="Report format"
      >
        <option value="html">.html report</option>
        <option value="pdf">.pdf report</option>
        <option value="image">.png image</option>
      </select>
      <Button variant="ghost" onClick={handleDownload} disabled={disabled || busy}>
        {busy ? 'rendering…' : 'download report'}
      </Button>
    </div>
  )
}
