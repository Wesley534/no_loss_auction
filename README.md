# Harbor Auctions

> No-loss escrow auctions on Stellar Soroban.

## Overview

Harbor Auctions is a Soroban-based marketplace where sellers create auctions, bidders compete with protected funds, and only the current highest bid stays locked in escrow. When a higher bid arrives, the previous highest bidder is refunded immediately.

This model is aimed at a common auction pain point: bidders should not have capital stranded after they lose. In this MVP, the locked winning bid also accrues simulated yield while the auction is active, and the protocol supports post-sale delivery confirmation and dispute resolution.

Stellar and Soroban were chosen for low-cost transactions, good wallet UX on testnet, and a Rust-first smart contract stack that is straightforward to test and iterate on.

## Live Deployment

- Frontend: https://harborauctions.netlify.app/
- Contract ID: `CDJTNLT3WCAQ4RJOUKOTD7KMXXKUWHSHKMN4HXCCAS67FC4FHYSC67IA`
- Network: `Stellar Testnet`

## Features

- Create auctions with title, description, image, duration, and starting bid
- Place bids with automatic refund of the previous highest bidder
- Hold the active highest bid in escrow inside the contract
- Accrue simulated yield against locked principal
- Confirm delivery after auction close
- Raise and resolve disputes with seller payout, buyer refund, or split settlement
- Connect with Freighter for wallet-based authentication and transaction signing
- Claim test `mUSDC` from the built-in faucet
- Track seller, bidder, and admin activity from dedicated dashboards

## Architecture

```text
User
  |
  v
React Frontend (Vite + TypeScript)
  | \
  |  \-> Pinata (listing images + dispute evidence)
  v
Freighter Wallet
  |
  v
Soroban RPC (Testnet)
  |
  v
Auction Contract
  |- Auction lifecycle
  |- Internal token ledger (Mock USDC / mUSDC)
  |- Escrow + simulated yield accounting
  \- Delivery confirmation + dispute resolution
```

## Tech Stack

### Frontend

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `React Hook Form`
- `Zod`
- `Tailwind CSS v4`
- `Sonner`
- `lucide-react`

### Smart Contracts

- `Rust`
- `soroban-sdk = 25`

### Wallet + Blockchain

- `Freighter Wallet`
- `@stellar/stellar-sdk`
- Soroban generated TypeScript bindings in `frontend/src/lib/generated`
- `stellar` CLI for build, deploy, and contract interaction
- Soroban Testnet RPC: `https://soroban-testnet.stellar.org`

### Storage / Media

- `Pinata` for IPFS-backed listing images and dispute evidence

## Project Structure

```text
.
├── contract/
│   ├── Cargo.toml
│   ├── README.md
│   └── contracts/
│       └── auction_contract/
│           ├── Makefile
│           ├── Cargo.toml
│           ├── src/
│           │   ├── lib.rs
│           │   ├── storage.rs
│           │   ├── error.rs
│           │   ├── events.rs
│           │   └── test.rs
│           └── test_snapshots/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   ├── .env.example
│   └── README.md
├── notes/
│   ├── mvp.md
│   └── page*.html
└── README.md
```

- `contract/`: Soroban workspace and smart contract source
- `frontend/`: React application, generated contract client, wallet integration, and dashboards
- `notes/`: product notes and early UI references

## Local Setup

### Prerequisites

- `Node.js` and `npm`
- `Rust` toolchain
- `stellar` CLI
- `Freighter` browser extension for frontend wallet flows

### Clone

```bash
git clone https://github.com/Wesley534/no_loss_auction.git
cd no_loss_auction
```

### Frontend

Copy the example environment file:

```bash
cp frontend/.env.example frontend/.env
```

Install dependencies:

```bash
cd frontend
npm install
```

Start the local dev server:

```bash
npm run dev
```

Build the frontend for production:

```bash
npm run build
```

- `npm run dev` starts the Vite development server
- `npm run build` runs TypeScript compilation and produces a production bundle in `frontend/dist`

### Smart Contract

Run the contract test suite from the workspace:

```bash
cd contract
cargo test
```

Build the contract from the package directory:

```bash
cd contracts/auction_contract
make build
```

Other available targets:

```bash
make test
make fmt
make clean
```

- `cargo test` runs the Rust unit tests
- `make build` runs `stellar contract build` and emits the WASM artifact
- The current build outputs `contract/target/wasm32v1-none/release/auction_contract.wasm`

## Stellar Configuration

### Add the Testnet Network

