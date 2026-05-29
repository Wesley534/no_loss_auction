import clsx from 'clsx'
import type {
  InputHTMLAttributes,
  PropsWithChildren,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

type BaseProps = {
  label: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  className,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
      <input
        className={clsx(
          'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:bg-white/8',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-[var(--danger)]">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--text-faint)]">{hint}</span> : null}
    </label>
  )
}

export function Textarea({
  label,
  error,
  hint,
  className,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
      <textarea
        className={clsx(
          'min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--primary)] focus:bg-white/8',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-[var(--danger)]">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--text-faint)]">{hint}</span> : null}
    </label>
  )
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...props
}: BaseProps & PropsWithChildren<SelectHTMLAttributes<HTMLSelectElement>>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
      <select
        className={clsx(
          'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:bg-white/8',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-sm text-[var(--danger)]">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--text-faint)]">{hint}</span> : null}
    </label>
  )
}
