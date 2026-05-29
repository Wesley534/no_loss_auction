import { LogOut, Rocket, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useToken } from '../../hooks/useToken'
import { useWallet } from '../../hooks/useWallet'
import { FREIGHTER_INSTALL_URL, NAV_ITEMS } from '../../lib/constants'
import { detectFreighterExtension } from '../../lib/stellar'
import { formatAddress, formatToken } from '../../lib/format'

export function Navbar() {
  const location = useLocation()
  const wallet = useWallet()
  const token = useToken()

  useEffect(() => {
    console.debug('[wallet][navbar:state]', {
      isFreighterInstalled: wallet.isFreighterInstalled,
      isConnected: wallet.isConnected,
      isConnecting: wallet.isConnecting,
      networkLabel: wallet.networkLabel,
      isCorrectNetwork: wallet.isCorrectNetwork,
      address: wallet.address,
      error: wallet.error,
    })
  }, [
    wallet.address,
    wallet.error,
    wallet.isConnected,
    wallet.isConnecting,
    wallet.isCorrectNetwork,
    wallet.isFreighterInstalled,
    wallet.networkLabel,
  ])

  const installWallet = () => {
    if (typeof window !== 'undefined') {
      window.open(FREIGHTER_INSTALL_URL, '_blank', 'noopener,noreferrer')
    }
  }
  const handleWalletAction = async () => {
    const installed = await detectFreighterExtension()
    console.debug('[wallet][navbar:action]', {
      installed,
      currentInstalledState: wallet.isFreighterInstalled,
    })
    if (installed) {
      await wallet.connect()
      return
    }

    installWallet()
  }

  return (
    <header className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-[rgba(66,71,84,0.1)] bg-[rgba(11,19,38,0.8)] px-4 shadow-sm backdrop-blur-xl md:px-12">
      <div className="flex items-center gap-6 lg:gap-10">
        <Link className="font-bold text-[var(--primary)] md:text-2xl" to="/">
          Harbor Auctions
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.href
            return (
              <Link
                className={
                  active
                    ? 'border-b-2 border-[var(--primary)] pb-1 font-bold text-[var(--primary)]'
                    : 'font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--primary)]'
                }
                key={item.href}
                to={item.href}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link
          className="mr-2 hidden items-center gap-2 rounded-xl border border-[rgba(78,222,163,0.2)] bg-[rgba(78,222,163,0.1)] px-4 py-2 text-xs font-bold text-[var(--secondary)] transition-all hover:bg-[rgba(78,222,163,0.2)] sm:flex"
          to="/create"
        >
          <Rocket className="h-4 w-4" />
          Sell an Item
        </Link>
        <div className="hidden rounded-lg border border-[rgba(66,71,84,0.2)] bg-[var(--surface-container-high)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] sm:block">
          {wallet.isConnected ? formatToken(token.balance) : '0.00 mUSDC'}
        </div>
        {wallet.isConnected ? (
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-[var(--on-primary)] transition-all active:scale-95"
              onClick={() => void wallet.refresh()}
              type="button"
            >
              {formatAddress(wallet.address)}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-[rgba(66,71,84,0.2)] bg-[var(--surface-container-high)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] transition-colors hover:text-white"
              onClick={wallet.disconnect}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Disconnect</span>
            </button>
          </div>
        ) : (
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-[var(--on-primary)] transition-transform active:scale-95"
            onClick={() => void handleWalletAction()}
            type="button"
          >
            <Wallet className="h-4 w-4" />
            {wallet.isConnecting
              ? 'Connecting...'
              : wallet.isFreighterInstalled === null
                ? 'Checking Wallet...'
                : wallet.isFreighterInstalled
                ? 'Connect Wallet'
                : 'Install Wallet'}
          </button>
        )}
      </div>
    </header>
  )
}
