import type { AuctionView } from '../../hooks/useAuctions'
import { EmptyState } from '../shared/EmptyState'
import { AuctionCard } from './AuctionCard'

export function AuctionGrid({
  auctions,
  emptyTitle,
  emptyDescription,
}: {
  auctions: AuctionView[]
  emptyTitle: string
  emptyDescription: string
}) {
  if (auctions.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {auctions.map((auction) => (
        <AuctionCard auction={auction} key={auction.auction_id.toString()} />
      ))}
    </div>
  )
}
