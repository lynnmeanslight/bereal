"use client";

import { ArrowRight, Check, Gem, Globe, LineChart, Rocket, Zap } from "lucide-react";

export function LandingPage({ onSelectRole }: { onSelectRole: (role: "creator" | "bidder") => void }) {
  return (
    <div className="min-h-screen bg-[color:var(--bereal-bg)] text-[color:var(--bereal-text-primary)]">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2 text-sm font-medium text-[color:var(--bereal-text-primary)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--bereal-success)]"></span>
            Powered by Uniswap V4 + World ID
          </div>
          
          <h1 className="mb-6 bg-gradient-to-r from-[color:var(--bereal-primary)] to-[color:var(--bereal-accent)] bg-clip-text text-6xl font-black tracking-tight text-transparent">
            Launch Fair.<br />Launch Real.
          </h1>
          
          <p className="mx-auto mb-12 max-w-2xl text-xl text-[color:var(--bereal-text-secondary)]">
            The first bot-proof liquidity launchpad powered by continuous clearing auctions and verified humans.
          </p>

          {/* Stats */}
          <div className="mb-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6 shadow-sm">
              <div className="text-4xl font-bold text-[color:var(--bereal-success)]">$2.4M</div>
              <div className="mt-2 text-sm text-[color:var(--bereal-text-secondary)]">Total Liquidity Raised</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6 shadow-sm">
              <div className="text-4xl font-bold text-[color:var(--bereal-accent)]">1,247</div>
              <div className="mt-2 text-sm text-[color:var(--bereal-text-secondary)]">Human Verified</div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-2xl font-bold text-[color:var(--bereal-text-primary)]">
              Choose Your Path
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Creator Card */}
              <button
                onClick={() => onSelectRole("creator")}
                className="group relative overflow-hidden rounded-2xl border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-8 text-left shadow-lg transition-all hover:scale-[1.02] hover:border-[color:var(--bereal-success)] hover:bg-[color:var(--bereal-surface-hover)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--bereal-bg)]">
                  <Rocket className="h-6 w-6 text-[color:var(--bereal-success)]" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-[color:var(--bereal-text-primary)]">
                  I'm a Creator
                </h3>
                <p className="mb-4 text-sm text-[color:var(--bereal-text-secondary)]">
                  Launch your token with fair price discovery and optional bot protection.
                </p>
                <ul className="space-y-2 text-sm text-[color:var(--bereal-text-secondary)]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--bereal-success)]" /> Deploy or use existing token
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--bereal-success)]" /> Configure auction pricing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--bereal-success)]" /> Enable World ID verification
                  </li>
                </ul>
                <div className="mt-6 inline-flex items-center gap-2 font-semibold text-[color:var(--bereal-success)]">
                  Launch Auction
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              {/* Bidder Card */}
              <button
                onClick={() => onSelectRole("bidder")}
                className="group relative overflow-hidden rounded-2xl border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-8 text-left shadow-lg transition-all hover:scale-[1.02] hover:border-[color:var(--bereal-accent)] hover:bg-[color:var(--bereal-surface-hover)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--bereal-bg)]">
                  <Gem className="h-6 w-6 text-[color:var(--bereal-accent)]" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-[color:var(--bereal-text-primary)]">
                  I'm a Bidder
                </h3>
                <p className="mb-4 text-sm text-[color:var(--bereal-text-secondary)]">
                  Discover and participate in bot-proof token auctions.
                </p>
                <ul className="space-y-2 text-sm text-[color:var(--bereal-text-secondary)]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--bereal-accent)]" /> Browse active auctions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--bereal-accent)]" /> Track price discovery
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[color:var(--bereal-accent)]" /> Verify with World ID
                  </li>
                </ul>
                <div className="mt-6 inline-flex items-center gap-2 font-semibold text-[color:var(--bereal-accent)]">
                  Browse Auctions
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="border-t border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-[color:var(--bereal-text-primary)]">
            How BeReal Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--bereal-bg)]">
                <LineChart className="h-6 w-6 text-[color:var(--bereal-success)]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[color:var(--bereal-text-primary)]">
                Continuous Clearing
              </h3>
              <p className="text-sm text-[color:var(--bereal-text-secondary)]">
                Fair price discovery using Uniswap V4's continuous clearing auction mechanism.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--bereal-bg)]">
                <Globe className="h-6 w-6 text-[color:var(--bereal-accent)]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[color:var(--bereal-text-primary)]">
                Human Verified
              </h3>
              <p className="text-sm text-[color:var(--bereal-text-secondary)]">
                Optional bot protection ensures only Orb-verified humans can participate.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--bereal-bg)]">
                <Zap className="h-6 w-6 text-[color:var(--bereal-primary)]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[color:var(--bereal-text-primary)]">
                Instant Liquidity
              </h3>
              <p className="text-sm text-[color:var(--bereal-text-secondary)]">
                Bootstrap liquidity and establish fair market prices from day one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
