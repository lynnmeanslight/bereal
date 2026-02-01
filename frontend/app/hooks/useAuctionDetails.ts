"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { AuctionABI } from "../lib/abis/AuctionABI";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
};

export type AuctionConfig = {
  startBlock: bigint;
  endBlock: bigint;
  claimBlock: bigint;
  currency: string;
  tokensRecipient: string;
  fundsRecipient: string;
};

export type AuctionState = {
  currencyRaised: bigint;
  totalSupply: bigint;
  isGraduated: boolean;
  clearingPrice: bigint;
  totalCleared: bigint;
  floorPrice: bigint;
  tickSpacing: bigint;
};

export function useAuctionDetails(
  tokenAddress: string | undefined,
  auctionAddress: string | undefined,
  rpcUrl: string = "https://sepolia.unichain.org",
) {
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(
    null,
  );
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig | null>(
    null,
  );
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress || !auctionAddress) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Fetch token metadata
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          provider,
        );
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
        ]);

        setTokenMetadata({ name, symbol, decimals: Number(decimals) });

        // Fetch auction config and state using the correct ABI methods
        const auctionContract = new ethers.Contract(
          auctionAddress,
          AuctionABI,
          provider,
        );

        const [
          startBlock,
          endBlock,
          claimBlock,
          currency,
          tokensRecipient,
          fundsRecipient,
        ] = await Promise.all([
          auctionContract.startBlock(),
          auctionContract.endBlock(),
          auctionContract.claimBlock(),
          auctionContract.currency(),
          auctionContract.tokensRecipient(),
          auctionContract.fundsRecipient(),
        ]);

        const [
          currencyRaised,
          totalSupply,
          isGraduated,
          clearingPrice,
          totalCleared,
          floorPrice,
          tickSpacing,
        ] = await Promise.all([
          auctionContract.currencyRaised(),
          auctionContract.totalSupply(),
          auctionContract.isGraduated(),
          auctionContract.clearingPrice(),
          auctionContract.totalCleared(),
          auctionContract.floorPrice(),
          auctionContract.tickSpacing(),
        ]);

        console.log("Total cleared");
        console.log(totalCleared);
        setAuctionConfig({
          startBlock: BigInt(startBlock),
          endBlock: BigInt(endBlock),
          claimBlock: BigInt(claimBlock),
          currency,
          tokensRecipient,
          fundsRecipient,
        });

        setAuctionState({
          currencyRaised: BigInt(currencyRaised),
          totalSupply: BigInt(totalSupply),
          isGraduated,
          clearingPrice: BigInt(clearingPrice),
          totalCleared: BigInt(totalCleared),
          floorPrice: BigInt(floorPrice),
          tickSpacing: BigInt(tickSpacing),
        });
      } catch (err) {
        console.error("Failed to fetch auction details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [tokenAddress, auctionAddress, rpcUrl]);

  return {
    tokenMetadata,
    auctionConfig,
    auctionState,
    loading,
    error,
  };
}
