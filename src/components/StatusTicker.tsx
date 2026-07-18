interface Props {
  error?: string | null
  ok?: string | null
}

export default function StatusTicker({ error, ok }: Props) {
  if (!error && !ok) return null
  return (
    <div
      className={`mx-6 sm:mx-8 mt-4 px-3.5 py-2.5 rounded-sm border font-mono text-[12px] flex items-center gap-2 ${
        error ? 'border-alert/40 text-alert bg-alert/10' : 'border-add/40 text-add bg-add/10'
      }`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {error ?? ok}
    </div>
  )
}
