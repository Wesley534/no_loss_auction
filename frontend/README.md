# No-Loss Auction Protocol Frontend

## 1. Frontend Overview

The frontend is the user-facing application for the No-Loss Auction Protocol. It translates Soroban contract actions into a marketplace experience where users can browse auctions, create listings, place bids, track protected payments, and resolve post-sale issues without needing to understand low-level contract calls.

Target users:
- `Admin`: monitors marketplace health, funds the reserve, and resolves disputes.
- `Seller`: creates auctions, tracks listings, and monitors payments awaiting buyer confirmation.
- `Bidder`: connects a wallet, claims test funds, browses listings, places bids, and confirms delivery or raises disputes.

Main technologies:
- `React 19` for the UI layer.
- `TypeScript` for typed contract and component integration.
- `Vite` for fast local development and production builds.
- `Tailwind CSS v4` for styling and reusable visual primitives.
- `React Router` for page routing.
- `React Hook Form` and `Zod` for form state and validation.
- `Freighter Wallet` for wallet-based authentication and transaction signing.
- `@stellar/stellar-sdk` and generated Soroban client bindings for contract reads/writes.
- `Sonner` for transaction and error toasts.
- `Pinata` for image uploads used in listings and dispute evidence.

## 2. User Experience & Design Philosophy

The UI is intentionally marketplace-first, not protocol-first. Instead of exposing raw contract terminology, the app presents familiar actions such as "Sell an Item", "Add Test Funds", "Confirm Delivery", and "Review Buying Activity". Escrow, reserve funding, and yield are framed as protected payments and marketplace operations rather than blockchain internals.

Complex blockchain concepts are simplified in a few ways:
- Wallet connection replaces account creation and passwords.
- Transaction state is reduced to clear pending/success/error toasts.
- Contract statuses are translated into role-specific labels such as "You Won", "Awaiting Buyer Confirmation", and "Needs Review".
- Testnet setup guidance is surfaced directly in the UI when Freighter is missing or on the wrong network.

The user journey is straightforward: connect Freighter, switch to Stellar Testnet, optionally claim test tokens, browse auctions, open a listing detail page, then either create a sale or participate in bidding. After the auction ends, the winning buyer can confirm delivery or report an issue, while sellers and admins continue from their dashboards.

## 3. Application Structure

### Main pages

- `/`: marketplace home with wallet guidance, test token access, stats, and live/completed auctions.
- `/create`: seller flow for creating a new auction.
- `/auction/:auctionId`: auction detail page with bidding, confirmation, cancellation, and dispute actions.
- `/auctions`: seller dashboard for listing management and status tracking.
- `/activity`: bidder dashboard for bids, wins, refunds, and next actions.
- `/dashboard`: account overview; automatically becomes the admin dashboard for the configured admin wallet.

### Routing structure

Routing is handled with `react-router-dom` inside a shared `AppLayout`. The layout keeps navigation consistent across pages and includes a mobile bottom nav for smaller screens.

### Reusable components

The app is built around reusable UI and domain components:
- Shared primitives such as `Button`, `Card`, `Input`, `Modal`, `Loader`, `Toast`, and `EmptyState`.
- Auction-specific components such as `AuctionCard`, `AuctionGrid`, `AuctionDetails`, `BidForm`, `CreateAuctionForm`, and `DisputeForm`.
- Admin-specific components such as `AdminStats`, `DisputeTable`, and `ResolveDisputeModal`.

### State management approach

State is managed with React hooks and local component state rather than a global client store. The main shared state lives in:
- `useWallet()` for wallet session, network validation, and connection status.
- `useAuctions()` for loading and refreshing auction data from the contract.
- `useToken()` for reading the connected wallet's token balance.
- `useTransaction()` for consistent transaction lifecycle handling and toast feedback.

### Wallet integration flow

The app checks whether Freighter is installed, whether the wallet is reachable, whether the user has granted access, and whether the selected network matches Stellar Testnet. Once connected, the wallet address becomes the active identity for reads, writes, and role checks. Transactions are signed through Freighter and then sent through the generated Soroban client.

## 4. Core Features

