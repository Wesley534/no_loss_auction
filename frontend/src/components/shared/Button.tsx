import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    fullWidth?: boolean
    isLoading?: boolean
  }
>

const VARIANTS = {
  primary:
    'bg-[var(--primary)] text-slate-950 hover:brightness-110 shadow-[0_16px_32px_rgba(77,142,255,0.18)]',
  secondary:
    'bg-[var(--secondary)] text-emerald-950 hover:brightness-110 shadow-[0_16px_32px_rgba(78,222,163,0.16)]',
  ghost:
    'bg-white/5 text-[var(--text)] hover:bg-white/10 border border-white/10',
  danger:
    'bg-[var(--danger-strong)] text-white hover:brightness-110 shadow-[0_16px_32px_rgba(255,91,77,0.2)]',
} as const

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
}
