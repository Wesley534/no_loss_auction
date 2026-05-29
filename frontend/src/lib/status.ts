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

  if (status === 'AwaitingConfirmation') {
    if (perspective === 'seller') return 'Awaiting Bidder Confirmation'
    if (perspective === 'admin') return 'Awaiting Bidder Confirmation'
    if (perspective === 'bidder' && isWinner) return 'You Won'
    return 'Awaiting Confirmation'
  }

  if (status === 'Completed') {
    return 'Complete'
  }

  if (status === 'Resolved') {
    return perspective === 'admin' ? 'Dispute Resolved' : 'Resolved'
  }

  if (status === 'Disputed') {
    return perspective === 'admin' ? 'Dispute Open' : 'Disputed'
  }

  return status
}

