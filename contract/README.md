# No-Loss Auction Protocol

## Deployment

The contract has been deployed on Soroban. Deployed contract ID:

`CDJTNLT3WCAQ4RJOUKOTD7KMXXKUWHSHKMN4HXCCAS67FC4FHYSC67IA`

## Project Overview

The No-Loss Auction Protocol is a Soroban smart contract that combines an auction engine, escrow, dispute handling, and a mock payment token in a single on-chain module. Sellers list products, bidders compete by locking funds, and the current winning bid remains in escrow until the auction is completed or disputed.

The protocol is designed to address a common marketplace problem: in a normal auction, bidder capital sits idle and losing bidders still experience temporary liquidity loss. This MVP explores a "no-loss" model where only the current highest bid remains locked, prior highest bidders are refunded immediately, and the locked capital accrues simulated yield while the auction is active.

Main roles:
- `Admin`: initializes the contract, funds the yield reserve, and resolves disputes.
- `Seller`: creates and can cancel auctions before any bids exist.
- `Bidder`: places bids, becomes the winner if highest at close, then either confirms delivery or raises a dispute.

## How It Works

### Auction creation

The seller creates an auction with product metadata, a starting bid, duration, and an APR value used for simulated yield. The contract stores the auction under a numeric ID and indexes it for global and seller-specific lookup.

### Bidding process

Bidders place successively higher bids using the contract's internal mock token. The contract rejects self-bidding by the seller, low bids, and late bids.

### Automatic refund of the previous highest bidder

When a new highest bid arrives, the contract transfers the new bidder's funds into escrow and immediately returns the previous highest bid to the displaced bidder. This keeps only one bidder's principal locked at a time.

### Yield generation mechanism

Yield is not sourced from an external protocol in this MVP. Instead, the contract computes accrued yield with a simple APR formula:

`locked_principal * apr_bps * elapsed_time`

scaled by basis points and seconds per year. At settlement time, payout depends on an admin-funded reserve, which acts as the source of the simulated yield.

### Auction finalization

Once the auction end time passes, the highest bidder becomes the winner. The auction is exposed as `AwaitingConfirmation` through read paths, and the winner can finalize by confirming delivery. On confirmation, the seller receives the winning principal and the admin receives the accrued yield.

### Delivery confirmation and disputes

If the winner is dissatisfied, they can raise a dispute instead of confirming delivery. The admin then resolves the dispute in one of three ways: release funds to seller, refund buyer, or split the principal between both parties. In all cases, accrued yield is still transferred to the admin.

## Smart Contract Architecture

### Main storage structures

- `AuctionState`: the core record for each auction, including seller, bid state, timing, locked principal, accrued yield, winner, and dispute metadata.
- `AuctionStatus`: tracks lifecycle states: `Active`, `AwaitingConfirmation`, `Completed`, `Disputed`, `Resolved`, `Cancelled`.
- `DataKey`: storage keys for admin config, auction IDs, per-user auction indexes, balances, allowances, and faucet claims.
- Internal token balances and allowances: stored directly in contract storage rather than delegated to a separate token contract.

### Key functions

- `initialize()`: one-time setup for admin and ID counters.
- `claim_test_tokens()`: one-time faucet for local testing.
- `fund_yield_reserve()`: lets admin preload the contract balance used to pay simulated yield.
- `create_auction()`: creates a new auction and saves metadata.
- `place_bid()`: locks the new bid, refunds the previous leader, and updates yield/accounting.
- `cancel_auction()`: seller-only cancellation before any bids.
- `confirm_delivery()`: winner confirms receipt and releases principal to seller.
- `raise_dispute()`: winner escalates the post-auction state.
- `resolve_dispute()`: admin settles disputed auctions with release, refund, or split logic.
- `get_auction()`, `get_all_auctions()`, `get_seller_auctions()`, `get_bidder_auctions()`, `get_won_auctions()`: dashboard/query helpers.
- `get_estimated_yield()` and `view_yield()`: read current simulated yield values.

### Contract flow

1. Admin initializes the contract and can mint test balances through the faucet.
2. Seller creates an auction with product data and APR settings.
3. Bidders place bids; each new leader replaces and refunds the previous one.
4. The active highest bid stays locked and accrues simulated yield over time.
5. After expiry, the highest bidder either confirms delivery or raises a dispute.
6. The contract releases principal according to the outcome and routes accrued yield to admin.

## Engineering Decisions & Tradeoffs

### Single contract instead of multiple contracts

This MVP keeps auction logic, escrow, token accounting, and yield bookkeeping in one contract to reduce deployment overhead and simplify testing. The tradeoff is tighter coupling: responsibilities that would normally be separated are harder to upgrade or audit independently.

### Internal token instead of external USDC

An internal mock token was used to avoid SEP-41 asset integration complexity during early development. This made local testing much faster, but it also means the current system does not represent real asset custody, issuer controls, or production wallet flows.

### Simulated yield instead of Blend or another yield protocol

Yield is simulated with deterministic math rather than live protocol integration. This kept the contract small and predictable, but the result is only an economic placeholder. Real yield generation, risk, liquidity constraints, and protocol-level failure modes are not yet modeled.

### Immediate bidder refunds

Immediate refund of the displaced highest bidder was chosen to preserve the "no-loss" user experience and reduce idle capital. The tradeoff is that the contract only ever earns yield on one locked bid at a time, so protocol yield upside is lower than a pooled-funds design.

## MVP Shortcuts & Quick Fixes

- `claim_test_tokens()` is a faucet that mints `mUSDC` once per address for testing.
- Yield is simulated using APR math instead of external yield-bearing positions.
- The contract includes an internal `Mock USDC` token implementation with balances, approvals, transfers, and burns.
- The admin must manually call `fund_yield_reserve()` so settlement can cover accrued yield.
- Auction status transitions to `AwaitingConfirmation` through snapshot/read logic rather than an automated state transition job.
- Dispute handling is intentionally simple: only the winning bidder can raise a dispute, and the admin resolves it manually with optional split amounts.

## Challenges Faced

- `SEP-41` and Stellar asset integration added friction around token handling, approvals, and test setup, which likely motivated the internal token shortcut.
- Soroban deployment required explicit initialization and state bootstrapping before any auction flow could work.
- Yield integration was the most complex missing piece because a true implementation would need an external protocol such as Blend plus reserve and settlement coordination.
- Testing required repeated wallet funding and deterministic balance setup, which the faucet-based approach solved for local development.

## Future Improvements

- Integrate Blend or another real yield source.
- Replace the admin-funded reserve with real yield vault accounting.
- Add bidder/seller reputation and history scoring.
- Expand dispute resolution beyond admin-only manual judgment.
- Support multiple real tokens instead of a single internal mock asset.
