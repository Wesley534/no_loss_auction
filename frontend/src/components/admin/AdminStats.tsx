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
    ['Total auctions', stats.total.toString()],
    ['Active auctions', stats.active.toString()],
    ['Disputed auctions', stats.disputed.toString()],
    ['Completed auctions', stats.completed.toString()],
    ['Locked principal', formatToken(stats.totalLockedPrincipal)],
    ['Accrued yield', formatToken(stats.totalAccruedYield, 6)],
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value], index) => (
        <Card
          className={
            index === 0
              ? 'border-l-4 border-[var(--primary)]'
              : index === 1
                ? 'border-l-4 border-[var(--secondary)]'
                : index === 2
                  ? 'border-l-4 border-[var(--danger-strong)]'
                  : 'border-l-4 border-[var(--tertiary)]'
          }
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
