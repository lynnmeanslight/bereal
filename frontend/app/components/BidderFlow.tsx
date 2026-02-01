"use client";

import { useState } from "react";
import {
  Clock,
  Coins,
  TrendingUp,
  Calendar,
  Trophy,
  Zap,
  User,
  Target,
  DollarSign,
  Users,
  Sparkles,
} from "lucide-react";
import { useActiveAuctions, type Auction } from "../hooks/useActiveAuctions";
import { useAuctionDetails } from "../hooks/useAuctionDetails";
import { formatEther, formatUnits } from "viem";
import { ethers } from "ethers";
import { BidModal } from "./BidModal";
import { BackButton } from "./BackButton";

function AuctionCard({
  auction,
  onClick,
  onPlaceBid,
}: {
  auction: Auction;
  onClick: () => void;
  onPlaceBid: (auction: Auction, tokenMetadata: any, auctionState: any) => void;
}) {
  const { tokenMetadata, auctionConfig, auctionState, loading } =
    useAuctionDetails(auction.tokenAddress, auction.auctionAddress);
    
    
  
  // Default to 18 decimals for ETH/native currency
  const currencyDecimals = 18;
  const formatAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (value: string | bigint, decimals: number = 18) => {
    try {
      const num = typeof value === "string" ? BigInt(value) : value;
      const eth = formatEther(num);
      const numVal = parseFloat(eth);

      if (numVal >= 1_000_000_000) {
        return `${(numVal / 1_000_000_000).toFixed(2)}B`;
      } else if (numVal >= 1_000_000) {
        return `${(numVal / 1_000_000).toFixed(2)}M`;
      } else if (numVal >= 1_000) {
        return `${(numVal / 1_000).toFixed(2)}K`;
      }
      return numVal.toFixed(2);
    } catch {
      return "0";
    }
  };

  const formatTokenAmount = (value: bigint, decimals: number) => {
    const v = parseFloat(formatUnits(value, decimals));
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
    return v.toFixed(2);
  };

  const formatEth = (value: bigint) => {
    const v = parseFloat(formatEther(value));
    if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
    return v.toFixed(4);
  };

  const formatBlockToDate = (blockNumber: string | bigint, currentBlock: bigint) => {
    const blockNum = typeof blockNumber === "string" ? BigInt(blockNumber) : blockNumber;
    const blockDiff = Number(blockNum - currentBlock);
    const secondsDiff = blockDiff * 1; // 1 second per block on Unichain
    const targetDate = new Date(Date.now() + secondsDiff * 1000);
    
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getDate().toString().padStart(2, '0');
    const hours = targetDate.getHours().toString().padStart(2, '0');
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const Q96 = BigInt(2) ** BigInt(96);

  const formatClearingPrice = (
    priceQ96: bigint,
    tokenDecimals: number,
    currencyDecimals: number,
  ) => {
    const priceWei = (priceQ96 * BigInt(10) ** BigInt(18)) / Q96;
    const price = Number(formatUnits(priceWei, 18));
    return price.toFixed(6);
  };

  const calculateProgress = () => {
    if (!auctionState || !auctionConfig) return 0;
    if (!auctionState.totalSupply || auctionState.totalSupply === BigInt(0))
      return 0;
    // Calculate progress as percentage of tokens sold (cleared vs total supply)
    const progress =
      (Number(auctionState.totalCleared) / Number(auctionState.totalSupply)) *
      100;
    return Math.min(progress, 100);
  };

  const totalBlocks = BigInt(auction.endBlock) - BigInt(auction.startBlock);
  const blocksElapsed =
    BigInt(auction.blockNumber) - BigInt(auction.startBlock);
  const timeProgress =
    totalBlocks > BigInt(0)
      ? Number((blocksElapsed * BigInt(100)) / totalBlocks)
      : 0;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border-2 border-(--bereal-border) bg-linear-to-br from-(--bereal-surface) to-(--bereal-bg) p-6 text-left shadow-lg transition-all hover:border-(--bereal-success) hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-(--bereal-success)/20 text-(--bereal-success) rounded-full text-sm font-semibold">
        <Zap className="w-4 h-4" />
        <span>Live</span>
      </div>

      {/* Token Info */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-(--bereal-primary)/10 flex items-center justify-center shrink-0">
            {loading ? (
              <div className="w-6 h-6 border-2 border-(--bereal-primary)/30 border-t-(--bereal-primary) rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-6 h-6 text-(--bereal-primary)" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-(--bereal-text-primary) mb-1 leading-tight">
              {loading ? "Loading..." : tokenMetadata?.name || "Unknown Token"}
            </h3>
            <p className="text-sm text-(--bereal-text-secondary) font-mono">
              {loading
                ? "..."
                : tokenMetadata?.symbol || formatAddress(auction.tokenAddress)}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Total Supply */}
        <div className="bg-(--bereal-bg)/50 rounded-lg p-3 border border-(--bereal-border)/50">
          <div className="flex items-center gap-2 mb-1.5 text-(--bereal-text-secondary) text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total Supply</span>
          </div>
          <p className="text-lg font-bold text-(--bereal-text-primary) leading-tight">
            {formatNumber(auction.amount, tokenMetadata?.decimals || 18)}{" "}
          </p>
        </div>

        {/* Clearing Price */}
        <div className="bg-(--bereal-bg)/50 rounded-lg p-3 border border-(--bereal-border)/50">
          <div className="flex items-center gap-2 mb-1.5 text-(--bereal-text-secondary) text-xs font-medium">
            <Target className="w-3.5 h-3.5" />
            <span>Clearing Price</span>
          </div>
          <p className="text-lg font-bold text-(--bereal-text-primary) leading-tight">
            {loading || !auctionState ? (
              <span className="text-(--bereal-text-secondary) text-xs">
                Loading...
              </span>
            ) : auctionState.clearingPrice === BigInt(0) ? (
              <span className="text-(--bereal-text-secondary) text-xs">
                Not Set
              </span>
            ) : (
              <>
                {formatClearingPrice(
                  auctionState.clearingPrice,
                  tokenMetadata?.decimals || 18,
                  currencyDecimals,
                )}{" "}
                <span className="text-xs text-(--bereal-text-secondary) font-medium">
                  ETH
                </span>
              </>
            )}
          </p>
        </div>

        {/* Funds Raised */}
        <div className="bg-(--bereal-bg)/50 rounded-lg p-3 border border-(--bereal-border)/50 col-span-2">
          <div className="flex items-center gap-2 mb-1.5 text-(--bereal-text-secondary) text-xs font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Funds Raised</span>
          </div>
          <p className="text-lg font-bold text-(--bereal-success) leading-tight">
            {loading || !auctionState ? (
              <span className="text-(--bereal-text-secondary) text-xs">
                Loading...
              </span>
            ) : (
              <>
                {formatNumber(auctionState.currencyRaised)}{" "}
                <span className="text-xs text-(--bereal-text-secondary) font-medium">
                  ETH
                </span>
              </>
            )}
          </p>
          {auctionState && auctionState.totalSupply > BigInt(0) && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-(--bereal-text-secondary) mb-1 font-medium">
                <span>Tokens Sold</span>
                <span className="font-semibold">
                  {calculateProgress().toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-(--bereal-bg) rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-(--bereal-success) to-(--bereal-primary) transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-(--bereal-text-secondary) mt-1 font-medium">
                {formatNumber(
                  auctionState.totalCleared,
                  tokenMetadata?.decimals || 18,
                )}{" "}
                /{" "}
                {formatNumber(
                  auctionState.totalSupply,
                  tokenMetadata?.decimals || 18,
                )}{" "}
                {tokenMetadata?.symbol || "tokens"}
              </p>
            </div>
          )}
        </div>

        {/* Graduation Status */}
        <div className="bg-(--bereal-bg)/50 rounded-lg p-3 border border-(--bereal-border)/50 col-span-2">
          <div className="flex items-center gap-2 mb-1.5 text-(--bereal-text-secondary) text-xs font-medium">
            <Trophy className="w-3.5 h-3.5" />
            <span>Status</span>
          </div>
          <p className="text-lg font-bold text-(--bereal-text-primary) leading-tight">
            {loading || !auctionState ? (
              <span className="text-(--bereal-text-secondary) text-xs">
                Loading...
              </span>
            ) : (
              <span
                className={
                  auctionState.isGraduated
                    ? "text-(--bereal-success)"
                    : "text-(--bereal-warning)"
                }
              >
                {auctionState.isGraduated ? "✓ Graduated" : "In Progress"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Creator Info */}
      {auction.creator && (
        <div className="mb-4 pb-4 border-b border-(--bereal-border)/30">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-(--bereal-text-secondary)" />
            <span className="text-(--bereal-text-secondary) font-medium">
              Creator:
            </span>
            <a
              href={`https://sepolia.uniscan.xyz/address/${auction.creator}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-(--bereal-primary) font-semibold hover:underline"
            >
              {formatAddress(auction.creator)}
            </a>
          </div>
        </div>
      )}

      {/* Timing Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-(--bereal-text-secondary)" />
          <span className="text-(--bereal-text-secondary) font-medium">
            Auction Period:
          </span>
          <span className="text-(--bereal-text-primary) text-[10px] font-semibold">
            {formatBlockToDate(auction.startBlock, auction.blockNumber)} → {formatBlockToDate(auction.endBlock, auction.blockNumber)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-(--bereal-text-secondary)" />
          <span className="text-(--bereal-text-secondary) font-medium">
            Now:
          </span>
          <span className="text-(--bereal-text-primary) text-[10px] font-semibold">
            {new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '')}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-(--bereal-text-secondary) mb-1 font-medium">
            <span>Time Progress</span>
            <span className="font-semibold">{timeProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-(--bereal-bg) rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-(--bereal-primary) to-(--bereal-accent) transition-all duration-500"
              style={{ width: `${timeProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlaceBid(auction, tokenMetadata, auctionState);
        }}
        className="w-full bg-linear-to-r from-(--bereal-primary) to-(--bereal-accent) text-white font-bold py-2.5 px-5 rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2"
      >
        <Coins className="w-4 h-4" />
        <span className="text-sm">Place Bid</span>
        <span className="group-hover:translate-x-1 transition-transform text-sm">
          →
        </span>
      </button>

      {/* Contract Address (small, bottom) */}
      <button
        onClick={onClick}
        className="mt-3 w-full text-[10px] text-(--bereal-text-muted) text-center font-mono opacity-60 hover:opacity-100 transition-opacity"
      >
        {formatAddress(auction.auctionAddress)}
      </button>
    </div>
  );
}

export function BidderFlow({
  address,
  onBack,
}: {
  address?: string;
  onBack: () => void;
}) {
  const { auctions, isLoading, error } = useActiveAuctions();
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<{
    auctionAddress: string;
    tokenSymbol: string;
    clearingPrice: bigint;
    floorPrice: bigint;
    tickSpacing: bigint;
    totalCleared: bigint;
    isAuctionEnded: boolean;
  } | null>(null);

  const handlePlaceBid = (auction: Auction, tokenMetadata: any, auctionState: any) => {
    setSelectedAuctionForBid({
      auctionAddress: auction.auctionAddress,
      tokenSymbol: tokenMetadata?.symbol || "TOKEN",
      clearingPrice: auctionState?.clearingPrice || BigInt(0),
      floorPrice: auctionState?.floorPrice || BigInt(0),
      tickSpacing: auctionState?.tickSpacing || BigInt(0),
      totalCleared: auctionState?.totalCleared || BigInt(0),
      isAuctionEnded: BigInt(auction.blockNumber) >= BigInt(auction.endBlock),
    });
    setBidModalOpen(true);
  };

  if (selectedAuction) {
    // Auction detail view - will be enhanced with more data later
    return (
      <div className="min-h-screen bg-(--bereal-bg) py-12 text-(--bereal-text-primary)">
        <div className="mx-auto max-w-6xl px-6">
          <BackButton
            label="Back to Auctions"
            onClick={() => setSelectedAuction(null)}
            className="mb-6"
          />

          <div className="rounded-2xl border border-(--bereal-border) bg-(--bereal-surface) p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-(--bereal-text-primary)">
              Auction Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-(--bereal-text-secondary) font-medium">
                  Auction Address:
                </span>
                <p className="font-mono text-sm text-(--bereal-text-primary) font-semibold">
                  {selectedAuction.auctionAddress}
                </p>
              </div>
              <div>
                <span className="text-sm text-(--bereal-text-secondary) font-medium">
                  Token Address:
                </span>
                <p className="font-mono text-sm text-(--bereal-text-primary) font-semibold">
                  {selectedAuction.tokenAddress}
                </p>
              </div>
              <div>
                <span className="text-sm text-(--bereal-text-secondary) font-medium">
                  Amount:
                </span>
                <p className="font-mono text-sm text-(--bereal-text-primary) font-semibold">
                  {formatEther(BigInt(selectedAuction.amount))} tokens
                </p>
              </div>
              <div>
                <span className="text-sm text-(--bereal-text-secondary) font-medium">
                  Block Number:
                </span>
                <p className="font-mono text-sm text-(--bereal-text-primary) font-semibold">
                  {selectedAuction.blockNumber.toString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-(--bereal-text-secondary) font-medium">
                  Transaction Hash:
                </span>
                <p className="font-mono text-sm text-(--bereal-text-primary) font-semibold">
                  {selectedAuction.transactionHash}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bereal-bg) py-12 text-(--bereal-text-primary)">
      <div className="mx-auto max-w-7xl px-6">
        <BackButton label="Back to Home" onClick={onBack} className="mb-6" />

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-(--bereal-text-primary) tracking-tight">
            Active Auctions
          </h1>
          <p className="mt-2 text-base text-(--bereal-text-secondary)">
            Discover and participate in live token auctions with bot protection
          </p>
          {!isLoading && auctions.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-(--bereal-success)/10 px-4 py-2 text-sm font-semibold text-(--bereal-success)">
              <Zap className="h-4 w-4" />
              {auctions.length} {auctions.length === 1 ? "Auction" : "Auctions"}{" "}
              Live Now
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-(--bereal-border) border-t-(--bereal-primary)"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Coins className="h-8 w-8 text-(--bereal-primary)" />
              </div>
            </div>
            <span className="mt-6 text-base font-semibold text-(--bereal-text-secondary)">
              Loading auctions...
            </span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-(--bereal-danger) bg-(--bereal-surface) p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--bereal-danger) text-white font-bold">
                ✕
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-(--bereal-text-primary)">
                  Error Loading Auctions
                </h3>
                <p className="text-sm text-(--bereal-text-secondary)">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : auctions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-(--bereal-border) bg-(--bereal-surface) p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--bereal-bg)">
              <Trophy className="h-8 w-8 text-(--bereal-text-muted)" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-(--bereal-text-primary)">
              No Active Auctions
            </h3>
            <p className="text-sm text-(--bereal-text-secondary)">
              Check back soon for new token launches
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onClick={() => setSelectedAuction(auction)}
                onPlaceBid={handlePlaceBid}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {bidModalOpen && selectedAuctionForBid && (
        <BidModal
          isOpen={bidModalOpen}
          onClose={() => setBidModalOpen(false)}
          auctionAddress={selectedAuctionForBid.auctionAddress}
          tokenSymbol={selectedAuctionForBid.tokenSymbol}
          clearingPrice={selectedAuctionForBid.clearingPrice}
          floorPrice={selectedAuctionForBid.floorPrice}
          tickSpacing={selectedAuctionForBid.tickSpacing}
          totalCleared={selectedAuctionForBid.totalCleared}
          isAuctionEnded={selectedAuctionForBid.isAuctionEnded}
        />
      )}
    </div>
  );
}