- `Wallet connection`: connect, reconnect, disconnect, detect missing Freighter, and guard against wrong-network usage.
- `Auction creation`: create listings with validation, image upload, generated product IDs, and contract submission.
- `Auction browsing`: home feed for live and completed auctions with marketplace stats.
- `Auction details page`: detailed listing view with status, timing, seller/bidder info, and post-auction actions.
- `Bidding`: place bids from the auction page with transaction-state feedback.
- `Bid tracking`: bidder dashboard for joined auctions, won auctions, and inferred refund activity.
- `Seller dashboard`: manage listings, track open auctions, see pending protected payments, and cancel eligible auctions.
- `Admin dashboard`: view protocol-level stats, inspect disputes, and fund the reserve.
- `Dispute management`: raise disputes from the auction page and resolve them from an admin modal.
- `Test token claiming`: claim faucet funds for testnet usage and inspect `mUSDC` balances in the UI.

## 5. Engineering Decisions & Tradeoffs

### Why React and Vite

React made it easy to build role-specific screens from reusable components, while Vite kept development fast during frequent UI and contract-integration changes. This was a pragmatic choice for an MVP that needed quick iteration rather than a heavier framework or SSR setup.

### Why wallet-based authentication

Wallet-based authentication matches the Soroban execution model and removes the need for a separate auth backend. The tradeoff is that onboarding depends on Freighter availability, network correctness, and user familiarity with wallet prompts.

### Why reusable components

Reusable cards, buttons, forms, tables, and status badges keep seller, bidder, and admin experiences visually consistent while reducing duplication. The tradeoff is that some components stay intentionally generic and rely on page-level composition for role-specific behavior.

### Performance and simplicity tradeoffs

The frontend favors simplicity over aggressive optimization. Auction data is loaded with direct contract reads and refreshed on demand rather than through caching layers, streaming updates, or indexed backends. This keeps the codebase understandable, but it also limits scalability and real-time responsiveness as auction volume grows.

## 6. MVP Shortcuts & Quick Fixes

### Simulated or contract-reported yield displays

The UI displays yield as an informational marketplace metric rather than a deeply modeled financial flow.
- Why it was needed: the protocol needed to communicate the no-loss concept before real yield plumbing was finished.
- What problem it solved: it let the team ship admin and marketplace views without waiting for live vault integration.
- Long-term solution: connect the frontend to real yield vault and reserve accounting with richer breakdowns.

### Temporary contract-first integration style

The app talks directly to the generated Soroban client and contract wrapper for most reads and writes.
- Why it was needed: it avoided building a separate API or indexer early.
- What problem it solved: it enabled end-to-end testing of wallet, contract, and UI flows with minimal infrastructure.
- Long-term solution: add an indexing/query layer for faster dashboards, filtering, and live updates.

### Placeholder and derived UI metrics

Some dashboard values are derived entirely from in-memory auction reads, and some admin visuals such as reserve health are presentation-oriented.
- Why it was needed: the contract exposes core auction data, but not every product metric needed for polished dashboards.
- What problem it solved: it allowed useful overview screens before analytics-specific endpoints existed.
- Long-term solution: replace derived placeholders with verified protocol analytics and reserve calculations.

### Testnet faucet and mock token UX

The UI includes "Add Test Funds" and token balance flows around `mUSDC`.
- Why it was needed: real asset onboarding would have slowed iteration and testing.
- What problem it solved: it made demo usage and QA far easier for sellers, bidders, and admins.
- Long-term solution: integrate real token flows and production asset support.

### UI workarounds for incomplete backend capabilities

Image uploads go through Pinata directly from the frontend, and the app relies on manual refreshes after writes.
- Why it was needed: it kept listing creation and dispute evidence functional without extra backend services.
- What problem it solved: it unblocked product demos while contract and infra pieces were still evolving.
- Long-term solution: move toward a more robust media pipeline and reactive auction updates.

## 7. Challenges Faced

- `Soroban contract integration`: generated client types helped, but mapping contract states and write flows into user-friendly pages still required custom wrappers and formatting.
- `Wallet connection issues`: the app had to handle missing extensions, locked wallets, denied access, and wrong-network states gracefully.
- `Blockchain transaction states`: writes are asynchronous and wallet-mediated, so the UI needed clear pending/success/error feedback for every action.
- `Error handling and feedback`: contract errors, upload failures, and wallet issues had to be translated into readable messages instead of raw technical failures.
- `Auction updates and real-time data`: the current app relies mostly on refresh-based reads, which is simpler for an MVP but less responsive than subscriptions or indexed events.
