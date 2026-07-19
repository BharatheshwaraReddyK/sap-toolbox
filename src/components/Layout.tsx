import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import { registry } from '../lib/registry'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-line">
          <NavLink to="/" className="font-mono text-[11px] tracking-[0.2em] text-signal">
            MANIFEST
          </NavLink>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="font-mono text-[11px] text-ink-text-dim border border-line rounded-sm px-2.5 py-1"
            >
              {mobileOpen ? 'close' : 'tools'}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-b border-line px-5 py-3 max-h-[60vh] overflow-y-auto">
            {registry.map((cat) => (
              <div key={cat.id} className="mb-3">
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-text-dim mb-1">
                  {cat.title}
                </div>
                {cat.tools.map((tool) => (
                  <NavLink
                    key={tool.path}
                    to={tool.path}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1.5 text-[13px] text-ink-text"
                  >
                    {tool.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        )}

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