```bash
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

### Generate Keys

The project logic assumes separate actors for admin, sellers, and bidders. A simple local setup is:

```bash
stellar keys generate admin --network testnet
stellar keys generate seller_one --network testnet
stellar keys generate seller_two --network testnet
stellar keys generate bidder_one --network testnet
stellar keys generate bidder_two --network testnet
```

- `admin`: initializes the contract, funds the reserve, and resolves disputes
- `seller_one` / `seller_two`: create auctions
- `bidder_one` / `bidder_two`: place bids and exercise buyer actions

### Import Existing Keys

To add an existing identity interactively:

```bash
stellar keys add admin
```

To add a public key for read-only use:

```bash
stellar keys add admin --public-key GASYQKJO6GAJ5OPHYKAHTEG5PF5C2N7K4SVZJWXGT7PIJP3JHYUGOUEN
```

### List Keys

```bash
stellar keys ls
```

### Fund Accounts

For testnet development, fund each identity with Friendbot through the CLI:

```bash
stellar keys fund admin --network testnet
stellar keys fund seller_one --network testnet
stellar keys fund seller_two --network testnet
stellar keys fund bidder_one --network testnet
stellar keys fund bidder_two --network testnet
```

## Deploy Contract

Build the contract first:

```bash
cd contract/contracts/auction_contract
make build
cd ../..
```

Deploy the compiled WASM:

```bash
cd contract
export CONTRACT_ID=$(stellar contract deploy \
  --source admin \
  --network testnet \
  --wasm target/wasm32v1-none/release/auction_contract.wasm \
  --alias no-loss-auction)
```

Initialize the contract with the admin wallet:

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source admin \
  --network testnet \
  -- initialize \
  --admin "$(stellar keys public-key admin)"
```

### Interact with the Contract

Claim test tokens for a bidder:

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source bidder_one \
  --network testnet \
  -- claim_test_tokens \
  --user "$(stellar keys public-key bidder_one)"
```

Read the current auction list:

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source admin \
  --network testnet \
  --send no \
  -- get_all_auctions
```

Tip: inspect the generated contract CLI before invoking write functions such as `create_auction`, `place_bid`, `confirm_delivery`, or `resolve_dispute`:

```bash
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source admin \
  --network testnet \
  -- --help
```

## Environment Variables

The frontend reads its runtime configuration from `frontend/.env`.

### Required

```bash
VITE_AUCTION_CONTRACT_ID=
VITE_STELLAR_RPC_URL=
VITE_STELLAR_NETWORK=
VITE_STELLAR_NETWORK_PASSPHRASE=
VITE_STELLAR_EXPLORER_BASE_URL=
VITE_AUCTION_ADMIN_ADDRESS=
```

### Optional / Feature-specific

```bash
VITE_AUCTION_APR_BPS=
VITE_PINATA_API_KEY=
VITE_PINATA_API_SECRET=
VITE_PINATA_JWT=
VITE_PINATA_GATEWAY_URL=
```

Notes:

- `VITE_AUCTION_APR_BPS` defaults to `1200` in code if unset
- Pinata variables are required for image upload flows in auction creation and dispute evidence
- Keep secrets out of version control; prefer `frontend/.env.example` as your starting point

## How the Protocol Works

1. A seller creates an auction with metadata, duration, starting bid, and APR basis points.
2. A bidder places a bid using the internal `mUSDC` token ledger.
3. If a higher bid arrives, the previous highest bidder is refunded immediately.
4. The active highest bid remains locked as escrow principal.
5. The contract accrues simulated yield against that locked amount.
6. When the auction ends, the highest bidder becomes the winner.
7. The winner confirms delivery to release principal to the seller, or raises a dispute.
8. If disputed, the admin resolves the order by paying the seller, refunding the buyer, or splitting principal between both parties.

## MVP Engineering Decisions

### Single Contract Architecture

Auction logic, escrow, token accounting, yield bookkeeping, and dispute resolution all live in one Soroban contract. This keeps deployment and frontend integration simple, at the cost of tighter coupling.

### Internal Token

The contract implements its own `Mock USDC` / `mUSDC` balance and allowance system instead of integrating an external asset contract. This reduced SEP-41 and asset-handling complexity during the MVP.

### Simulated Yield

Yield is computed with deterministic APR math and paid out from an admin-funded reserve. That keeps the contract easy to test, but it is not yet connected to a live yield protocol such as Blend.

### Test Faucet

`claim_test_tokens()` exists to make local QA and frontend demos fast. Each address can mint a one-time test balance without depending on external token setup.

### Direct RPC Reads

The frontend reads auctions directly from Soroban RPC and refreshes on demand rather than using an indexer. This kept the app simple, but limits real-time updates and scalability.

## Challenges Encountered

- Integrating external Stellar assets cleanly was more complex than keeping balances inside the contract
- Soroban deployment requires explicit initialization and actor-specific setup before the marketplace flow is usable
- Simulated yield still needs reserve management because the contract must be able to pay accrued yield at settlement time
- Wallet UX needs to handle missing Freighter installs, wrong-network states, and testnet funding friction
- Frontend auction updates are refresh-based today, so transaction state and post-write reloading need careful user feedback

## Future Improvements

- Integrate a real yield source such as Blend
- Replace the admin-funded reserve with vault-backed yield accounting
- Add reputation and trust signals for buyers and sellers
- Improve dispute resolution beyond a single admin operator
- Support multiple real payment assets instead of only internal `mUSDC`
- Add indexed reads and live auction updates

## Verification

- `cargo test` passes in `contract/` with 8/8 tests green
- `npm run build` succeeds in `frontend/`
