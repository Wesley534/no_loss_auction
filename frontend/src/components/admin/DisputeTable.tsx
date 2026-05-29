import type { AuctionView } from '../../hooks/useAuctions'
import { formatAddress, formatToken } from '../../lib/format'
import { getAuctionStatusText } from '../../lib/status'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'
import { StatusBadge } from '../auction/StatusBadge'

export function DisputeTable({
  disputes,
  onResolve,
}: {
  disputes: AuctionView[]
  onResolve: (auction: AuctionView) => void
}) {
  return (
    <Card className="overflow-hidden p-0" tone="danger">
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">Resolution Center</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Review buyer issues and decide whether to pay the seller, refund the buyer, or split the payment.
          </p>
        </div>
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/4 text-[11px] uppercase tracking-[0.24em] text-[var(--text-faint)]">
            <tr>
              <th className="px-6 py-4">Auction</th>
              <th className="px-6 py-4">Seller / Buyer</th>
              <th className="px-6 py-4">Protected payment</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((auction) => (
              <tr className="border-t border-white/6" key={auction.auction_id.toString()}>
                <td className="px-6 py-5">
                  <div className="font-semibold text-white">{auction.title}</div>
                  <div className="mono text-xs text-[var(--text-faint)]">
                    #{auction.auction_id.toString()}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-white">{formatAddress(auction.seller)}</div>
                  <div className="text-xs text-[var(--text-faint)]">
                    Buyer: {formatAddress(auction.winner ?? undefined)}
                  </div>
                </td>
                <td className="px-6 py-5 text-white">{formatToken(auction.highest_bid)}</td>
                <td className="px-6 py-5">
                  <StatusBadge
                    label={getAuctionStatusText(auction, 'admin')}
                    status={auction.statusLabel}
                  />
                </td>
                <td className="px-6 py-5 text-right">
                  <Button onClick={() => onResolve(auction)}>Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
