// @ts-nocheck
import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const ContractError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"AuctionNotFound"},
  4: {message:"AuctionNotActive"},
  5: {message:"AuctionNotDisputed"},
  6: {message:"AuctionAlreadyEnded"},
  7: {message:"Unauthorized"},
  8: {message:"InvalidAmount"},
  9: {message:"InsufficientBalance"},
  10: {message:"InsufficientAllowance"},
  11: {message:"AlreadyClaimed"},
  12: {message:"BidTooLow"},
  13: {message:"SellerCannotBidOwnAuction"},
  14: {message:"CannotCancelWithBids"},
  15: {message:"NoBids"},
  16: {message:"InvalidSplitAmounts"},
  17: {message:"InsufficientEscrowBalance"},
  18: {message:"InsufficientYieldReserve"},
  19: {message:"AlreadyPaidOut"},
  20: {message:"MathOverflow"},
  21: {message:"InvalidLedgerTime"},
  22: {message:"AuctionNotYetEnded"},
  23: {message:"InvalidInput"}
}






export type DataKey = {tag: "Admin", values: void} | {tag: "NextAuctionId", values: void} | {tag: "AllAuctions", values: void} | {tag: "Auction", values: readonly [u64]} | {tag: "SellerAuctions", values: readonly [string]} | {tag: "BidderAuctions", values: readonly [string]} | {tag: "WonAuctions", values: readonly [string]} | {tag: "Balance", values: readonly [string]} | {tag: "Allowance", values: readonly [string, string]} | {tag: "Claimed", values: readonly [string]};


export interface AuctionState {
  accrued_yield: i128;
  admin: string;
  apr_bps: u32;
  auction_end_time: u64;
  auction_id: u64;
  auction_start_time: u64;
  description: string;
  dispute_evidence_uri: Option<string>;
  dispute_reason: Option<string>;
  highest_bid: i128;
  highest_bidder: Option<string>;
  last_yield_update: u64;
  locked_principal: i128;
  metadata_uri: string;
  product_id: string;
  seller: string;
  starting_bid: i128;
  status: AuctionStatus;
  title: string;
  winner: Option<string>;
}

export type AuctionStatus = {tag: "Active", values: void} | {tag: "AwaitingConfirmation", values: void} | {tag: "Completed", values: void} | {tag: "Disputed", values: void} | {tag: "Resolved", values: void} | {tag: "Cancelled", values: void};

export type DisputeDecision = {tag: "ReleaseToSeller", values: void} | {tag: "RefundBuyer", values: void} | {tag: "Split", values: void};

