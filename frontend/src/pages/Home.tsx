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
        pending: `Simulating fiat deposit of ${amount}...`,
        success:
          'Deposit request submitted. The current MVP credits the one-time 1,000 mUSDC test balance cap.',
      },
    )
    await token.refresh()
  }

  return (
    <div className="space-y-8">
      {!wallet.isFreighterInstalled ? (
        <Card className="border border-sky-500/30 bg-sky-500/8 text-sky-100">
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white">Set up Freighter to continue</div>
            <p className="text-sm leading-7 text-sky-100/90">
              Install the Freighter browser extension, create or import a wallet, switch it to
              Stellar Testnet, and then fund the account with Friendbot before connecting here.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)]"
                href={FREIGHTER_INSTALL_URL}
                rel="noreferrer"
                target="_blank"
              >
                Install Freighter
              </a>
              <a
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                href={STELLAR_FRIENDBOT_URL}
                rel="noreferrer"
                target="_blank"
              >
                Open Friendbot
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
              No-Loss Yield Auction Protocol
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white md:text-6xl">
              Premium escrow auctions where locked bids simulate yield until settlement.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
              Simulate a fiat deposit for up to 1,000 mUSDC, bid in a live marketplace,
              and manage delivery or disputes on Stellar testnet with a single monolithic
              Soroban contract.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                to="/create"
              >
                Create Auction
                <ArrowRight className="h-4 w-4" />
              </Link>
              <ClaimTokensButton
                disabled={!wallet.address || !wallet.isCorrectNetwork}
                isLoading={transaction.isSubmitting}
                onClaim={claimTokens}
              />
            </div>
          </div>

          <div className="space-y-5">
            <TokenBalanceCard
              balance={token.balance}
              yieldValue={wallet.isAdmin ? stats.totalAccruedYield : undefined}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Live Auctions', value: stats.active.toString(), Icon: Gavel },
                { label: 'Disputes', value: stats.disputed.toString(), Icon: Shield },
                { label: 'Settled', value: stats.completed.toString(), Icon: Sparkles },
              ].map(({ label, value, Icon }) => (
                <Card key={label}>
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

      {!wallet.isCorrectNetwork && wallet.isFreighterInstalled ? (
        <Card className="border border-amber-500/30 bg-amber-500/8 text-amber-100">
          <div className="space-y-3">
            <div className="text-lg font-semibold text-white">Switch Freighter to Stellar Testnet</div>
            <p className="text-sm leading-7 text-amber-100/90">
              Your wallet is currently connected to <span className="font-semibold text-white">{wallet.networkLabel}</span>.
              Open Freighter, change the active network to Stellar Testnet, then refresh or reconnect.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center rounded-xl bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-[var(--on-secondary)]"
                onClick={() => void wallet.refresh()}
                type="button"
              >
                Recheck Network
              </button>
              <a
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                href={STELLAR_FRIENDBOT_URL}
                rel="noreferrer"
                target="_blank"
              >
                Fund Testnet Wallet
              </a>
            </div>
          </div>
        </Card>
      ) : null}

      {wallet.error ? (
        <Card className="border border-rose-500/30 bg-rose-500/8 text-rose-100">
          {wallet.error}
        </Card>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Marketplace
            </div>
            <h2 className="mt-2 text-3xl font-semibold text-white">Active auctions</h2>
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
            emptyDescription="Once sellers launch new listings, they will appear here for bidding."
            emptyTitle="No active auctions yet"
          />
        )}
      </section>

      <section className="space-y-5">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-faint)]">
            Archive
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Completed auctions</h2>
        </div>
        {isLoading ? (
          <Loader />
        ) : (
          <AuctionGrid
            auctions={completedAuctions}
            emptyDescription="Resolved and completed settlements will appear here."
            emptyTitle="No completed auctions yet"
          />
        )}
      </section>
    </div>
  )
}
