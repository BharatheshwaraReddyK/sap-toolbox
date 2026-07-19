import { NavLink } from 'react-router-dom'
import { registry } from '../lib/registry'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-line shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 pt-6 pb-5 border-b border-line-soft flex items-start justify-between gap-2">
        <NavLink to="/" className="block">
          <div className="font-mono text-[11px] tracking-[0.2em] text-signal">MANIFEST</div>
          <div className="text-sm text-ink-text-dim mt-1 leading-snug">SAP payload toolbox</div>
        </NavLink>
        <ThemeToggle compact />
      </div>
      <nav className="flex-1 py-2">
        {registry.map((cat) => (
          <div key={cat.id} className="px-3 py-3">
            <div className="flex items-baseline gap-2 px-2 mb-1.5">
              <span className="font-mono text-[10px] text-ink-text-dim">{cat.eyebrow}</span>
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink-text-dim">
                {cat.title}
              </span>
            </div>
            <ul>
              {cat.tools.map((tool) => (
                <li key={tool.path}>
                  <NavLink
                    to={tool.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm text-[13px] transition-colors ${
                        isActive
                          ? 'bg-panel-raised text-paper'
                          : 'text-ink-text hover:bg-panel hover:text-paper'
                      }`
                    }
                  >
                    <span>{tool.label}</span>
                    <span className="font-mono text-[10px] text-ink-text-dim">{tool.code}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-line-soft font-mono text-[10px] text-ink-text-dim leading-relaxed">
        <div>all conversion runs in your browser — nothing leaves this tab</div>
      </div>
    </aside>
  )
}
