import { triggerDownload } from './formats/excel'
import type { LineEntry, LineDiffStats, WordToken } from './diff/lineDiff'

export type ReportFormat = 'html' | 'pdf' | 'image'

export interface DiffReportData {
  title: string
  generatedAt: Date
  labelA: string
  labelB: string
  rawA: string
  rawB: string
  stats: LineDiffStats
  lines: LineEntry[]
  note?: string
}

const REPORT_CSS = `
body{font-family:-apple-system,"Segoe UI",Inter,sans-serif;background:#fff;color:#10192B;max-width:1200px;margin:0 auto;padding:32px;}
h1{font-size:1.3rem;margin:0 0 4px;}
.meta{color:#5B6478;font-size:0.82rem;margin-bottom:24px;font-family:ui-monospace,monospace;}
.stats{display:flex;gap:0;border:1px solid #DCE1EC;border-radius:8px;overflow:hidden;margin-bottom:24px;font-family:ui-monospace,monospace;}
.stat{flex:1;padding:12px 16px;border-right:1px solid #DCE1EC;}
.stat:last-child{border-right:none;}
.stat .n{font-size:1.4rem;font-weight:700;font-family:-apple-system,sans-serif;}
.stat .l{font-size:0.68rem;color:#8891A4;text-transform:uppercase;letter-spacing:0.05em;}
.match .n{color:#0F9D6E;} .moved .n{color:#6D28D9;} .modified .n{color:#B45309;} .added .n{color:#0891B2;} .removed .n{color:#BE123C;}
.payload-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
.payload{border:1px solid #DCE1EC;border-radius:8px;overflow:hidden;}
.payload h2{margin:0;padding:8px 12px;background:#F8F9FC;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.04em;color:#5B6478;border-bottom:1px solid #DCE1EC;font-family:ui-monospace,monospace;}
.payload pre{margin:0;padding:12px;white-space:pre-wrap;word-break:break-word;font-size:0.78rem;max-height:520px;overflow:auto;font-family:ui-monospace,"JetBrains Mono",monospace;}
h3{font-size:0.95rem;margin:0 0 10px;}
.diff-view{border:1px solid #DCE1EC;border-radius:8px;font-family:ui-monospace,monospace;font-size:0.8rem;overflow:auto;}
.diff-line{display:flex;}
.diff-line .ln{width:46px;flex-shrink:0;text-align:right;padding:2px 10px;color:#8891A4;border-right:1px solid #E7EAF3;}
.diff-line .content{padding:2px 12px;white-space:pre-wrap;word-break:break-all;flex:1;}
.diff-line .sym{display:inline-block;width:16px;opacity:0.75;font-weight:600;}
.diff-line.same .content{color:#5B6478;}
.diff-line.added{background:#E1F6FA;} .diff-line.added .content,.diff-line.added .ln{color:#0891B2;}
.diff-line.removed{background:#FDE4E9;} .diff-line.removed .content,.diff-line.removed .ln{color:#BE123C;}
.diff-line.moved-from,.diff-line.moved-to{background:#EFE9FE;}
.diff-line.moved-from .content,.diff-line.moved-to .content,.diff-line.moved-from .ln,.diff-line.moved-to .ln{color:#6D28D9;}
.diff-line.modified-from,.diff-line.modified-to{background:#FDF1DC;}
.diff-line.modified-from .ln,.diff-line.modified-to .ln{color:#B45309;}
.tok-removed{background:#FDE4E9;color:#BE123C;text-decoration:line-through;border-radius:3px;}
.tok-added{background:#E1F6FA;color:#0891B2;border-radius:3px;}
.move-note{color:#6D28D9;opacity:0.75;font-size:0.72rem;margin-left:10px;}
.note{color:#8891A4;font-size:0.78rem;margin:10px 0 24px;font-family:ui-monospace,monospace;}
.footer{margin-top:20px;color:#8891A4;font-size:0.72rem;font-family:ui-monospace,monospace;}
`

