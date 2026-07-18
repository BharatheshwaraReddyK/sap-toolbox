interface Props {
  eyebrow: string
  title: string
  description: string
  badges?: string[]
}

export default function ManifestStrip({ eyebrow, title, description, badges }: Props) {
  return (
    <header className="border-b border-line px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <div className="font-mono text-[11px] tracking-[0.2em] text-signal mb-1.5">{eyebrow}</div>
        <h1 className="text-2xl font-semibold text-paper tracking-tight">{title}</h1>
        <p className="text-sm text-ink-text-dim mt-1.5 max-w-xl">{description}</p>
      </div>
      {badges && badges.length > 0 && (
        <div className="flex gap-2 shrink-0">
          {badges.map((b, i) => (
            <span
              key={b}
              className={`stamp font-mono text-[11px] px-2.5 py-1 ${i === 0 ? 'text-signal' : 'text-ink-text-dim'}`}
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </header>
  )
}
