import { ArrowRight, Gavel, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuctionGrid } from '../components/auction/AuctionGrid'
import { ClaimTokensButton } from '../components/token/ClaimTokensButton'
import { TokenBalanceCard } from '../components/token/TokenBalanceCard'
import { Card } from '../components/shared/Card'
import { Loader } from '../components/shared/Loader'
import { useAuctions } from '../hooks/useAuctions'
import { useToken } from '../hooks/useToken'
import { useTransaction } from '../hooks/useTransaction'
import { useWallet } from '../hooks/useWallet'
import { FREIGHTER_INSTALL_URL, STELLAR_FRIENDBOT_URL } from '../lib/constants'
import { auctionContract } from '../lib/contract'

export function Home() {
  const { auctions, isLoading, stats, refresh } = useAuctions()
  const wallet = useWallet()
  const token = useToken()
  const transaction = useTransaction()

  const activeAuctions = auctions.filter((auction) =>
    ['Active', 'AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel),
  )
  const completedAuctions = auctions.filter((auction) =>
    ['Completed', 'Resolved'].includes(auction.statusLabel),
  )

  const claimTokens = async (amount: string) => {
    if (!wallet.address) return
    await transaction.execute(
      () => auctionContract.claimTestTokens(wallet.address!, wallet.address!),
      {
        pending: `Adding ${amount} in test funds...`,
        success:
          'Test funds added. You can now browse, bid, and create listings in the demo marketplace.',
      },
    )
    await token.refresh()
  }

  return (
    <div className="space-y-8">
      {!wallet.isFreighterInstalled ? (
        <Card className="text-sky-100" tone="primary">
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white">Set up your wallet to continue</div>
            <p className="text-sm leading-7 text-sky-100/90">
              Install the Freighter browser extension, create or import a wallet, switch to
              Stellar Testnet, and add test funds before connecting to the marketplace.
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
          </div>
        </Card>
      ) : null}

            {wallet.error ? (
              <Card className="text-rose-100" tone="danger">
          {wallet.error}
        </Card>
      ) : null}

      {!wallet.isCorrectNetwork && wallet.isFreighterInstalled ? (
        <Card
          aria-live="polite"
                className="text-amber-50"
                tone="tertiary"
          role="alert"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              Network warning
            </div>
            <div className="text-lg font-semibold text-white">Switch your wallet to Stellar Testnet</div>
            <p className="text-sm leading-7 text-amber-100/90">
              Your wallet is currently connected to <span className="font-semibold text-white">{wallet.networkLabel}</span>.
              Open Freighter, switch to Stellar Testnet, then refresh or reconnect here.
            </p>
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

      <section className="relative overflow-hidden rounded-[36px] border border-white/6 px-6 py-10 md:px-10 md:py-14">
        <div className="grid-hero absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(77,142,255,0.12)] via-transparent to-[rgba(78,222,163,0.08)]" />
        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(26rem,0.8fr)]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              Buyer-protected auction marketplace
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white md:text-6xl">
              Discover unique items, place confident bids, and sell with protected payments.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
              Browse live auctions, create your own listing, and track every order from bid to
              delivery. In this demo, all activity runs with test funds on Stellar Testnet.
            </p>

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <ClaimTokensButton
                disabled={!wallet.address || !wallet.isCorrectNetwork}
                isLoading={transaction.isSubmitting}
                onClaim={claimTokens}
              />
              <div className="flex lg:flex-1 lg:justify-end">
                <Link
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--secondary)] px-7 py-4 text-base font-bold tracking-[0.01em] text-slate-950 shadow-[0_10px_22px_rgba(78,222,163,0.16)] ring-1 ring-white/8 transition hover:-translate-y-0.5 hover:bg-[#57e8b0] hover:shadow-[0_12px_26px_rgba(78,222,163,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ff7d2]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent lg:w-auto"
                  to="/create"
                >
                  Sell an Item
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <TokenBalanceCard
              balance={token.balance}
              yieldValue={wallet.isAdmin ? stats.totalAccruedYield : undefined}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Open Auctions', value: stats.active.toString(), Icon: Gavel },
                { label: 'Issues to Review', value: stats.disputed.toString(), Icon: Shield },
                { label: 'Completed Sales', value: stats.completed.toString(), Icon: Sparkles },
              ].map(({ label, value, Icon }, index) => (
                <Card
                  key={label}
                  tone={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary'}
                >
                  <div className="mb-3 inline-flex rounded-2xl bg-white/6 p-3 text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mono text-2xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">{label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>



      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Marketplace
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-white">Open auctions</h2>
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
            auctions={activeAuctions}
            emptyDescription="No auctions are available right now. Check back soon or create your own listing."
            emptyTitle="No open auctions right now"
          />
        )}
      </section>

      <section className="space-y-5">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
            Results
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Recently completed auctions</h2>
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
