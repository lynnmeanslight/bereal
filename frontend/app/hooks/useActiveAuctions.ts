"use client";

import { useEffect, useState } from "react";

export type Auction = {
  id: string;
  chainId: number;
  auctionAddress: string;
  tokenAddress: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  claimBlock: string;
  creator: string;
  configHash: string;
  isOpen: boolean;
  blockNumber: bigint;
  transactionHash: string;
};

export function useActiveAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/auctions");
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();

        const currentBlock = BigInt(data.currentBlock || "0");

        const auctionList: Auction[] = (data.auctions || []).map((a: any) => {
          const start = BigInt(a.startBlock);
          const end = BigInt(a.endBlock);

          return {
            id: a.id,
            chainId: Number(a.chainId ?? 0),
            auctionAddress: a.id,
            tokenAddress: a.token,
            amount: a.amount,
            startBlock: a.startBlock,
            endBlock: a.endBlock,
            claimBlock: a.claimBlock || a.endBlock,
            creator: a.creator || "",
            configHash: a.configHash || "",
            isOpen: currentBlock >= start && currentBlock < end,
            blockNumber: BigInt(a.blockNumber),
            transactionHash: a.txHash,
          };
        });

        setAuctions(auctionList);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch auctions",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  return { auctions, isLoading, error };
}
