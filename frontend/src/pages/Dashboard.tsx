import { ArrowRight, Gavel, ShieldAlert, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/shared/EmptyState'
import { Card } from '../components/shared/Card'
import { Loader } from '../components/shared/Loader'
import { useAuctions } from '../hooks/useAuctions'
import { useToken } from '../hooks/useToken'
import { useWallet } from '../hooks/useWallet'
import { formatToken } from '../lib/format'
import { getAuctionStatusText } from '../lib/status'
import { AdminDashboard } from './AdminDashboard'

export function DashboardPage() {
  const wallet = useWallet()
  const token = useToken()
  const { auctions, isLoading } = useAuctions()

  if (!wallet.address) {
    return (
      <EmptyState
        description="Connect your wallet to see your bids, listings, payments, and next steps."
        title="Your account is not available yet"
      />
    )
  }

  if (wallet.isAdmin) return <AdminDashboard />

  const createdAuctions = auctions.filter((auction) => auction.seller === wallet.address)
  const bidAuctions = auctions.filter(
    (auction) => auction.highest_bidder === wallet.address || auction.winner === wallet.address,
  )
  const activeListings = createdAuctions.filter((auction) =>
    ['Active', 'AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel),
  )
  const wonAuctions = auctions.filter((auction) => auction.winner === wallet.address)
  const lockedBidVolume = bidAuctions
    .filter((auction) =>
      ['Active', 'AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel),
    )
    .reduce((sum, auction) => sum + auction.highest_bid, 0n)

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
            My Account
          </div>
          <h1 className="text-5xl font-bold tracking-[-0.02em] text-white">Account overview</h1>
          <p className="mt-2 max-w-2xl text-lg text-[var(--text-muted)]">
            Track what you're selling, what you're bidding on, what you've won, and any payments
            that still need attention.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--on-primary)] transition hover:brightness-110"
            to="/create"
          >
            Sell an Item
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            to="/activity"
          >
            Review Buying Activity
          </Link>
        </div>
      </header>

      {isLoading ? (
        <Loader label="Loading your account..." />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card tone="primary">
              <div className="mb-3 inline-flex rounded-2xl bg-white/6 p-3 text-[var(--primary)]">
                <WalletCards className="h-5 w-5" />
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Available Balance
              </div>
              <div className="mono mt-4 text-3xl font-semibold text-white">
                {formatToken(token.balance)}
              </div>
            </Card>
            <Card tone="secondary">
              <div className="mb-3 inline-flex rounded-2xl bg-white/6 p-3 text-[var(--secondary)]">
                <Gavel className="h-5 w-5" />
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Your Listings
              </div>
              <div className="mono mt-4 text-3xl font-semibold text-white">
                {createdAuctions.length}
              </div>
            </Card>
            <Card tone="tertiary">
              <div className="mb-3 inline-flex rounded-2xl bg-white/6 p-3 text-[var(--tertiary)]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Open Listings
              </div>
              <div className="mono mt-4 text-3xl font-semibold text-white">
                {activeListings.length}
              </div>
            </Card>
            <Card tone="danger">
              <div className="mb-3 inline-flex rounded-2xl bg-white/6 p-3 text-[var(--danger)]">
                <WalletCards className="h-5 w-5" />
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Protected Bids
              </div>
              <div className="mono mt-4 text-3xl font-semibold text-white">
                {formatToken(lockedBidVolume)}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card tone="primary" className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Selling
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Recent listings</h2>
                </div>
              </div>
              {createdAuctions.length === 0 ? (
                <EmptyState
                  description="Ready to sell something? Create your first auction and it will appear here."
                  title="No listings yet"
                />
              ) : (
                <div className="space-y-3">
                  {createdAuctions.slice(0, 4).map((auction) => (
                    <Link
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
                      key={auction.auction_id.toString()}
                      to={`/auction/${auction.auction_id.toString()}`}
                    >
                      <div>
                        <div className="font-semibold text-white">{auction.title}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          {getAuctionStatusText(auction, 'seller', wallet.address)}
                        </div>
                      </div>
                      <div className="mono text-sm text-[var(--primary)]">
                        {formatToken(auction.highest_bid)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card tone="secondary" className="p-6">
              <div className="mb-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Buying
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">Buying summary</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Auctions You Joined
                  </div>
                  <div className="mono mt-3 text-3xl font-semibold text-white">
                    {bidAuctions.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Auctions Won
                  </div>
                  <div className="mono mt-3 text-3xl font-semibold text-white">
                    {wonAuctions.length}
                  </div>
                </div>
                <Link
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--secondary)] px-5 py-3 text-sm font-semibold text-[var(--on-secondary)] transition hover:brightness-110"
                  to="/activity"
                >
                  View Buying Activity
                </Link>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
