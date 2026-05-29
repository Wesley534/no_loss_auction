import { useEffect, useState } from 'react'
import { auctionContract } from '../lib/contract'
import { TOKEN_DECIMALS, TOKEN_NAME, TOKEN_SYMBOL } from '../lib/constants'
import { useWallet } from './useWallet'

export function useToken() {
  const { address } = useWallet()
  const [balance, setBalance] = useState<bigint>(0n)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = async () => {
    if (!address) {
      setBalance(0n)
      return
    }

    setIsLoading(true)
    try {
      const nextBalance = await auctionContract.balance(address)
      setBalance(nextBalance)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [address])

  return {
    balance,
    isLoading,
    refresh,
    token: {
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      decimals: TOKEN_DECIMALS,
    },
  }
}
