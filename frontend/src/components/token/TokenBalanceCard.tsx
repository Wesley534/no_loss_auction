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
    <Card className={yieldValue === undefined ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}>
      <div className="rounded-[24px] bg-white/5 p-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Coins className="h-4 w-4 text-[var(--primary)]" />
          Token balance
        </div>
        <div className="text-3xl font-semibold text-white">{formatToken(balance)}</div>
      </div>
      {yieldValue !== undefined ? (
        <div className="rounded-[24px] bg-white/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Sparkles className="h-4 w-4 text-[var(--secondary)]" />
            Estimated protocol yield
          </div>
          <div className="text-3xl font-semibold text-white">{formatToken(yieldValue, 6)}</div>
        </div>
      ) : null}
    </Card>
  )
}
