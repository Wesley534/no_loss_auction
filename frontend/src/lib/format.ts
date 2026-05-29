import { PINATA_GATEWAY_URL, TOKEN_DECIMALS } from './constants'

export function formatAddress(address?: string | null, size = 4) {
  if (!address) return 'Not connected'
  return `${address.slice(0, size + 1)}...${address.slice(-size)}`
}

export function formatToken(amount?: bigint | number | string | null, digits = 2) {
  if (amount === null || amount === undefined) return '0.00 mUSDC'

  const value = typeof amount === 'bigint' ? amount : BigInt(amount)
  const divisor = 10n ** BigInt(TOKEN_DECIMALS)
  const whole = value / divisor
  const fractional = value % divisor
  const padded = fractional.toString().padStart(TOKEN_DECIMALS, '0').slice(0, digits)
  return `${whole.toLocaleString()}.${padded.padEnd(digits, '0')} mUSDC`
}

export function parseToken(input: string) {
  const normalized = input.trim()
  if (!normalized) return 0n

  const [wholePart, fractionalPart = ''] = normalized.split('.')
  const safeWhole = wholePart === '' ? '0' : wholePart
  const safeFraction = fractionalPart
    .replace(/\D/g, '')
    .slice(0, TOKEN_DECIMALS)
    .padEnd(TOKEN_DECIMALS, '0')

  if (!/^\d+$/.test(safeWhole)) {
    throw new Error('Enter a valid token amount')
  }

  return BigInt(safeWhole) * 10n ** BigInt(TOKEN_DECIMALS) + BigInt(safeFraction)
}

export function formatDate(timestamp?: bigint | number | null) {
  if (!timestamp && timestamp !== 0) return 'Unknown'
  const value = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value * 1000))
}

export function formatCountdown(endTime?: bigint | number | null) {
  if (!endTime && endTime !== 0) return 'Unknown'
  const target = typeof endTime === 'bigint' ? Number(endTime) : endTime
  const now = Math.floor(Date.now() / 1000)
  const remaining = target - now

  if (remaining <= 0) return 'Ended'

  const days = Math.floor(remaining / 86_400)
  const hours = Math.floor((remaining % 86_400) / 3_600)
  const minutes = Math.floor((remaining % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

export function formatAPR(aprBps?: number | bigint | null) {
  if (aprBps === null || aprBps === undefined) return '0%'
  const value = typeof aprBps === 'bigint' ? Number(aprBps) : aprBps
  return `${(value / 100).toFixed(2)}% APR`
}

export function formatNumber(value: number | bigint) {
  return value.toLocaleString()
}

export function toNumber(value?: bigint | number | null) {
  if (value === null || value === undefined) return 0
  return typeof value === 'bigint' ? Number(value) : value
}

export function resolveIpfsUrl(uri?: string | null) {
  if (!uri) return ''
  if (uri.startsWith('ipfs://')) {
    return `${PINATA_GATEWAY_URL.replace(/\/$/, '')}/${uri.replace('ipfs://', '')}`
  }
  return uri
}

export function getIpfsUrlCandidates(uri?: string | null) {
  if (!uri) return []

  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '')
    return [
      `${PINATA_GATEWAY_URL.replace(/\/$/, '')}/${hash}`,
      `https://ipfs.io/ipfs/${hash}`,
      `https://cloudflare-ipfs.com/ipfs/${hash}`,
      `https://dweb.link/ipfs/${hash}`,
    ]
  }

  return [uri]
}
