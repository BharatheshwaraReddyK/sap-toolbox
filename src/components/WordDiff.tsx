import { diffWords } from 'diff'

interface Props {
  before: string
  after: string
}

/** Renders two lines: the 'before' text with removed words struck through, and 'after' with added words highlighted. */
export default function WordDiff({ before, after }: Props) {
  const parts = diffWords(before, after)

  return (
    <div className="text-[12px] font-mono pl-1 flex flex-col gap-0.5">
      <div className="text-alert/90">
        <span className="text-ink-text-dim mr-1">−</span>
        {parts
          .filter((p) => !p.added)
          .map((p, i) =>
            p.removed ? (
              <span key={i} className="bg-alert/20 rounded-sm px-0.5">
                {p.value}
              </span>
            ) : (
              <span key={i} className="text-ink-text-dim">
                {p.value}
              </span>
            ),
          )}
      </div>
      <div className="text-add/90">
        <span className="text-ink-text-dim mr-1">+</span>
        {parts
          .filter((p) => !p.removed)
          .map((p, i) =>
            p.added ? (
              <span key={i} className="bg-add/20 rounded-sm px-0.5">
                {p.value}
              </span>
            ) : (
              <span key={i} className="text-ink-text-dim">
                {p.value}
              </span>
            ),
          )}
      </div>
    </div>
  )
}
