import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  ADMIN_ADDRESS,
  WALLET_SESSION_KEY,
} from '../lib/constants'
import { getErrorMessage } from '../lib/errors'
import {
  checkFreighterAccess,
  checkFreighterConnection,
  connectFreighter,
  detectFreighterExtension,
  getFreighterAddress,
  getFreighterNetwork,
  hasFreighterExtension,
  isSupportedNetwork,
} from '../lib/stellar'

type WalletContextValue = {
  address: string | null
  isConnected: boolean
  isAdmin: boolean
  isFreighterInstalled: boolean | null
  isCorrectNetwork: boolean
  networkLabel: string
  isConnecting: boolean
  hasSession: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  refresh: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: PropsWithChildren) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isFreighterInstalled, setIsFreighterInstalled] = useState<boolean | null>(() =>
    typeof window === 'undefined' ? hasFreighterExtension() : null,
  )
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true)
  const [networkLabel, setNetworkLabel] = useState('Stellar Testnet')
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasSession, setHasSession] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(WALLET_SESSION_KEY) === 'connected'
  })
  const [error, setError] = useState<string | null>(null)

  const persistSession = (active: boolean) => {
    if (typeof window === 'undefined') return
    if (active) {
      window.localStorage.setItem(WALLET_SESSION_KEY, 'connected')
    } else {
      window.localStorage.removeItem(WALLET_SESSION_KEY)
    }
  }

  const refresh = async (restoreSession = hasSession) => {
    console.debug('[wallet][refresh:start]', {
      restoreSession,
      hasSession,
      initialInstalledState: isFreighterInstalled,
    })
    const installed = await detectFreighterExtension()
    console.debug('[wallet][refresh:detected]', { installed })
    setIsFreighterInstalled(installed)

    if (!installed) {
      console.debug('[wallet][refresh:not-installed]')
      setNetworkLabel('Freighter not installed')
      setIsCorrectNetwork(true)
      if (!restoreSession) {
        setError(null)
      }
      setAddress(null)
      setIsConnected(false)
      return
    }

    const connection = await checkFreighterConnection()
    console.debug('[wallet][refresh:connection]', connection)
    setIsFreighterInstalled(true)

    const network = await getFreighterNetwork()
    console.debug('[wallet][refresh:network]', network)
    if (network.error) {
      setError(getErrorMessage(network.error.message))
      return
    }

    setNetworkLabel(network.network || 'Stellar Testnet')
    setIsCorrectNetwork(isSupportedNetwork(network.networkPassphrase))
    if (!isSupportedNetwork(network.networkPassphrase)) {
      setError('Freighter is connected to the wrong network. Switch it to Stellar Testnet.')
    }

    if (!restoreSession) {
      if (isSupportedNetwork(network.networkPassphrase)) {
        setError(null)
      }
      setAddress(null)
      setIsConnected(false)
      return
    }

    const access = await checkFreighterAccess()
    console.debug('[wallet][refresh:access]', access)
    if (access.error) {
      setError(getErrorMessage(access.error.message))
      return
    }

    if (!access.isAllowed) {
      setError(null)
      setAddress(null)
      setIsConnected(false)
      return
    }

    const walletAddress = await getFreighterAddress()
    console.debug('[wallet][refresh:address]', walletAddress)
    if (walletAddress.error) {
      setError(getErrorMessage(walletAddress.error.message))
      setAddress(null)
      setIsConnected(false)
      return
    }

    setAddress(walletAddress.address || null)
    setIsConnected(Boolean(walletAddress.address))
    if (isSupportedNetwork(network.networkPassphrase)) {
      setError(null)
    }
  }

  useEffect(() => {
    void refresh(hasSession)
  }, [])

  useEffect(() => {
    if (!hasSession) {
      setAddress(null)
      setIsConnected(false)
    }
  }, [hasSession])

  const connect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      console.debug('[wallet][connect:start]')
      const installed = await detectFreighterExtension()
      console.debug('[wallet][connect:detected]', { installed })
      setIsFreighterInstalled(installed)

      if (!installed) {
        throw new Error(
          'Freighter is not installed. Install Freighter, create or import a wallet, switch to Stellar Testnet, and fund it with Friendbot.',
        )
      }

      const connection = await checkFreighterConnection()
      console.debug('[wallet][connect:connection]', connection)
      if (connection.error || !connection.isConnected) {
        throw new Error(
          'Freighter is not available. Install Freighter, unlock it, and try again.',
        )
      }

      const response = await connectFreighter()
      console.debug('[wallet][connect:response]', response)
      if (response.error) {
        throw new Error(response.error.message)
      }

      if (!response.address) {
        throw new Error('Freighter did not return a wallet address. Unlock the wallet and try again.')
      }

      persistSession(true)
      setHasSession(true)
      setAddress(response.address)
      setIsConnected(true)
      await refresh(true)
    } catch (err) {
      persistSession(false)
      setHasSession(false)
      setAddress(null)
      setIsConnected(false)
      setError(getErrorMessage(err))
      throw err
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    persistSession(false)
    setHasSession(false)
    setAddress(null)
    setIsConnected(false)
    setError(null)
  }

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected,
      isAdmin: Boolean(address && ADMIN_ADDRESS && address === ADMIN_ADDRESS),
      isFreighterInstalled,
      isCorrectNetwork,
      networkLabel,
      isConnecting,
      hasSession,
      error,
      connect,
      disconnect,
      refresh: () => refresh(true),
    }),
    [
      address,
      error,
      hasSession,
      isConnected,
      isConnecting,
      isCorrectNetwork,
      isFreighterInstalled,
      networkLabel,
    ],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used inside WalletProvider')
  }

  return context
}
