import { Coins, Sparkles } from 'lucide-react'
import { formatToken } from '../../lib/format'
import { Card } from '../shared/Card'

export function TokenBalanceCard({
  balance,
  yieldValue,
}: {
  balance: bigint
  yieldValue?: bigint
}) {
  return (
    <Card
      className={yieldValue === undefined ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}
      tone="primary"
    >
      <div className="rounded-[24px] bg-[rgba(77,142,255,0.08)] p-5 ring-1 ring-[rgba(173,198,255,0.14)]">
        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Coins className="h-4 w-4 text-[var(--primary)]" />
          Available balance
        </div>
        <div className="text-3xl font-semibold text-white">{formatToken(balance)}</div>
      </div>
      {yieldValue !== undefined ? (
        <div className="rounded-[24px] bg-[rgba(78,222,163,0.08)] p-5 ring-1 ring-[rgba(78,222,163,0.14)]">
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Sparkles className="h-4 w-4 text-[var(--secondary)]" />
            Marketplace reserve growth
          </div>
          <div className="text-3xl font-semibold text-white">{formatToken(yieldValue, 6)}</div>
        </div>
      ) : null}
    </Card>
  )
}
