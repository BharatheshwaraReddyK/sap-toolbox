import { Link } from 'react-router-dom'
import { registry } from '../lib/registry'

export default function Home() {
  return (
    <div>
      <header className="border-b border-line px-6 sm:px-8 py-10 sm:py-14">
        <div className="font-mono text-[11px] tracking-[0.2em] text-signal mb-3">MANIFEST</div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-paper tracking-tight max-w-xl">
          Payloads in, clean data out.
        </h1>
        <p className="text-sm text-ink-text-dim mt-3 max-w-lg leading-relaxed">
          Convert, format, and diff JSON, XML, CSV, YAML, and Excel — plus segment-aware helpers for
          IDoc, OData, and field mapping. Everything runs client-side; nothing you paste here leaves
          the tab.
        </p>
      </header>

      <div className="px-6 sm:px-8 py-8 flex flex-col gap-10">
        {registry.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-[11px] text-signal">{cat.eyebrow}</span>
              <h2 className="font-mono text-[13px] tracking-[0.15em] uppercase text-paper">{cat.title}</h2>
              <span className="flex-1 border-t border-line-soft ml-2" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.tools.map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="group border border-line rounded-md p-4 hover:border-signal/50 hover:bg-panel transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-medium text-paper group-hover:text-signal transition-colors">
                      {tool.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-text-dim">{tool.code}</span>
                  </div>
                  <p className="text-[12px] text-ink-text-dim leading-relaxed">{tool.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
