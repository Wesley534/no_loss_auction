export const CONTRACT_ID = import.meta.env.VITE_AUCTION_CONTRACT_ID as string
export const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL as string
export const NETWORK = import.meta.env.VITE_STELLAR_NETWORK as string
export const NETWORK_PASSPHRASE = import.meta.env
  .VITE_STELLAR_NETWORK_PASSPHRASE as string
export const EXPLORER_BASE_URL = import.meta.env
  .VITE_STELLAR_EXPLORER_BASE_URL as string
export const ADMIN_ADDRESS = (import.meta.env.VITE_AUCTION_ADMIN_ADDRESS as string) || ''
export const FREIGHTER_INSTALL_URL = 'https://www.freighter.app/'
export const STELLAR_FRIENDBOT_URL = 'https://laboratory.stellar.org/#account-creator?network=test'
export const PINATA_API_KEY = (import.meta.env.VITE_PINATA_API_KEY as string) || ''
export const PINATA_API_SECRET = (import.meta.env.VITE_PINATA_API_SECRET as string) || ''
export const PINATA_JWT = (import.meta.env.VITE_PINATA_JWT as string) || ''
export const PINATA_GATEWAY_URL =
  (import.meta.env.VITE_PINATA_GATEWAY_URL as string) || 'https://gateway.pinata.cloud/ipfs'
export const AUCTION_FALLBACK_IMAGE_URL =
  'https://images.pexels.com/photos/34301922/pexels-photo-34301922.jpeg'

export const TOKEN_NAME = 'Mock USDC'
export const TOKEN_SYMBOL = 'mUSDC'
export const TOKEN_DECIMALS = 7
export const DEFAULT_APR_BPS = Number(import.meta.env.VITE_AUCTION_APR_BPS || 1_200)
export const CLAIM_AMOUNT = 10_000_000_000n
export const WALLET_SESSION_KEY = 'nly-wallet-session'

export const NAV_ITEMS = [
  { label: 'Marketplace', href: '/' },
  { label: 'Auctions', href: '/auctions' },
  { label: 'Activity', href: '/activity' },
  { label: 'Dashboard', href: '/dashboard' },
] as const

export const DISPUTE_DECISIONS = [
  { label: 'Release To Seller', value: 'ReleaseToSeller' },
  { label: 'Refund Buyer', value: 'RefundBuyer' },
  { label: 'Split', value: 'Split' },
] as const

export const AUCTION_STATUS_ORDER = [
  'Active',
  'AwaitingConfirmation',
  'Disputed',
  'Completed',
  'Resolved',
  'Cancelled',
] as const
