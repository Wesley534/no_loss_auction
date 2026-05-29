import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminStats } from '../components/admin/AdminStats'
import { DisputeTable } from '../components/admin/DisputeTable'
import { ResolveDisputeModal } from '../components/admin/ResolveDisputeModal'
import { Card } from '../components/shared/Card'
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
        description="Only the marketplace team wallet can access insights, payments, and issue reviews."
        title="Marketplace access required"
      />
    )
  }

  return (
    <div className="space-y-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-semibold text-white">Marketplace insights</h1>
          <p className="text-lg text-[var(--text-muted)]">
            Monitor marketplace activity, add reserve funds, and review buyer-reported issues.
          </p>
        </div>
        <button
          className="w-fit rounded-xl bg-[var(--secondary)] px-6 py-2.5 font-bold text-[var(--on-secondary)] shadow-lg shadow-[rgba(78,222,163,0.12)] transition-all active:scale-95"
          onClick={() =>
            void transaction
              .execute(
                () => auctionContract.fundYieldReserve(wallet.address!, wallet.address!, 100_000_000n),
                {
                  pending: 'Adding funds to the marketplace reserve...',
                  success: 'Added 10 mUSDC to the marketplace reserve.',
                },
              )
              .then(() => {
                void token.refresh()
                void refresh()
              })
          }
          type="button"
        >
          Add Platform Funds
        </button>
      </header>

      {isLoading ? <Loader label="Loading marketplace insights..." /> : <AdminStats stats={stats} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          {isLoading ? (
            <Loader label="Loading reported issues..." />
          ) : (
            <DisputeTable disputes={disputes} onResolve={setSelectedAuction} />
          )}
        </section>
        <Card tone="secondary" className="rounded-xl p-4">
          <h3 className="mb-4 text-2xl font-semibold text-white">Marketplace reserve</h3>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-xs uppercase text-[var(--text-muted)]">Available reserve</span>
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
                <span>Reserve health</span>
              </div>
              <p className="mb-3 text-xs leading-6 text-[var(--text-muted)]">
                This view tracks how much reserve coverage is available while auctions stay active
                and payments remain protected.
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
                  Healthy
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[var(--text-muted)]">Reserve multiplier</span>
                <span className="mono text-2xl text-white">x{stats.totalAccruedYield > 0n ? '1.04' : '1.00'}</span>
              </div>
              <button
                className="rounded-lg border border-[rgba(66,71,84,0.2)] bg-[var(--surface-container-highest)] px-4 py-2 text-sm font-bold text-white"
                onClick={() => void refresh()}
                type="button"
              >
                Refresh View
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card tone="primary" className="overflow-hidden rounded-xl p-0">
        <div className="border-b border-[rgba(66,71,84,0.1)] p-4">
          <h3 className="text-2xl font-semibold text-white">Marketplace activity</h3>
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
                    Buyer: {formatAddress(auction.winner ?? auction.highest_bidder ?? undefined)} | Payment:{' '}
                    {formatToken(auction.highest_bid)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="mono text-sm text-[var(--text-muted)]">
                  {getAuctionStatusText(auction, 'admin')}
                </span>
                <Link className="text-[var(--text-muted)] hover:text-white" to={`/auction/${auction.auction_id.toString()}`}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
              pending: 'Resolving the reported issue...',
              success: 'The issue has been resolved.',
            },
          )
          await refresh()
        }}
        open={Boolean(selectedAuction)}
      />
    </div>
  )
}
