import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminStats } from '../components/admin/AdminStats'
import { DisputeTable } from '../components/admin/DisputeTable'
import { ResolveDisputeModal } from '../components/admin/ResolveDisputeModal'
import { EmptyState } from '../components/shared/EmptyState'
import { Loader } from '../components/shared/Loader'
import { useAuctions, type AuctionView } from '../hooks/useAuctions'
import { useToken } from '../hooks/useToken'
import { useTransaction } from '../hooks/useTransaction'
import { useWallet } from '../hooks/useWallet'
import { auctionContract, type DisputeDecision } from '../lib/contract'
import { formatAddress, formatToken } from '../lib/format'
import { getAuctionStatusText } from '../lib/status'

export function AdminDashboard() {
  const wallet = useWallet()
  const { auctions, isLoading, refresh, stats } = useAuctions()
  const token = useToken()
  const transaction = useTransaction()
  const [selectedAuction, setSelectedAuction] = useState<AuctionView | undefined>()

  const disputes = useMemo(
    () => auctions.filter((auction) => auction.statusLabel === 'Disputed'),
    [auctions],
  )
  const recentActivity = useMemo(() => auctions.slice(0, 3), [auctions])

  if (!wallet.isAdmin) {
    return (
      <EmptyState
        description="Only the configured admin wallet can access protocol oversight."
        title="Admin access required"
      />
    )
  }

  return (
    <div className="space-y-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-semibold text-white">Protocol Oversight</h1>
          <p className="text-lg text-[var(--text-muted)]">
            Real-time governance and performance monitoring for the No-Loss Yield network.
          </p>
        </div>
        <button
          className="w-fit rounded-xl bg-[var(--secondary)] px-6 py-2.5 font-bold text-[var(--on-secondary)] shadow-lg shadow-[rgba(78,222,163,0.12)] transition-all active:scale-95"
          onClick={() =>
            void transaction
              .execute(
                () => auctionContract.fundYieldReserve(wallet.address!, wallet.address!, 100_000_000n),
                {
                  pending: 'Funding yield reserve...',
                  success: 'Added 10 mUSDC to the yield reserve.',
                },
              )
              .then(() => {
                void token.refresh()
                void refresh()
              })
          }
          type="button"
        >
          Launch New Auction
        </button>
      </header>

      {isLoading ? <Loader label="Loading protocol metrics..." /> : <AdminStats stats={stats} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          {isLoading ? (
            <Loader label="Loading disputes..." />
          ) : (
            <DisputeTable disputes={disputes} onResolve={setSelectedAuction} />
          )}
        </section>
        <section className="glass-panel rounded-xl p-4 shadow-lg">
          <h3 className="mb-4 text-2xl font-semibold text-white">Yield Accrual Rates</h3>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-xs uppercase text-[var(--text-muted)]">Current Reserve</span>
                <span className="mono text-sm text-[var(--secondary)]">{formatToken(token.balance)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-container-highest)]">
                <div
                  className="h-full bg-[var(--secondary)]"
                  style={{ width: `${Math.min(stats.total > 0 ? (stats.active / stats.total) * 100 : 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[rgba(66,71,84,0.1)] bg-[var(--surface-container-high)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-white">
                <span>Network Efficiency</span>
              </div>
              <p className="mb-3 text-xs leading-6 text-[var(--text-muted)]">
                Yield accrues lazily and can be very small over short intervals, so admin metrics
                use higher precision than the public auction views.
              </p>
              <div className="relative h-32 w-full">
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4edea3" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4edea3" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,40 L0,35 Q10,25 20,30 T40,20 T60,25 T80,10 T100,15 L100,40 Z"
                    fill="url(#yieldGrad)"
                  />
                  <path
                    d="M0,35 Q10,25 20,30 T40,20 T60,25 T80,10 T100,15"
                    fill="none"
                    stroke="#4edea3"
                    strokeWidth="1"
                  />
                </svg>
                <div className="absolute right-0 top-0 mono text-sm text-[var(--text-muted)]">
                  Optimum
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[var(--text-muted)]">Global Multiplier</span>
                <span className="mono text-2xl text-white">x{stats.totalAccruedYield > 0n ? '1.04' : '1.00'}</span>
              </div>
              <button
                className="rounded-lg border border-[rgba(66,71,84,0.2)] bg-[var(--surface-container-highest)] px-4 py-2 text-sm font-bold text-white"
                onClick={() => void refresh()}
                type="button"
              >
                Adjust Rate
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="glass-panel overflow-hidden rounded-xl shadow-lg">
        <div className="border-b border-[rgba(66,71,84,0.1)] p-4">
          <h3 className="text-2xl font-semibold text-white">Protocol Activity Log</h3>
        </div>
        <div className="divide-y divide-[rgba(66,71,84,0.1)]">
          {recentActivity.map((auction) => (
            <div
              className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-[rgba(34,42,61,0.4)] md:flex-row md:items-center"
              key={auction.auction_id.toString()}
            >
              <div className="flex items-center gap-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(78,222,163,0.1)] text-[var(--secondary)]">
                  {auction.statusLabel === 'Disputed' ? '!' : '#'}
                </div>
                <div>
                  <h4 className="text-base text-white">
                    Auction #{auction.auction_id.toString()} {getAuctionStatusText(auction, 'admin')}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Winner: {formatAddress(auction.winner ?? auction.highest_bidder ?? undefined)} | Payout:{' '}
                    {formatToken(auction.highest_bid)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="mono text-sm text-[var(--text-muted)]">
                  {getAuctionStatusText(auction, 'admin')}
                </span>
                <Link className="text-[var(--text-muted)] hover:text-white" to={`/auction/${auction.auction_id.toString()}`}>
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ResolveDisputeModal
        auction={selectedAuction}
        isLoading={transaction.isSubmitting}
        onClose={() => setSelectedAuction(undefined)}
        onResolve={async (decision, sellerAmount, buyerAmount) => {
          if (!selectedAuction || !wallet.address) return
          await transaction.execute(
            () =>
              auctionContract.resolveDispute(
                wallet.address!,
                selectedAuction.auction_id,
                wallet.address!,
                { tag: decision, values: undefined } as DisputeDecision,
                sellerAmount,
                buyerAmount,
              ),
            {
              pending: 'Resolving dispute...',
              success: 'Dispute resolved successfully.',
            },
          )
          await refresh()
        }}
        open={Boolean(selectedAuction)}
      />
    </div>
  )
}
