import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }

export default function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const base = 'font-mono text-[12px] tracking-wide px-3.5 py-2 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles =
    variant === 'primary'
      ? 'bg-signal text-ink hover:bg-signal-dim'
      : 'border border-line text-ink-text hover:text-paper hover:border-ink-text-dim'
  return <button className={`${base} ${styles} ${className}`} {...rest} />
}
