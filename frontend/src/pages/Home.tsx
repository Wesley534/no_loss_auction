import { ArrowRight, Gavel, Sparkles, Trophy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuctionGrid } from '../components/auction/AuctionGrid'
import { Button } from '../components/shared/Button'
import { Card } from '../components/shared/Card'
import { Loader } from '../components/shared/Loader'
import { TokenBalanceCard } from '../components/token/TokenBalanceCard'
import { useAuctions } from '../hooks/useAuctions'
import { useToken } from '../hooks/useToken'
import { useTransaction } from '../hooks/useTransaction'
import { useWallet } from '../hooks/useWallet'
import { FREIGHTER_INSTALL_URL, STELLAR_FRIENDBOT_URL } from '../lib/constants'
import { auctionContract } from '../lib/contract'
import { formatNumber } from '../lib/format'

export function Home() {
  const { auctions, isLoading, refresh } = useAuctions()
  const wallet = useWallet()
  const token = useToken()
  const transaction = useTransaction()

  const openAuctions = auctions.filter((auction) => auction.statusLabel === 'Active')
  const completedAuctions = auctions.filter((auction) =>
    ['Completed', 'Resolved'].includes(auction.statusLabel),
  )
  const endingSoonAuctions = [...openAuctions]
    .sort((left, right) => Number(left.auction_end_time) - Number(right.auction_end_time))
    .slice(0, 3)
  const activeBidderCount = new Set(
    openAuctions
      .map((auction) => auction.highest_bidder)
      .filter((bidder): bidder is string => Boolean(bidder)),
  ).size

  const claimTokens = async () => {
    if (!wallet.address) return

    await transaction.execute(
      () => auctionContract.claimTestTokens(wallet.address!, wallet.address!),
      {
        pending: 'Adding test funds to your wallet...',
        success:
          'Test funds added. You can now browse, bid, and create listings in the demo marketplace.',
      },
    )

    await token.refresh()
  }

  return (
    <div className="space-y-6">
      {!wallet.isFreighterInstalled ? (
        <Card className="text-sky-100" tone="primary">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="text-base font-semibold text-white">Set up your wallet to continue</div>
              <p className="text-sm leading-6 text-sky-100/90">
                Install the Freighter browser extension, create or import a wallet, switch to
                Stellar Testnet, and add test funds before connecting to the marketplace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)]"
                href={FREIGHTER_INSTALL_URL}
                rel="noreferrer"
                target="_blank"
              >
                Install Wallet
              </a>
              <a
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                href={STELLAR_FRIENDBOT_URL}
                rel="noreferrer"
                target="_blank"
              >
                Add Test Funds
              </a>
            </div>
          </div>
        </Card>
      ) : null}

      {wallet.error ? (
        <Card className="text-rose-100" tone="danger">
          {wallet.error}
        </Card>
      ) : null}

      {!wallet.isCorrectNetwork && wallet.isFreighterInstalled ? (
        <Card aria-live="polite" className="text-amber-50" role="alert" tone="tertiary">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                Network warning
              </div>
              <div className="text-base font-semibold text-white">Switch your wallet to Stellar Testnet</div>
              <p className="text-sm leading-6 text-amber-100/90">
                Your wallet is currently connected to{' '}
                <span className="font-semibold text-white">{wallet.networkLabel}</span>. Open
                Freighter, switch to Stellar Testnet, then refresh or reconnect here.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center rounded-xl bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-[var(--on-secondary)]"
                onClick={() => void wallet.refresh()}
                type="button"
              >
                Check Again
              </button>
              <a
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                href={STELLAR_FRIENDBOT_URL}
                rel="noreferrer"
                target="_blank"
              >
                Add Test Funds
              </a>
            </div>
          </div>
        </Card>
      ) : null}

      <section className="relative overflow-hidden rounded-[32px] border border-white/6 px-5 py-5 md:px-6 md:py-6">
        <div className="grid-hero absolute inset-0 opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(77,142,255,0.12)] via-transparent to-[rgba(78,222,163,0.08)]" />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(24rem,0.7fr)] xl:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[var(--primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              No-Loss Auction
            </div>

            <div className="space-y-2">
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                Discover unique items and bid securely.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)] md:text-base">
                Browse live auctions, place bids with confidence, or list your own item in
                minutes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--secondary)] px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_12px_24px_rgba(78,222,163,0.18)] transition hover:-translate-y-0.5 hover:bg-[#59eab3]"
                to="/auctions"
              >
                Sell Item
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Button
                className="sm:min-w-[190px]"
                disabled={!wallet.address || !wallet.isCorrectNetwork}
                isLoading={transaction.isSubmitting}
                onClick={() => void claimTokens()}
                variant="ghost"
              >
                Claim Test Tokens
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                label: 'Open Auctions',
                value: formatNumber(openAuctions.length),
                Icon: Gavel,
              },
              {
                label: 'Active Bidders',
                value: formatNumber(activeBidderCount),
                Icon: Users,
              },
              {
                label: 'Completed Auctions',
                value: formatNumber(completedAuctions.length),
                Icon: Trophy,
              },
            ].map(({ label, value, Icon }, index) => (
              <Card
                className="rounded-[24px] p-4"
                key={label}
                tone={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary'}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
                      {label}
                    </div>
                    <div className="mono mt-3 text-2xl font-semibold text-white">{value}</div>
                  </div>
                  <div className="rounded-2xl bg-white/6 p-3 text-[var(--primary)]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Open Auctions
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-white md:text-3xl">Bid on live listings</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Fresh items ready for bidding right now.
            </p>
          </div>
          <button
            className="text-sm font-semibold text-[var(--primary)]"
            onClick={() => void refresh()}
            type="button"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <AuctionGrid
            auctions={openAuctions}
            emptyDescription="No auctions are available right now. Check back soon or create your own listing."
            emptyTitle="No open auctions right now"
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
            Featured
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-white">Ending soon</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Listings closing soonest, so bidders can act quickly.
          </p>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <AuctionGrid
            auctions={endingSoonAuctions}
            emptyDescription="Once active listings are live, the auctions closest to closing will appear here."
            emptyTitle="No ending-soon auctions yet"
          />
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="space-y-4 rounded-[30px] p-5" tone="neutral">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Marketplace Statistics
            </div>
            <h2 className="mt-1 text-2xl font-semibold text-white">Marketplace at a glance</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Live Listings',
                value: formatNumber(openAuctions.length),
                tone: 'bg-[rgba(173,198,255,0.08)] ring-[rgba(173,198,255,0.14)]',
              },
              {
                label: 'Bidders in Action',
                value: formatNumber(activeBidderCount),
                tone: 'bg-[rgba(78,222,163,0.08)] ring-[rgba(78,222,163,0.14)]',
              },
              {
                label: 'Completed Sales',
                value: formatNumber(completedAuctions.length),
                tone: 'bg-[rgba(255,185,95,0.08)] ring-[rgba(255,185,95,0.14)]',
              },
            ].map((item) => (
              <div className={`rounded-[24px] p-4 ring-1 ${item.tone}`} key={item.label}>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                  {item.label}
                </div>
                <div className="mono mt-3 text-2xl font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {wallet.address ? (
          <TokenBalanceCard balance={token.balance} />
        ) : (
          <Card className="space-y-3 rounded-[30px] p-5" tone="primary">
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Ready to bid?
            </div>
            <h2 className="text-2xl font-semibold text-white">Connect and start exploring</h2>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Install Freighter, switch to Stellar Testnet, and claim test funds to start bidding.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)]"
                href={FREIGHTER_INSTALL_URL}
                rel="noreferrer"
                target="_blank"
              >
                Install Wallet
              </a>
              <a
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                href={STELLAR_FRIENDBOT_URL}
                rel="noreferrer"
                target="_blank"
              >
                Add Test Funds
              </a>
            </div>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
            Results
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-white">Recently completed auctions</h2>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <AuctionGrid
            auctions={completedAuctions}
            emptyDescription="Finished auctions and resolved orders will appear here once sales are completed."
            emptyTitle="No completed auctions yet"
          />
        )}
      </section>
    </div>
  )
}
