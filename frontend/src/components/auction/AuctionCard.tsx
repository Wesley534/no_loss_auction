import { ArrowRight, Gavel, Hammer } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AuctionView } from '../../hooks/useAuctions'
import { formatAddress, formatCountdown, formatToken } from '../../lib/format'
import { getAuctionStatusText } from '../../lib/status'
import { AuctionImage } from '../shared/AuctionImage'
import { Card } from '../shared/Card'
import { StatusBadge } from './StatusBadge'

const CARD_TONES: Record<string, 'primary' | 'secondary' | 'tertiary' | 'danger' | 'neutral'> = {
  Active: 'primary',
  AwaitingConfirmation: 'tertiary',
  Disputed: 'danger',
  Completed: 'secondary',
  Resolved: 'secondary',
  Cancelled: 'neutral',
}

const MARKET_SIGNAL_STYLES = {
  ending: 'bg-amber-300/14 text-amber-100 ring-1 ring-amber-300/20',
  fresh: 'bg-sky-300/14 text-sky-100 ring-1 ring-sky-300/20',
  popular: 'bg-rose-300/14 text-rose-100 ring-1 ring-rose-300/20',
} as const

function getMarketplaceSignals(auction: AuctionView) {
  const now = Math.floor(Date.now() / 1000)
  const endTime = Number(auction.auction_end_time)
  const startTime = Number(auction.auction_start_time)
  const secondsUntilEnd = endTime - now
  const isEndingSoon = auction.statusLabel === 'Active' && secondsUntilEnd > 0 && secondsUntilEnd <= 43_200
  const isNewListing = now - startTime <= 86_400
  const isPopular = auction.highest_bid > auction.starting_bid && auction.highest_bidder

  const signals = [
    isEndingSoon
      ? {
          label: 'Ending Soon',
          className: MARKET_SIGNAL_STYLES.ending,
        }
      : null,
    isNewListing
      ? {
          label: 'New Listing',
          className: MARKET_SIGNAL_STYLES.fresh,
        }
      : null,
    isPopular
      ? {
          label: 'Popular',
          className: MARKET_SIGNAL_STYLES.popular,
        }
      : null,
  ].filter(Boolean) as { label: string; className: string }[]

  return signals.slice(0, 2)
}

export function AuctionCard({ auction }: { auction: AuctionView }) {
  const signals = getMarketplaceSignals(auction)

  return (
    <Card
      className="group flex h-full flex-col gap-4 rounded-[30px] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/12"
      tone={CARD_TONES[auction.statusLabel] ?? 'primary'}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-white/8 bg-white/5">
        <AuctionImage
          alt={auction.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          src={auction.metadata_uri}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,13,28,0.8)] via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {signals.map((signal) => (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.12em] ${signal.className}`}
              key={signal.label}
            >
              {signal.label}
            </span>
          ))}
        </div>
        <div className="absolute right-4 top-4">
          <StatusBadge
            label={getAuctionStatusText(auction, 'marketplace')}
            status={auction.statusLabel}
          />
        </div>
        <div className="absolute left-4 bottom-4 text-[11px] uppercase tracking-[0.24em] text-white/80">
          {auction.product_id}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="text-xl font-semibold text-white">{auction.title}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Sold by {formatAddress(auction.seller)}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
        {auction.description}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-[rgba(173,198,255,0.08)] p-3.5 ring-1 ring-[rgba(173,198,255,0.1)]">
          <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
            Current Bid
          </div>
          <div className="mono text-base font-semibold text-white">
            {formatToken(auction.highest_bid > 0n ? auction.highest_bid : auction.starting_bid)}
          </div>
        </div>
        <div className="rounded-2xl bg-[rgba(78,222,163,0.08)] p-3.5 ring-1 ring-[rgba(78,222,163,0.1)]">
          <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
            Time Remaining
          </div>
          <div className="font-semibold text-white">{formatCountdown(auction.auction_end_time)}</div>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-[var(--text-muted)]">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-[var(--secondary)]" />
            <span>Starts at</span>
          </div>
          <span className="mono text-white">{formatToken(auction.starting_bid)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-[var(--tertiary)]" />
            <span>Top bidder</span>
          </div>
          <span className="mono text-white">
            {auction.highest_bidder ? formatAddress(auction.highest_bidder) : 'No bids yet'}
          </span>
        </div>
      </div>

      <Link
        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition group-hover:gap-3"
        to={`/auction/${auction.auction_id.toString()}`}
      >
        View listing
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
