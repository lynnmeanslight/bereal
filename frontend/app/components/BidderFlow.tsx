"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Globe, ShieldCheck } from "lucide-react";

type Auction = {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  currentPrice: string;
  floorPrice: string;
  totalRaised: string;
  participants: number;
  endBlock: number;
  botProtected: boolean;
  status: "active" | "ended";
};

const mockAuctions: Auction[] = [
  {
    id: "1",
    tokenName: "BeReal Token",
    tokenSymbol: "BREAL",
    tokenAddress: "0x1234...5678",
    currentPrice: "0.05 ETH",
    floorPrice: "0.01 ETH",
    totalRaised: "50 ETH",
    participants: 247,
    endBlock: 15000000,
    botProtected: true,
    status: "active",
  },
  {
    id: "2",
    tokenName: "Fair Launch",
    tokenSymbol: "FAIR",
    tokenAddress: "0x8765...4321",
    currentPrice: "0.03 ETH",
    floorPrice: "0.005 ETH",
    totalRaised: "30 ETH",
    participants: 189,
    endBlock: 15001000,
    botProtected: false,
    status: "active",
  },
];

export function BidderFlow({ address, onBack }: { address?: string; onBack: () => void }) {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  if (selectedAuction) {
    return (
      <div className="min-h-screen bg-[color:var(--bereal-bg)] py-12 text-[color:var(--bereal-text-primary)]">
        <div className="mx-auto max-w-6xl px-6">
          <button
            onClick={() => setSelectedAuction(null)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-text-secondary)] transition-colors hover:text-[color:var(--bereal-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Auctions
          </button>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Price Chart */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[color:var(--bereal-text-primary)]">
                      {selectedAuction.tokenName} ({selectedAuction.tokenSymbol})
                    </h1>
                    <p className="mt-1 text-sm text-[color:var(--bereal-text-secondary)]">
                      {selectedAuction.tokenAddress}
                    </p>
                  </div>
                  {selectedAuction.botProtected && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bereal-surface-hover)] px-3 py-1 text-xs font-semibold text-[color:var(--bereal-success)]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Bot Protected
                    </div>
                  )}
                </div>

                {/* Mock Price Chart */}
                <div className="mb-6 h-64 rounded-lg bg-[color:var(--bereal-bg)] p-4">
                  <div className="flex h-full items-end justify-between gap-2">
                    {[100, 85, 70, 60, 55, 52, 50, 48, 45, 43, 42, 40].map((height, i) => (
                      <div
                        key={i}
                        className="w-full rounded-t bg-gradient-to-t from-[color:var(--bereal-primary)] to-[color:var(--bereal-accent)]"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-[color:var(--bereal-text-secondary)]">
                    <span>Start</span>
                    <span>Current</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-[color:var(--bereal-text-secondary)]">Current Price</div>
                    <div className="text-2xl font-bold text-[color:var(--bereal-text-primary)]">
                      {selectedAuction.currentPrice}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[color:var(--bereal-text-secondary)]">Floor Price</div>
                    <div className="text-2xl font-bold text-[color:var(--bereal-text-primary)]">
                      {selectedAuction.floorPrice}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[color:var(--bereal-text-secondary)]">Total Raised</div>
                    <div className="text-2xl font-bold text-[color:var(--bereal-text-primary)]">
                      {selectedAuction.totalRaised}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bid Panel */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-[color:var(--bereal-text-primary)]">
                  Place Bid
                </h2>

                {selectedAuction.botProtected && !address ? (
                  <div className="mb-4 rounded-lg border border-[color:var(--bereal-warning)] bg-[color:var(--bereal-surface)] p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-warning)]">
                      <Globe className="h-4 w-4" /> This auction requires World ID verification
                    </p>
                    <button className="w-full rounded-lg bg-[color:var(--bereal-primary)] px-4 py-3 font-semibold text-white transition-all hover:bg-[color:var(--bereal-primary-dark)]">
                      Verify with World ID
                    </button>
                  </div>
                ) : null}

                <label className="mb-4 block">
                  <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                    Bid Amount (ETH)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.0"
                    className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-4 py-3 text-lg font-semibold text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                    disabled={selectedAuction.botProtected && !address}
                  />
                  <p className="mt-1 text-xs text-[color:var(--bereal-text-secondary)]">
                    Min: {selectedAuction.floorPrice}
                  </p>
                </label>

                <button
                  disabled={selectedAuction.botProtected && !address}
                  className="w-full rounded-lg bg-[color:var(--bereal-success)] px-4 py-3 font-semibold text-white transition-all hover:bg-[color:var(--bereal-success-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedAuction.botProtected && !address ? "Verify to Bid" : "Place Bid"}
                </button>

                <div className="mt-6 space-y-3 border-t border-[color:var(--bereal-border)] pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--bereal-text-secondary)]">Participants</span>
                    <span className="font-semibold text-[color:var(--bereal-text-primary)]">
                      {selectedAuction.participants}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--bereal-text-secondary)]">End Block</span>
                    <span className="font-semibold text-[color:var(--bereal-text-primary)]">
                      {selectedAuction.endBlock.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[color:var(--bereal-bg)] py-12 text-[color:var(--bereal-text-primary)]">
      <div className="mx-auto max-w-7xl px-6">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-text-secondary)] transition-colors hover:text-[color:var(--bereal-text-primary)]"
        >
            <ArrowLeft className="h-4 w-4" /> Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[color:var(--bereal-text-primary)]">Active Auctions</h1>
          <p className="mt-2 text-[color:var(--bereal-text-secondary)]">
            Browse and participate in ongoing token auctions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockAuctions.map((auction) => (
            <button
              key={auction.id}
              onClick={() => setSelectedAuction(auction)}
              className="group rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6 text-left shadow-sm transition-all hover:border-[color:var(--bereal-success)] hover:bg-[color:var(--bereal-surface-hover)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[color:var(--bereal-text-primary)]">
                    {auction.tokenSymbol}
                  </h3>
                  <p className="text-sm text-[color:var(--bereal-text-secondary)]">
                    {auction.tokenName}
                  </p>
                </div>
                {auction.botProtected && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bereal-surface-hover)] px-2 py-1 text-xs font-semibold text-[color:var(--bereal-success)]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Protected
                  </div>
                )}
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--bereal-text-secondary)]">Current Price</span>
                  <span className="font-semibold text-[color:var(--bereal-success)]">
                    {auction.currentPrice}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--bereal-text-secondary)]">Total Raised</span>
                  <span className="font-semibold text-[color:var(--bereal-text-primary)]">
                    {auction.totalRaised}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--bereal-text-secondary)]">Participants</span>
                  <span className="font-semibold text-[color:var(--bereal-text-primary)]">
                    {auction.participants}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[color:var(--bereal-border)] pt-4">
                <span className="text-xs text-[color:var(--bereal-text-muted)]">
                  Block {auction.endBlock.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--bereal-primary)] transition-transform group-hover:translate-x-1">
                  View Details <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
