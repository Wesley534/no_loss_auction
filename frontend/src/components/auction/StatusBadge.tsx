import clsx from 'clsx'

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-sky-400/12 text-sky-300',
  AwaitingConfirmation: 'bg-amber-400/12 text-amber-300',
  Disputed: 'bg-rose-500/12 text-rose-300',
  Completed: 'bg-emerald-400/12 text-emerald-300',
  Resolved: 'bg-violet-400/12 text-violet-300',
  Cancelled: 'bg-slate-400/12 text-slate-300',
}

export function StatusBadge({
  status,
  label,
}: {
  status: string
  label?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        STATUS_STYLES[status] ?? 'bg-white/10 text-white',
      )}
    >
      <span className="relative status-pulse ml-3" />
      {label ?? status}
    </span>
  )
}
