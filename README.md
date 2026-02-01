# BeReal 
## Launch tokens the human way - real auctions, real people, real price discovery with Uniswap

BeReal is an early-stage auction platform designed to support **fair, human-first token distributions** using **Continuous Clearing Auctions (CCA)** on Unichain. It enables builders to **create a token if one does not already exist**, or **launch an auction for an existing ERC20 token**, with transparent price discovery and optional human verification via World ID.

## About the builder
BeReal is built by a **student Web3 developer based in Muaklek, Saraburi, Thailand**, currently studying at **Asia Pacific International University (APIU)**. I actively participate in hackathons and focus on building decentralized products that emphasize fair participation and real user value. I’ve previously built **FlickShare**, a World App mini-app, and have hands-on experience building on the **Base** and **World** ecosystems. I’m also a participant in **Uniswap Hook Incubator Cohort 8**, where I explore advanced auction mechanisms and fair token distribution design.

**Portfolio:** https://nyilynnhtwe.xyz

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

---

## Repository layout
- `frontend/` – Next.js application
- `contract/` – Solidity contracts and Foundry scripts

---

## Local development
```bash
cd frontend
npm install
npm run dev

```

## Environment variables

Create frontend/.env.local with:
```bash
NEXT_PUBLIC_WORLD_APP_ACTION_ID

DATABASE_URL

CHAIN_ID

ALCHEMY_API_KEY (optional)
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
