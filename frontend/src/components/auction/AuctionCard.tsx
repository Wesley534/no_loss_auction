import { ArrowRight, Clock3, Gavel } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AuctionView } from '../../hooks/useAuctions'
import { formatAPR, formatAddress, formatCountdown, formatToken } from '../../lib/format'
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

export function AuctionCard({ auction }: { auction: AuctionView }) {
  return (
    <Card
      className="group flex h-full flex-col gap-5 transition duration-300 hover:-translate-y-1 hover:border-white/12"
      tone={CARD_TONES[auction.statusLabel] ?? 'primary'}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] border border-white/8 bg-white/5">
        <AuctionImage
          alt={auction.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          src={auction.metadata_uri}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,13,28,0.8)] via-transparent to-transparent" />
        <div className="absolute left-4 bottom-4 text-xs uppercase tracking-[0.24em] text-white/80">
          {auction.product_id}
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">{auction.title}</h3>
        </div>
        <StatusBadge
          label={getAuctionStatusText(auction, 'marketplace')}
          status={auction.statusLabel}
        />
      </div>

      <p className="line-clamp-3 text-sm text-[var(--text-muted)]">{auction.description}</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-[rgba(173,198,255,0.08)] p-3 ring-1 ring-[rgba(173,198,255,0.1)]">
          <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
            Highest Bid
          </div>
          <div className="mono font-semibold text-white">{formatToken(auction.highest_bid)}</div>
        </div>
        <div className="rounded-2xl bg-[rgba(78,222,163,0.08)] p-3 ring-1 ring-[rgba(78,222,163,0.1)]">
          <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
            Seller Earnings Rate
          </div>
          <div className="font-semibold text-white">{formatAPR(auction.apr_bps)}</div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-[var(--secondary)]" />
          Seller: {formatAddress(auction.seller)}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[var(--tertiary)]" />
          Time left: {formatCountdown(auction.auction_end_time)}
        </div>
      </div>

      <Link
        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition group-hover:gap-3"
        to={`/auction/${auction.auction_id.toString()}`}
      >
        View details
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
