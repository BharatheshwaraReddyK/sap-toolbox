import { useTheme } from '../lib/theme'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, toggle] = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`flex items-center gap-1.5 font-mono text-[11px] text-ink-text-dim hover:text-signal transition-colors border border-line rounded-sm ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
      }`}
    >
      <span aria-hidden="true">{isLight ? '☀' : '☾'}</span>
      {!compact && <span>{isLight ? 'light' : 'dark'}</span>}
    </button>
  )
}
