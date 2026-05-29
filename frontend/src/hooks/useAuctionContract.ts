import { auctionContract } from '../lib/contract'
import { useWallet } from './useWallet'

export function useAuctionContract() {
  const wallet = useWallet()

  return {
    contract: auctionContract,
    address: wallet.address,
    canTransact: wallet.isConnected && wallet.isCorrectNetwork && Boolean(wallet.address),
  }
}
