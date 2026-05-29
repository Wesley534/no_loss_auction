import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/shared/EmptyState'
import { Card } from '../components/shared/Card'
import { Loader } from '../components/shared/Loader'
import { useAuctions } from '../hooks/useAuctions'
import { useTransaction } from '../hooks/useTransaction'
import { useWallet } from '../hooks/useWallet'
import { auctionContract } from '../lib/contract'
import { formatAddress, formatCountdown, formatToken } from '../lib/format'
import { getAuctionStatusText } from '../lib/status'

const FILTERS = ['All Listings', 'Sold', 'Ended'] as const

export function SellerDashboard() {
  const wallet = useWallet()
  const { auctions, isLoading, refresh } = useAuctions()
  const transaction = useTransaction()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All Listings')

  const visibleAuctions = useMemo(() => {
    const scoped = wallet.isAdmin
      ? auctions
      : auctions.filter((auction) => auction.seller === wallet.address)

    if (filter === 'Sold') {
      return scoped.filter((auction) => ['Completed', 'Resolved'].includes(auction.statusLabel))
    }

    if (filter === 'Ended') {
      return scoped.filter((auction) => auction.isEnded && auction.statusLabel === 'Cancelled')
    }

    return scoped
  }, [auctions, filter, wallet.address, wallet.isAdmin])

  const totalSalesRevenue = visibleAuctions
    .filter((auction) => ['Completed', 'Resolved'].includes(auction.statusLabel))
    .reduce((sum, auction) => sum + auction.highest_bid, 0n)
  const activeCount = visibleAuctions.filter((auction) =>
    ['Active', 'AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel),
  ).length
  const pendingPayouts = visibleAuctions
    .filter((auction) => ['AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel))
    .reduce((sum, auction) => sum + auction.highest_bid, 0n)

  if (!wallet.address) {
    return (
      <EmptyState
        description="Connect your wallet to manage live listings and launch new auctions."
        title="Your selling hub is locked"
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded border border-[rgba(173,198,255,0.2)] bg-[rgba(173,198,255,0.1)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
              {wallet.isAdmin ? 'Marketplace Team' : 'Your Listings'}
            </span>
          </div>
          <h1 className="text-5xl font-bold tracking-[-0.02em] text-white">Selling hub</h1>
          <p className="mt-2 text-lg text-[var(--text-muted)]">
            Manage your listings, follow bidding activity, and see which payments still need buyer
            confirmation.
          </p>
        </div>
        <Link
          className="group inline-flex items-center gap-3 rounded-2xl bg-[var(--primary)] px-8 py-4 font-bold text-[var(--on-primary)] shadow-lg transition-all hover:shadow-[0_12px_30px_rgba(173,198,255,0.2)] active:scale-95"
          to="/create"
        >
          <span>Create Auction</span>
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card tone="secondary">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Seller Earnings
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="mono text-4xl font-semibold text-white">
              {formatToken(totalSalesRevenue)}
            </span>
          </div>
        </Card>
        <Card tone="primary">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Open Auctions
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="mono text-4xl font-semibold text-white">{activeCount}</span>
            <span className="text-sm font-semibold text-[var(--primary)]">Live Now</span>
          </div>
        </Card>
        <Card tone="tertiary" className="relative overflow-hidden">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Payments Awaiting Release
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="mono text-4xl font-semibold text-[var(--tertiary)]">
              {formatToken(pendingPayouts)}
            </span>
            <span className="text-sm italic text-[var(--text-muted)]">(Protected)</span>
          </div>
        </Card>
      </section>

      <Card tone="primary" className="overflow-hidden p-0">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[rgba(66,71,84,0.1)] p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">Your listings</h2>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-container-low)] p-1">
            {FILTERS.map((item) => (
              <button
                className={
                  filter === item
                    ? 'rounded-md bg-[var(--surface-container-highest)] px-4 py-1.5 text-xs font-bold text-white'
                    : 'rounded-md px-4 py-1.5 text-xs font-bold text-[var(--text-muted)] transition hover:text-white'
                }
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Loader label="Loading your listings..." />
        ) : visibleAuctions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              description="Ready to sell something? Create an auction and manage it here."
              title="No listings match this filter"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[rgba(66,71,84,0.1)] bg-[rgba(19,27,46,0.5)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Highest Bid</th>
                  <th className="px-6 py-4">Buyer / Listing</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(66,71,84,0.1)]">
                {visibleAuctions.map((auction) => (
                  <tr className="group transition-colors hover:bg-[rgba(34,42,61,0.3)]" key={auction.auction_id.toString()}>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[rgba(66,71,84,0.2)] bg-[var(--surface-container-highest)] text-xs font-bold text-[var(--primary)]">
                          #{auction.auction_id.toString()}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">{auction.title}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            {auction.statusLabel === 'Active'
                              ? `Ends in: ${formatCountdown(auction.auction_end_time)}`
                              : `Seller: ${formatAddress(auction.seller)}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs font-bold">
                        {getAuctionStatusText(auction, 'seller')}
                      </span>
                    </td>
                    <td className="px-6 py-6 mono text-white">
                      {auction.highest_bid > 0n ? formatToken(auction.highest_bid) : '--'}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="mono text-xs text-white">
                          {auction.winner ? formatAddress(auction.winner) : 'No buyer yet'}
                        </span>
                        <a
                          className="flex items-center gap-1 text-xs text-[var(--text-faint)] underline underline-offset-4"
                          href={auction.metadata_uri}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Listing photo
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      {auction.statusLabel === 'Active' && auction.highest_bid === 0n && !wallet.isAdmin ? (
                        <button
                          className="rounded-xl border border-[rgba(255,138,128,0.2)] bg-[rgba(255,138,128,0.1)] px-4 py-2 text-xs font-bold text-[var(--danger)] transition-all"
                          onClick={() =>
                            void transaction
                              .execute(
                                () => auctionContract.cancelAuction(wallet.address!, auction.auction_id),
                                {
                                  pending: 'Canceling your auction...',
                                  success: 'Your auction has been canceled.',
                                },
                              )
                              .then(refresh)
                          }
                          type="button"
                        >
                          Cancel Auction
                        </button>
                      ) : (
                        <Link
                          className="inline-flex rounded-xl bg-[var(--secondary)] px-5 py-2.5 text-xs font-bold text-[var(--on-secondary)] transition-all active:scale-95"
                          to={`/auction/${auction.auction_id.toString()}`}
                        >
                          View Details
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
