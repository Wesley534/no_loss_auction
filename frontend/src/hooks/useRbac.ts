import { useMemo } from 'react'
import { useAuctions } from './useAuctions'
import { useWallet } from './useWallet'

export function useRbac() {
  const wallet = useWallet()
  const auctionsState = useAuctions()

  const roles = useMemo(() => {
    const address = wallet.address
    const isAdmin = wallet.isAdmin
    const isSeller = Boolean(address && auctionsState.auctions.some((auction) => auction.seller === address))
    const isBidder = Boolean(
      address &&
        auctionsState.auctions.some(
          (auction) => auction.highest_bidder === address || auction.winner === address,
        ),
    )

    return {
      isAdmin,
      isSeller,
      isBidder,
      hasAnyRole: isAdmin || isSeller || isBidder,
    }
  }, [auctionsState.auctions, wallet.address, wallet.isAdmin])

  return {
    ...auctionsState,
    ...roles,
  }
}
