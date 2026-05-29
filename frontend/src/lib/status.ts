type AuctionLike = {
  statusLabel?: string
  status?: { tag: string }
  winner?: string | null
  highest_bidder?: string | null
}

type Perspective = 'marketplace' | 'seller' | 'bidder' | 'admin'

function rawStatus(auction: AuctionLike) {
  return auction.statusLabel ?? auction.status?.tag ?? 'Unknown'
}

export function getAuctionStatusText(
  auction: AuctionLike,
  perspective: Perspective = 'marketplace',
  viewerAddress?: string | null,
) {
  const status = rawStatus(auction)
  const winner = auction.winner ?? auction.highest_bidder ?? null
  const isWinner = Boolean(viewerAddress && winner && viewerAddress === winner)

  if (status === 'Active') {
    return 'Open for Bids'
  }

  if (status === 'AwaitingConfirmation') {
    if (perspective === 'seller') return 'Awaiting Buyer Confirmation'
    if (perspective === 'admin') return 'Buyer Confirmation Needed'
    if (perspective === 'bidder' && isWinner) return 'You Won'
    return 'Awaiting Delivery Confirmation'
  }

  if (status === 'Completed') {
    return 'Completed'
  }

  if (status === 'Resolved') {
    return perspective === 'admin' ? 'Issue Resolved' : 'Resolved'
  }

  if (status === 'Disputed') {
    return perspective === 'admin' ? 'Needs Review' : 'Issue Reported'
  }

  if (status === 'Cancelled') {
    return 'Cancelled'
  }

  return status
}
