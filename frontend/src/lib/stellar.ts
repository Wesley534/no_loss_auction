import {
  getAddress,
  getNetworkDetails,
  isConnected,
  isAllowed,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api'
import { rpc } from '@stellar/stellar-sdk'
import { EXPLORER_BASE_URL, NETWORK_PASSPHRASE, RPC_URL } from './constants'

export const rpcServer = new rpc.Server(RPC_URL)

export function hasFreighterExtension() {
  if (typeof window === 'undefined') return false
  return Boolean((window as Window & { freighter?: unknown }).freighter)
}

export async function detectFreighterExtension({
  attempts = 8,
  delayMs = 250,
}: {
  attempts?: number
  delayMs?: number
} = {}) {
  for (let index = 0; index < attempts; index += 1) {
    const windowAvailable = hasFreighterExtension()
    let apiConnected = false
    let apiError: unknown = undefined

    try {
      const connection = await isConnected()
      apiConnected = Boolean(connection.isConnected)
      apiError = connection.error
    } catch (error) {
      apiError = error
    }

    const available = windowAvailable || apiConnected
    console.debug('[wallet][detectFreighterExtension]', {
      attempt: index + 1,
      attempts,
      available,
      windowAvailable,
      apiConnected,
      apiError,
      hasWindow: typeof window !== 'undefined',
      hasFreighterObject:
        typeof window !== 'undefined'
          ? Boolean((window as Window & { freighter?: unknown }).freighter)
          : false,
    })

    if (available) {
      return true
    }

    if (index < attempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }
  }

  return false
}

export async function checkFreighterConnection() {
  return isConnected()
}

export async function checkFreighterAccess() {
  return isAllowed()
}

export async function connectFreighter() {
  return requestAccess()
}

export async function getFreighterAddress() {
  return getAddress()
}

export async function getFreighterNetwork() {
  return getNetworkDetails()
}

export function getFreighterSigner() {
  return signTransaction
}

export function getExplorerTxUrl(hash?: string | null) {
  return hash ? `${EXPLORER_BASE_URL}${hash}` : undefined
}

export function isSupportedNetwork(passphrase?: string) {
  return passphrase === NETWORK_PASSPHRASE
}

export async function fetchLedgerTimestamp() {
  const ledger = await rpcServer.getLatestLedger()
  return ledger.sequence
}
