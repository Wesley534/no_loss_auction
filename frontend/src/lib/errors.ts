const CONTRACT_ERROR_MAP: Record<string, string> = {
  AlreadyInitialized: 'This contract has already been initialized.',
  AlreadyClaimed: 'You have already simulated the maximum fiat deposit of 1,000 mUSDC.',
  InsufficientBalance: 'You do not have enough mUSDC.',
  AuctionNotDisputed: 'This auction is not currently in dispute.',
  BidTooLow: 'Your bid must be higher than the current highest bid.',
  SellerCannotBidOwnAuction: 'You cannot bid on your own auction.',
  AuctionNotActive: 'This auction is not active.',
  AuctionNotYetEnded: 'This auction has not ended yet.',
  Unauthorized: 'You are not authorized to perform this action.',
  InsufficientEscrowBalance: 'The auction escrow balance is too low to complete this payout.',
  InsufficientYieldReserve: 'The protocol yield reserve is too low.',
  InvalidSplitAmounts: 'Split amounts must equal the winning bid.',
  AlreadyPaidOut: 'This auction has already been paid out.',
  AuctionAlreadyEnded: 'This auction has already ended.',
  CannotCancelWithBids: 'You cannot cancel an auction after bids have been placed.',
  NoBids: 'This auction has no bids yet.',
  InvalidAmount: 'Please enter a valid positive amount.',
  InvalidInput: 'Some of the information provided is invalid. Review the form and try again.',
  InvalidLedgerTime: 'The ledger timestamp is invalid. Please retry in a moment.',
  MathOverflow: 'This operation exceeded the contract math limits. Try a smaller value.',
  NotInitialized: 'The contract is not initialized on this network.',
  AuctionNotFound: 'This auction could not be found.',
  InsufficientAllowance: 'The approved allowance is too low for this action.',
}

const CONTRACT_ERROR_CODE_MAP: Record<number, string> = {
  1: CONTRACT_ERROR_MAP.AlreadyInitialized,
  2: CONTRACT_ERROR_MAP.NotInitialized,
  3: CONTRACT_ERROR_MAP.AuctionNotFound,
  4: CONTRACT_ERROR_MAP.AuctionNotActive,
  5: CONTRACT_ERROR_MAP.AuctionNotDisputed,
  6: CONTRACT_ERROR_MAP.AuctionAlreadyEnded,
  7: CONTRACT_ERROR_MAP.Unauthorized,
  8: CONTRACT_ERROR_MAP.InvalidAmount,
  9: CONTRACT_ERROR_MAP.InsufficientBalance,
  10: CONTRACT_ERROR_MAP.InsufficientAllowance,
  11: CONTRACT_ERROR_MAP.AlreadyClaimed,
  12: CONTRACT_ERROR_MAP.BidTooLow,
  13: CONTRACT_ERROR_MAP.SellerCannotBidOwnAuction,
  14: CONTRACT_ERROR_MAP.CannotCancelWithBids,
  15: CONTRACT_ERROR_MAP.NoBids,
  16: CONTRACT_ERROR_MAP.InvalidSplitAmounts,
  17: CONTRACT_ERROR_MAP.InsufficientEscrowBalance,
  18: CONTRACT_ERROR_MAP.InsufficientYieldReserve,
  19: CONTRACT_ERROR_MAP.AlreadyPaidOut,
  20: CONTRACT_ERROR_MAP.MathOverflow,
  21: CONTRACT_ERROR_MAP.InvalidLedgerTime,
  22: CONTRACT_ERROR_MAP.AuctionNotYetEnded,
  23: CONTRACT_ERROR_MAP.InvalidInput,
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  if (error instanceof Error) return error.message

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    const direct =
      record.message ??
      record.error ??
      record.details ??
      record.reason ??
      (record.response &&
      typeof record.response === 'object' &&
      record.response !== null
        ? (record.response as Record<string, unknown>).message
        : undefined)

    if (typeof direct === 'string') return direct
  }

  return ''
}

function normalizeErrorMessage(message: string) {
  for (const [key, value] of Object.entries(CONTRACT_ERROR_MAP)) {
    if (message.includes(key)) return value
  }

  const codeMatch = message.match(/(?:Contract(?:Error)?|Error\(Contract,\s*#?)(?:\s|:|,|#|\()*(\d{1,3})/i)
  if (codeMatch) {
    const code = Number(codeMatch[1])
    if (CONTRACT_ERROR_CODE_MAP[code]) {
      return CONTRACT_ERROR_CODE_MAP[code]
    }
  }

  const hashCodeMatch = message.match(/#(\d{1,3})/)
  if (hashCodeMatch) {
    const code = Number(hashCodeMatch[1])
    if (CONTRACT_ERROR_CODE_MAP[code]) {
      return CONTRACT_ERROR_CODE_MAP[code]
    }
  }

  if (
    message.includes('User declined') ||
    message.includes('UserRejected') ||
    message.includes('rejected by the user')
  ) {
    return 'The transaction was rejected in Freighter.'
  }

  if (
    message.includes('Freighter is not installed') ||
    message.includes('extension not found') ||
    message.includes('window.freighter')
  ) {
    return 'Freighter is not installed. Install the extension and reload the app.'
  }

  if (message.includes('did not return a wallet address')) {
    return 'Freighter is locked or unavailable. Unlock the wallet and try again.'
  }

  if (message.includes('wrong network') || message.includes('network passphrase')) {
    return 'Freighter is connected to the wrong network. Switch to Stellar Testnet and try again.'
  }

  if (message.includes('Pinata credentials are missing')) {
    return 'Image upload is not configured. Add your Pinata environment variables and restart the app.'
  }

  if (message.includes('Pinata upload failed')) {
    return 'Image upload to IPFS failed. Please try again in a moment.'
  }

  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Load failed')
  ) {
    return 'A network request failed. Check your connection and try again.'
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The request took too long. Please retry.'
  }

  if (message.includes('Freighter')) {
    return message
  }

  return message || 'Something went wrong while talking to Stellar.'
}

export function getErrorMessage(error: unknown) {
  return normalizeErrorMessage(extractErrorMessage(error))
}
