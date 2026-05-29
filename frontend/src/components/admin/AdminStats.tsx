import { formatToken } from '../../lib/format'
import { Card } from '../shared/Card'

export function AdminStats({
  stats,
}: {
  stats: {
    total: number
    active: number
    disputed: number
    completed: number
    totalLockedPrincipal: bigint
    totalAccruedYield: bigint
  }
}) {
  const items = [
    ['Total auctions', stats.total.toString(), 'primary'],
    ['Open auctions', stats.active.toString(), 'secondary'],
    ['Issues to review', stats.disputed.toString(), 'danger'],
    ['Completed sales', stats.completed.toString(), 'tertiary'],
    ['Protected funds', formatToken(stats.totalLockedPrincipal), 'primary'],
    ['Marketplace reserve growth', formatToken(stats.totalAccruedYield, 6), 'secondary'],
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value, tone]) => (
        <Card
          className="border-l-4"
          tone={tone as 'primary' | 'secondary' | 'tertiary' | 'danger'}
          key={label}
        >
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
            {label}
          </div>
          <div className="mono text-2xl font-semibold text-white">{value}</div>
        </Card>
      ))}
    </div>
  )
}