const symbolFor: Record<LineEntry['kind'], string> = {
  same: '',
  added: '+',
  removed: '\u2212',
  'moved-from': '\u21c4',
  'moved-to': '\u21c4',
  'modified-from': '~',
  'modified-to': '~',
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function tokensHtml(tokens: WordToken[]): string {
  return tokens
    .map((t) => {
      const text = escapeHtml(t.value)
      if (t.added) return `<span class="tok-added">${text}</span>`
      if (t.removed) return `<span class="tok-removed">${text}</span>`
      return text
    })
    .join('')
}

function lineRowHtml(entry: LineEntry): string {
  const content = entry.tokens ? tokensHtml(entry.tokens) : escapeHtml(entry.text)
  const moveNote = entry.moveNote ? `<span class="move-note">${escapeHtml(entry.moveNote)}</span>` : ''
  const sym = symbolFor[entry.kind]
  return `<div class="diff-line ${entry.kind}"><div class="ln">${entry.lineNumber}</div><div class="content"><span class="sym">${sym || '&nbsp;&nbsp;'}</span>${content}${moveNote}</div></div>`
}

function statBoxHtml(cls: string, n: number, label: string): string {
  return `<div class="stat ${cls}"><div class="n">${n}</div><div class="l">${label}</div></div>`
}

export function buildDiffReportBody(data: DiffReportData): string {
  const { title, generatedAt, labelA, labelB, rawA, rawB, stats, lines, note } = data
  return `<h1>${escapeHtml(title)}</h1>
<div class="meta">Generated ${escapeHtml(generatedAt.toLocaleString())}</div>
<div class="stats">
  ${statBoxHtml('match', stats.same, 'Matching lines')}
  ${statBoxHtml('moved', stats.moved, 'Moved / shuffled')}
  ${statBoxHtml('modified', stats.modified, 'Modified')}
  ${statBoxHtml('added', stats.added, 'Only in B (+)')}
  ${statBoxHtml('removed', stats.removed, 'Only in A (\u2212)')}
</div>
<div class="payload-grid">
  <div class="payload"><h2>${escapeHtml(labelA)}</h2><pre>${escapeHtml(rawA)}</pre></div>
  <div class="payload"><h2>${escapeHtml(labelB)}</h2><pre>${escapeHtml(rawB)}</pre></div>
</div>
${note ? `<div class="note">${escapeHtml(note)}</div>` : ''}
<h3>Diff</h3>
<div class="note" style="margin-top:-4px;">Legend: <b>+</b> only in B &nbsp; <b>\u2212</b> only in A &nbsp; <b>\u21c4</b> moved / shuffled &nbsp; <b>~</b> modified (word-level changes highlighted)</div>
<div class="diff-view">${lines.map(lineRowHtml).join('')}</div>
<div class="footer">Generated by Manifest \u2014 SAP Payload Toolbox</div>`
}

export function buildDiffReportHtml(data: DiffReportData): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(data.title)}</title>
<style>${REPORT_CSS}</style>
</head>
<body>${buildDiffReportBody(data)}</body>
</html>`
}

export function downloadHtmlFile(html: string, filename: string) {
  triggerDownload(new Blob([html], { type: 'text/html' }), filename)
}

/** Renders the report off-screen (so image/PDF exports match the .html report exactly), captures it, then cleans up. */
async function withOffscreenReport<T>(data: DiffReportData, run: (el: HTMLElement) => Promise<T>): Promise<T> {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-99999px;top:0;width:1200px;background:#ffffff;'
  const style = document.createElement('style')
  style.textContent = REPORT_CSS
  container.appendChild(style)
  const body = document.createElement('div')
  body.innerHTML = buildDiffReportBody(data)
  container.appendChild(body)
  document.body.appendChild(container)
  // Let layout settle before rasterizing.
  await new Promise((r) => setTimeout(r, 30))
  try {
    return await run(container)
  } finally {
    document.body.removeChild(container)
  }
}

export async function downloadDiffReportImage(data: DiffReportData, filename: string) {
  await withOffscreenReport(data, async (el) => {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, windowWidth: 1200 })
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render image.'))), 'image/png'),
    )
    triggerDownload(blob, filename)
  })
}

export async function downloadDiffReportPdf(data: DiffReportData, filename: string) {
  await withOffscreenReport(data, async (el) => {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, windowWidth: 1200 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(filename)
  })
}
