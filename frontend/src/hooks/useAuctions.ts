import { useCallback, useEffect, useMemo, useState } from 'react'
import { auctionContract, type AuctionState } from '../lib/contract'

export type AuctionView = AuctionState & {
  statusLabel: string
  isEnded: boolean
  id: bigint
}

function getStatusLabel(auction: AuctionState) {
  return auction.status.tag
}

export function useAuctions() {
  const [auctions, setAuctions] = useState<AuctionView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const ids = await auctionContract.getAllAuctions()
      const items = await Promise.all(ids.map((id) => auctionContract.getAuction(id)))
      const mapped = items.map((auction) => ({
        ...auction,
        id: auction.auction_id,
        statusLabel: getStatusLabel(auction),
        isEnded: Number(auction.auction_end_time) <= Math.floor(Date.now() / 1000),
      }))
      setAuctions(mapped.sort((a, b) => Number(b.auction_id - a.auction_id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const stats = useMemo(() => {
    const active = auctions.filter((auction) => auction.statusLabel === 'Active').length
    const disputed = auctions.filter((auction) => auction.statusLabel === 'Disputed').length
    const completed = auctions.filter((auction) =>
      ['Completed', 'Resolved'].includes(auction.statusLabel),
    ).length
    const totalLockedPrincipal = auctions
      .filter((auction) => ['Active', 'AwaitingConfirmation', 'Disputed'].includes(auction.statusLabel))
      .reduce((sum, auction) => sum + auction.locked_principal, 0n)
    const totalAccruedYield = auctions.reduce(
      (sum, auction) => sum + auction.accrued_yield,
      0n,
    )

    return {
      total: auctions.length,
      active,
      disputed,
      completed,
      totalLockedPrincipal,
      totalAccruedYield,
    }
  }, [auctions])

  return { auctions, isLoading, error, refresh, stats }
}