export interface Client {
  /**
   * Construct and simulate a burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn: ({from, amount}: {from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve: ({from, spender, amount, live_until_ledger}: {from: string, spender: string, amount: i128, live_until_ledger: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: ({id}: {id: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({from, to, amount}: {from: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allowance: ({from, spender}: {from: string, spender: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a burn_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn_from: ({spender, from, amount}: {spender: string, from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a place_bid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  place_bid: ({auction_id, bidder, amount}: {auction_id: u64, bidder: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a view_yield transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  view_yield: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_auction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_auction: ({auction_id}: {auction_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<AuctionState>>>

  /**
   * Construct and simulate a raise_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  raise_dispute: ({auction_id, winner, reason, evidence_uri}: {auction_id: u64, winner: string, reason: string, evidence_uri: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_from: ({spender, from, to, amount}: {spender: string, from: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_auction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel_auction: ({auction_id}: {auction_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_auction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_auction: ({seller, title, description, metadata_uri, product_id, starting_bid, duration_seconds, apr_bps}: {seller: string, title: string, description: string, metadata_uri: string, product_id: string, starting_bid: i128, duration_seconds: u64, apr_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a resolve_dispute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_dispute: ({auction_id, admin, decision, seller_amount, buyer_amount}: {auction_id: u64, admin: string, decision: DisputeDecision, seller_amount: Option<i128>, buyer_amount: Option<i128>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a confirm_delivery transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  confirm_delivery: ({auction_id, winner}: {auction_id: u64, winner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_all_auctions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_all_auctions: (options?: MethodOptions) => Promise<AssembledTransaction<Result<Array<u64>>>>

  /**
   * Construct and simulate a get_won_auctions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_won_auctions: ({bidder}: {bidder: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Array<u64>>>>

  /**
   * Construct and simulate a claim_test_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim_test_tokens: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a fund_yield_reserve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_yield_reserve: ({admin, amount}: {admin: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_auction_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_auction_status: ({auction_id}: {auction_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<AuctionStatus>>>

  /**
   * Construct and simulate a get_bidder_auctions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bidder_auctions: ({bidder}: {bidder: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Array<u64>>>>

  /**
   * Construct and simulate a get_estimated_yield transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_estimated_yield: ({auction_id}: {auction_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_seller_auctions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_seller_auctions: ({seller}: {seller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Array<u64>>>>

}
export class Client extends ContractClient {
  readonly options: ContractClientOptions
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAEYnVybgAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
        "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAAEAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWxpdmVfdW50aWxfbGVkZ2VyAAAAAAAABAAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAJpZAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAJYnVybl9mcm9tAAAAAAAAAwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAJcGxhY2VfYmlkAAAAAAAAAwAAAAAAAAAKYXVjdGlvbl9pZAAAAAAABgAAAAAAAAAGYmlkZGVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAKdmlld195aWVsZAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAALAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAALZ2V0X2F1Y3Rpb24AAAAAAQAAAAAAAAAKYXVjdGlvbl9pZAAAAAAABgAAAAEAAAPpAAAH0AAAAAxBdWN0aW9uU3RhdGUAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAANcmFpc2VfZGlzcHV0ZQAAAAAAAAQAAAAAAAAACmF1Y3Rpb25faWQAAAAAAAYAAAAAAAAABndpbm5lcgAAAAAAEwAAAAAAAAAGcmVhc29uAAAAAAAQAAAAAAAAAAxldmlkZW5jZV91cmkAAAAQAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAOY2FuY2VsX2F1Y3Rpb24AAAAAAAEAAAAAAAAACmF1Y3Rpb25faWQAAAAAAAYAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAOY3JlYXRlX2F1Y3Rpb24AAAAAAAgAAAAAAAAABnNlbGxlcgAAAAAAEwAAAAAAAAAFdGl0bGUAAAAAAAAQAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAAQAAAAAAAAAAxtZXRhZGF0YV91cmkAAAAQAAAAAAAAAApwcm9kdWN0X2lkAAAAAAAQAAAAAAAAAAxzdGFydGluZ19iaWQAAAALAAAAAAAAABBkdXJhdGlvbl9zZWNvbmRzAAAABgAAAAAAAAAHYXByX2JwcwAAAAAEAAAAAQAAA+kAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAPcmVzb2x2ZV9kaXNwdXRlAAAAAAUAAAAAAAAACmF1Y3Rpb25faWQAAAAAAAYAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIZGVjaXNpb24AAAfQAAAAD0Rpc3B1dGVEZWNpc2lvbgAAAAAAAAAADXNlbGxlcl9hbW91bnQAAAAAAAPoAAAACwAAAAAAAAAMYnV5ZXJfYW1vdW50AAAD6AAAAAsAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAQY29uZmlybV9kZWxpdmVyeQAAAAIAAAAAAAAACmF1Y3Rpb25faWQAAAAAAAYAAAAAAAAABndpbm5lcgAAAAAAEwAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAQZ2V0X2FsbF9hdWN0aW9ucwAAAAAAAAABAAAD6QAAA+oAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAAQZ2V0X3dvbl9hdWN0aW9ucwAAAAEAAAAAAAAABmJpZGRlcgAAAAAAEwAAAAEAAAPpAAAD6gAAAAYAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAARY2xhaW1fdGVzdF90b2tlbnMAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAASZnVuZF95aWVsZF9yZXNlcnZlAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAASZ2V0X2F1Y3Rpb25fc3RhdHVzAAAAAAABAAAAAAAAAAphdWN0aW9uX2lkAAAAAAAGAAAAAQAAA+kAAAfQAAAADUF1Y3Rpb25TdGF0dXMAAAAAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAAAAAAATZ2V0X2JpZGRlcl9hdWN0aW9ucwAAAAABAAAAAAAAAAZiaWRkZXIAAAAAABMAAAABAAAD6QAAA+oAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAATZ2V0X2VzdGltYXRlZF95aWVsZAAAAAABAAAAAAAAAAphdWN0aW9uX2lkAAAAAAAGAAAAAQAAA+kAAAALAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAAAAAAATZ2V0X3NlbGxlcl9hdWN0aW9ucwAAAAABAAAAAAAAAAZzZWxsZXIAAAAAABMAAAABAAAD6QAAA+oAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAXAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAA9BdWN0aW9uTm90Rm91bmQAAAAAAwAAAAAAAAAQQXVjdGlvbk5vdEFjdGl2ZQAAAAQAAAAAAAAAEkF1Y3Rpb25Ob3REaXNwdXRlZAAAAAAABQAAAAAAAAATQXVjdGlvbkFscmVhZHlFbmRlZAAAAAAGAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAHAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAACAAAAAAAAAATSW5zdWZmaWNpZW50QmFsYW5jZQAAAAAJAAAAAAAAABVJbnN1ZmZpY2llbnRBbGxvd2FuY2UAAAAAAAAKAAAAAAAAAA5BbHJlYWR5Q2xhaW1lZAAAAAAACwAAAAAAAAAJQmlkVG9vTG93AAAAAAAADAAAAAAAAAAZU2VsbGVyQ2Fubm90QmlkT3duQXVjdGlvbgAAAAAAAA0AAAAAAAAAFENhbm5vdENhbmNlbFdpdGhCaWRzAAAADgAAAAAAAAAGTm9CaWRzAAAAAAAPAAAAAAAAABNJbnZhbGlkU3BsaXRBbW91bnRzAAAAABAAAAAAAAAAGUluc3VmZmljaWVudEVzY3Jvd0JhbGFuY2UAAAAAAAARAAAAAAAAABhJbnN1ZmZpY2llbnRZaWVsZFJlc2VydmUAAAASAAAAAAAAAA5BbHJlYWR5UGFpZE91dAAAAAAAEwAAAAAAAAAMTWF0aE92ZXJmbG93AAAAFAAAAAAAAAARSW52YWxpZExlZGdlclRpbWUAAAAAAAAVAAAAAAAAABJBdWN0aW9uTm90WWV0RW5kZWQAAAAAABYAAAAAAAAADEludmFsaWRJbnB1dAAAABc=",
        "AAAABQAAAAAAAAAAAAAADkJpZFBsYWNlZEV2ZW50AAAAAAABAAAAEGJpZF9wbGFjZWRfZXZlbnQAAAADAAAAAAAAAAphdWN0aW9uX2lkAAAAAAAGAAAAAQAAAAAAAAAGYmlkZGVyAAAAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAEkRpc3B1dGVSYWlzZWRFdmVudAAAAAAAAQAAABRkaXNwdXRlX3JhaXNlZF9ldmVudAAAAAQAAAAAAAAACmF1Y3Rpb25faWQAAAAAAAYAAAABAAAAAAAAAAZiaWRkZXIAAAAAABMAAAABAAAAAAAAAAZyZWFzb24AAAAAABAAAAAAAAAAAAAAAAxldmlkZW5jZV91cmkAAAAQAAAAAAAAAAI=",
        "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" ]),
      options
    )
    this.options = options
  }
  public readonly fromJSON = {
    burn: this.txFromJSON<Result<void>>,
        name: this.txFromJSON<string>,
        symbol: this.txFromJSON<string>,
        approve: this.txFromJSON<Result<void>>,
        balance: this.txFromJSON<i128>,
        decimals: this.txFromJSON<u32>,
        transfer: this.txFromJSON<Result<void>>,
        allowance: this.txFromJSON<i128>,
        burn_from: this.txFromJSON<Result<void>>,
        place_bid: this.txFromJSON<Result<void>>,
        initialize: this.txFromJSON<Result<void>>,
        view_yield: this.txFromJSON<Result<i128>>,
        get_auction: this.txFromJSON<Result<AuctionState>>,
        raise_dispute: this.txFromJSON<Result<void>>,
        transfer_from: this.txFromJSON<Result<void>>,
        cancel_auction: this.txFromJSON<Result<void>>,
        create_auction: this.txFromJSON<Result<u64>>,
        resolve_dispute: this.txFromJSON<Result<void>>,
        confirm_delivery: this.txFromJSON<Result<void>>,
        get_all_auctions: this.txFromJSON<Result<Array<u64>>>,
        get_won_auctions: this.txFromJSON<Result<Array<u64>>>,
        claim_test_tokens: this.txFromJSON<Result<void>>,
        fund_yield_reserve: this.txFromJSON<Result<void>>,
        get_auction_status: this.txFromJSON<Result<AuctionStatus>>,
        get_bidder_auctions: this.txFromJSON<Result<Array<u64>>>,
        get_estimated_yield: this.txFromJSON<Result<i128>>,
        get_seller_auctions: this.txFromJSON<Result<Array<u64>>>
  }
}
