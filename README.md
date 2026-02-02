# BeReal 
## Launch tokens the human way - real auctions, real people, real price discovery with Uniswap

BeReal is an early-stage auction platform designed to support **fair, human-first token distributions** using **Continuous Clearing Auctions (CCA)** on Unichain. It enables builders to **create a token if one does not already exist**, or **launch an auction for an existing ERC20 token**, with transparent price discovery and optional human verification via World ID.

## About the builder
BeReal is built by a **student Web3 developer based in Muaklek, Saraburi, Thailand**, currently studying at **Asia Pacific International University (APIU)**. I actively participate in hackathons and focus on building decentralized products that emphasize fair participation and real user value. I’ve previously built **FlickShare**, a World App mini-app, and have hands-on experience building on the **Base** and **World** ecosystems. I’m also a participant in **Uniswap Hook Incubator Cohort 8**, where I explore advanced auction mechanisms and fair token distribution design.

**Portfolio:** https://nyilynnhtwe.xyz

**Project site:** https://bereal.nyilynnhtwe.xyz

---

## What it does
- Create a token (if it does not exist) and immediately launch a Continuous Clearing Auction
- Launch auctions for existing ERC20 tokens
- Distribute tokens using configurable supply, duration, and pricing parameters
- Allow users to bid using a max-price model with escrowed funds
- Optionally restrict participation using **World ID** for Sybil resistance

---

## How auction creation works

BeReal uses an on-chain **registry contract** (`BeRealRegistry`) to coordinate token distribution and auction initialization.

### High-level flow
1. **Token preparation**
   - If the token does not exist, it can be created via a factory (e.g. `USUPERC20_FACTORY_ADDRESS`)
   - If the token already exists, it is reused

2. **Auction initialization**
   - The registry calls the `ContinuousClearingAuctionFactory`
   - A new Distribution Auction contract is deterministically deployed

3. **Token transfer**
   - The creator approves the registry
   - Tokens are transferred directly into the auction contract

4. **Auction activation**
   - The auction is notified via `onTokensReceived()`
   - The auction becomes live and ready for bids

5. **On-chain indexing**
   - Auction metadata is recorded permanently in the registry

This guarantees that **only funded auctions go live**, preventing empty or misconfigured launches.

---

## Core contract: BeRealRegistry

The `createAuctionWithApproval` function is the main entry point for launching auctions.

- Requires prior ERC20 approval from the creator
- Initializes a new auction via the auction factory
- Transfers the auction supply into the auction contract
- Activates the auction lifecycle
- Records the auction on-chain for discovery and analytics

This design ensures **atomicity**, **safety**, and **transparent indexing** of all launched auctions.

---

## Why it’s interesting
Continuous Clearing Auctions encourage fair price discovery while reducing gas wars and short-term speculation. By locking bids and delaying clearing until tokens begin selling, BeReal provides a more stable, transparent, and human-centric token launch mechanism.

---

## Key features
- Token-aware auction creation (create new token or reuse existing)
- Continuous Clearing Auction mechanics
- Human-readable auction configuration
- World ID integration for Sybil resistance
- On-chain auction registry
- Native deployment on Unichain

---

## Tech stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Web3:** ethers.js v6, wagmi
- **Contracts:** Solidity (Foundry)
- **DB / API:** Prisma + Postgres

## Architecture
- **Client (Next.js 16, React 19):** Wallet-connected UI with wagmi/viem + ethers v6 for reads/writes; World ID widget for optional Sybil resistance.
- **Server-side (Next.js route handlers):** `/app/api/*` endpoints coordinate auction creation, token creation, bid submission, and distribution initialization. They call typed service helpers under `frontend/services` and `frontend/lib`.
- **Data layer (Prisma + Postgres):** Persists auction metadata, token info, and verification state for faster UX; prisma client generated in `frontend/generated/prisma` using the schema in `prisma/schema.prisma`.
- **Smart contracts (Foundry):** `BeRealRegistry` orchestrates auctions and token approvals; integrates with `ContinuousClearingAuctionFactory` and `USUPERC20Factory`; deployments tracked under `contract/broadcast`.
- **Chain integrations:** Default network is Unichain Sepolia. RPC access uses the provided `ALCHEMY_API_KEY` (or any compatible RPC). World ID verification uses the configured `NEXT_PUBLIC_WORLD_APP_ACTION_ID`.

### Request/Tx flow (high level)
1. User connects a wallet in the client, configures token + auction params, and optionally completes World ID verification.
2. The app prepares typed calldata using abis in `frontend/lib/abis`, then submits transactions via wagmi/ethers to the registry + factories.
3. Contracts deploy or re-use ERC20 tokens, deploy the auction contract, escrow the auction supply, and register metadata on-chain.
4. Prisma indexes on-chain state (via scripts/indexer.ts) to hydrate the UI with auction lists and details.
5. Bidders place max-price bids; clearing and refunds settle per the Continuous Clearing Auction mechanics.

---

## Repository layout
- `frontend/` – Next.js application
- `contract/` – Solidity contracts and Foundry scripts

---

## Build & run

**Prerequisites**
- Node.js 20+ and npm
- Foundry toolchain (`curl -L https://foundry.paradigm.xyz | bash`, then `foundryup`)
- Postgres database (local or hosted) for Prisma

**Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev            # start Next.js dev server
# npm run build && npm start  # production build + serve
```

Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_WORLD_APP_ACTION_ID=<world_id_action_id>
DATABASE_URL=<postgres_connection_string>
CHAIN_ID=1301                        # Unichain Sepolia
ALCHEMY_API_KEY=<alchemy_key_or_empty>
```

**Prisma / database**
```bash
cd frontend
npx prisma generate
# Apply migrations from the repo root prisma/ folder if needed:
cd .. && npx prisma migrate deploy --schema prisma/schema.prisma
```

**Contracts (Foundry)**
```bash
cd contract
forge install          # first time, to pull libs
forge build
forge test
```

For deployment scripts (example):
```bash
forge script script/BeRealRegistry.s.sol \
   --rpc-url $RPC_URL \
   --private-key $PRIVATE_KEY \
   --broadcast \
   --verify
```

## Usage notes

- Bids are placed using a maximum price per token

- Funds remain escrowed until clearing begins

- Clearing price is determined dynamically by supply and demand

- Any unused ETH is automatically refunded

## Deployed contracts (Unichain Sepolia)

**BeReal Registry:**  
https://sepolia.uniscan.xyz/address/0x22744bFc0aa721e0DBf6DdAD3f5744C27df2823E

**USUPERC20 Factory:**  
https://sepolia.uniscan.xyz/address/0x24016ed99a69E9B86D16d84351E1661266B7Ac6a

**Uniswap CCA Factory:**  
https://sepolia.uniscan.xyz/address/0xCCccCcCAE7503Cac057829BF2811De42E16e0bD5

> **Note:** At the time of development, there was **no official Continuous Clearing Auction (CCA) factory deployed on Unichain Sepolia**.  
> To unblock development and enable real testing, I **deployed the CCA factory myself** and submitted a **pull request to the Uniswap repository** to support Unichain Sepolia.  
> This project therefore includes both application-level work *and* ecosystem-level contributions.

---

## Demo
- Video: [Youtube](https://youtu.be/_7Gv2y5GpdE?si=wcuRQqOnFo0XRfKu)

## Useful links
- App: https://bereal.nyilynnhtwe.xyz
- Portfolio: https://nyilynnhtwe.xyz
- Contracts on Unichain Sepolia: see addresses above
