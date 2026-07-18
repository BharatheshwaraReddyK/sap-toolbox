import { useState, type RefObject } from 'react'
import Button from './Button'
import { downloadElementAsImage, downloadElementAsPdf, downloadHtmlFile, type ReportFormat } from '../lib/report'

interface Props {
  filenameBase: string
  /** Element containing the on-screen results, used for image/PDF capture. */
  resultsRef: RefObject<HTMLElement | null>
  /** Builds the standalone HTML report string on demand (only needed for the 'html' format). */
  buildHtml: () => string
  disabled?: boolean
}

export default function ReportDownload({ filenameBase, resultsRef, buildHtml, disabled }: Props) {
  const [format, setFormat] = useState<ReportFormat>('html')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function panelBackground(): string {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--color-panel').trim()
    return value || '#182028'
  }

  async function handleDownload() {
    setError(null)
    try {
      if (format === 'html') {
        downloadHtmlFile(buildHtml(), `${filenameBase}.html`)
        return
      }
      const el = resultsRef.current
      if (!el) {
        setError('Nothing to capture yet.')
        return
      }
      setBusy(true)
      if (format === 'image') {
        await downloadElementAsImage(el, `${filenameBase}.png`, panelBackground())
      } else {
        await downloadElementAsPdf(el, `${filenameBase}.pdf`, panelBackground())
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
