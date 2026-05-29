import { Loader2 } from 'lucide-react'

export function Loader({ label = 'Loading protocol state...' }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
