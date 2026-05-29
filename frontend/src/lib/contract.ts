import type { Result } from '@stellar/stellar-sdk/contract'
import { getFreighterSigner } from './stellar'
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from './constants'
import {
  Client,
  type AuctionState,
  type AuctionStatus,
  type DisputeDecision,
} from './generated/src'

type TxResult<T> = {
  value: T
  hash?: string
}

type WalletOptions = {
  publicKey?: string
}

function createClient({ publicKey }: WalletOptions = {}) {
  return new Client({
    contractId: CONTRACT_ID,
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    publicKey,
    signTransaction: getFreighterSigner(),
  })
}

function unwrapResult<T>(result: T | Result<T>) {
  if (
    typeof result === 'object' &&
    result !== null &&
    'isErr' in result &&
    typeof result.isErr === 'function'
  ) {
    const contractResult = result as Result<T>
    return contractResult.unwrap()
  }

  return result as T
}

async function readContract<T>(
  action: (client: Client) => Promise<{ result: T | Result<T> }>,
) {
  const client = createClient()
  const tx = await action(client)
  return unwrapResult(tx.result)
}

async function writeContract<T>(
  publicKey: string,
  action: (client: Client) => Promise<any>,
): Promise<TxResult<T>> {
  const client = createClient({ publicKey })
  const tx = await action(client)
  const sent = await tx.signAndSend()
  const hash =
    sent.sendTransactionResponse?.hash ??
    sent.getTransactionResponse?.txHash ??
    sent.getTransactionResponse?.hash
  return { value: unwrapResult(sent.result), hash }
}

export const auctionContract = {
  initialize: (publicKey: string, admin: string): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) => client.initialize({ admin })),
  name: () => readContract((client) => client.name()),
  symbol: () => readContract((client) => client.symbol()),
  decimals: () => readContract((client) => client.decimals()),
  balance: (address: string) => readContract((client) => client.balance({ id: address })),
  claimTestTokens: (publicKey: string, user: string): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) => client.claim_test_tokens({ user })),
  fundYieldReserve: (
    publicKey: string,
    admin: string,
    amount: bigint,
  ): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) => client.fund_yield_reserve({ admin, amount })),
  createAuction: (
    publicKey: string,
    input: {
      seller: string
      title: string
      description: string
      metadata_uri: string
      product_id: string
      starting_bid: bigint
      duration_seconds: bigint
      apr_bps: number
    },
  ): Promise<TxResult<bigint>> =>
    writeContract(publicKey, (client) => client.create_auction(input)),
  placeBid: (
    publicKey: string,
    auctionId: bigint,
    bidder: string,
    amount: bigint,
  ): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) =>
      client.place_bid({ auction_id: auctionId, bidder, amount }),
    ),
  getAuction: (auctionId: bigint) =>
    readContract<AuctionState>((client) => client.get_auction({ auction_id: auctionId })),
  getAllAuctions: () => readContract<bigint[]>((client) => client.get_all_auctions()),
  getSellerAuctions: (seller: string) =>
    readContract<bigint[]>((client) => client.get_seller_auctions({ seller })),
  getBidderAuctions: (bidder: string) =>
    readContract<bigint[]>((client) => client.get_bidder_auctions({ bidder })),
  getWonAuctions: (bidder: string) =>
    readContract<bigint[]>((client) => client.get_won_auctions({ bidder })),
  getEstimatedYield: (auctionId: bigint) =>
    readContract<bigint>((client) => client.get_estimated_yield({ auction_id: auctionId })),
  getAuctionStatus: (auctionId: bigint) =>
    readContract<AuctionStatus>((client) => client.get_auction_status({ auction_id: auctionId })),
  viewYield: (admin: string) =>
    readContract<bigint>((client) => client.view_yield({ admin })),
  confirmDelivery: (
    publicKey: string,
    auctionId: bigint,
    winner: string,
  ): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) =>
      client.confirm_delivery({ auction_id: auctionId, winner }),
    ),
  raiseDispute: (
    publicKey: string,
    auctionId: bigint,
    winner: string,
    reason: string,
    evidence_uri: string,
  ): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) =>
      client.raise_dispute({ auction_id: auctionId, winner, reason, evidence_uri }),
    ),
  resolveDispute: (
    publicKey: string,
    auctionId: bigint,
    admin: string,
    decision: DisputeDecision,
    seller_amount?: bigint,
    buyer_amount?: bigint,
  ): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) =>
      client.resolve_dispute({
        auction_id: auctionId,
        admin,
        decision,
        seller_amount,
        buyer_amount,
      }),
    ),
  cancelAuction: (publicKey: string, auctionId: bigint): Promise<TxResult<void>> =>
    writeContract(publicKey, (client) => client.cancel_auction({ auction_id: auctionId })),
}

export type { AuctionState, AuctionStatus, DisputeDecision }
