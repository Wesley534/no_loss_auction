import { Inbox } from 'lucide-react'
import { Card } from './Card'

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-white/6 p-4 text-[var(--primary)]">
        <Inbox className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="max-w-md text-sm text-[var(--text-muted)]">{description}</p>
      </div>
    </Card>
  )
}
