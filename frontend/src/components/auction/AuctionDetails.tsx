import type { PropsWithChildren } from 'react'
import type { AuctionState } from '../../lib/contract'
import {
  formatAPR,
  formatAddress,
  formatCountdown,
  formatDate,
  formatToken,
} from '../../lib/format'
import { getAuctionStatusText } from '../../lib/status'
import { AuctionImage } from '../shared/AuctionImage'
import { Card } from '../shared/Card'
import { StatusBadge } from './StatusBadge'

export function AuctionDetails({
  auction,
  estimatedYield,
  showYield = false,
  children,
}: PropsWithChildren<{ auction: AuctionState; estimatedYield: bigint; showYield?: boolean }>) {
  const details: [string, string][] = [
    ['Seller', formatAddress(auction.seller)],
    ['Current highest bidder', formatAddress(auction.highest_bidder ?? undefined)],
    ['Starting price', formatToken(auction.starting_bid)],
    ['Highest bid', formatToken(auction.highest_bid)],
    ['Seller earnings rate', formatAPR(auction.apr_bps)],
    ['Auction ends', formatDate(auction.auction_end_time)],
    ['Time remaining', formatCountdown(auction.auction_end_time)],
  ]

  if (showYield) {
    details.splice(4, 0, ['Marketplace reserve estimate', formatToken(estimatedYield, 6)])
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)]">
      <Card className="space-y-6" tone="primary">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] border border-white/8 bg-white/5">
          <AuctionImage alt={auction.title} className="h-full w-full object-cover" src={auction.metadata_uri} />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,13,28,0.82)] via-transparent to-transparent" />
          <div className="absolute left-5 bottom-5 text-xs uppercase tracking-[0.24em] text-white/80">
            {auction.product_id}
          </div>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-white">{auction.title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--text-muted)]">
              {auction.description}
            </p>
          </div>
          <StatusBadge
            label={getAuctionStatusText(auction, 'marketplace')}
            status={auction.status.tag}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {details.map(([label, value]) => (
            <div className="rounded-3xl bg-white/5 p-4" key={label}>
              <div className="mb-1 text-xs uppercase tracking-[0.22em] text-[var(--text-faint)]">
                {label}
              </div>
              <div className="mono text-lg font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>

        {auction.dispute_reason ? (
          <Card className="rounded-[24px] text-rose-100" tone="danger">
            <div className="text-sm font-semibold text-rose-200">Reported issue</div>
            <p className="mt-2 text-sm text-rose-100/90">{auction.dispute_reason}</p>
            {auction.dispute_evidence_uri ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs uppercase tracking-[0.22em] text-rose-200/75">
                  Supporting photo
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <AuctionImage
                    alt={`${auction.title} dispute evidence`}
                    className="h-72 w-full object-cover"
                    src={auction.dispute_evidence_uri}
                  />
                </div>
              </div>
            ) : null}
          </Card>
        ) : null}
      </Card>

      <div className="space-y-6">{children}</div>
    </div>
  )
}
