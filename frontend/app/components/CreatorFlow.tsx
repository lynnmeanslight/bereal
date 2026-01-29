"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Target } from "lucide-react";
import { CreateTokenForm } from "./CreateTokenForm";
import { InitializeDistributionForm } from "./InitializeDistributionForm";

type CreatorStep = "token-status" | "token-creation" | "auction-config";

export function CreatorFlow({ address, chainId, onBack }: { address?: string; chainId?: number; onBack: () => void }) {
  const [step, setStep] = useState<CreatorStep>("token-status");
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  return (
    <div className="min-h-screen bg-[color:var(--bereal-bg)] py-12 text-[color:var(--bereal-text-primary)]">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-text-secondary)] transition-colors hover:text-[color:var(--bereal-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
          <h1 className="text-3xl font-bold text-[color:var(--bereal-text-primary)]">
            Launch Your Token
          </h1>
          <p className="mt-2 text-[color:var(--bereal-text-secondary)]">
            Create a fair, bot-proof auction for your token
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === "token-status" || step === "token-creation" ? "text-[color:var(--bereal-success)]" : "text-[color:var(--bereal-text-muted)]"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === "token-status" || step === "token-creation" ? "bg-[color:var(--bereal-success)] text-white" : "bg-[color:var(--bereal-surface)] text-[color:var(--bereal-text-secondary)]"}`}>
              1
            </div>
            <span className="text-sm font-medium">Token</span>
          </div>
          <div className="h-px flex-1 bg-[color:var(--bereal-border)]"></div>
          <div className={`flex items-center gap-2 ${step === "auction-config" ? "text-[color:var(--bereal-success)]" : "text-[color:var(--bereal-text-muted)]"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === "auction-config" ? "bg-[color:var(--bereal-success)] text-white" : "bg-[color:var(--bereal-surface)] text-[color:var(--bereal-text-secondary)]"}`}>
              2
            </div>
            <span className="text-sm font-medium">Auction</span>
          </div>
        </div>

        {/* Step Content */}
        {step === "token-status" && (
          <div className="rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-[color:var(--bereal-text-primary)]">
              Do you already have a token?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => {
                  setHasToken(false);
                  setStep("token-creation");
                }}
                className="group rounded-xl border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-6 text-left transition-all hover:border-[color:var(--bereal-success)] hover:bg-[color:var(--bereal-surface-hover)]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--bereal-bg)]">
                  <Sparkles className="h-5 w-5 text-[color:var(--bereal-success)]" />
                </div>
                <h3 className="mb-2 font-bold text-[color:var(--bereal-text-primary)]">
                  No, create new token
                </h3>
                <p className="text-sm text-[color:var(--bereal-text-secondary)]">
                  Deploy a new UERC20 token with your custom parameters
                </p>
              </button>
              <button
                onClick={() => {
                  setHasToken(true);
                  setStep("auction-config");
                }}
                className="group rounded-xl border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-6 text-left transition-all hover:border-[color:var(--bereal-accent)] hover:bg-[color:var(--bereal-surface-hover)]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--bereal-bg)]">
                  <Target className="h-5 w-5 text-[color:var(--bereal-accent)]" />
                </div>
                <h3 className="mb-2 font-bold text-[color:var(--bereal-text-primary)]">
                  Yes, I have a token
                </h3>
                <p className="text-sm text-[color:var(--bereal-text-secondary)]">
                  Use an existing token address to launch your auction
                </p>
              </button>
            </div>
          </div>
        )}

        {step === "token-creation" && (
          <div className="rounded-2xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[color:var(--bereal-text-primary)]">Create Your Token</h2>
                <p className="mt-1 text-sm text-[color:var(--bereal-text-secondary)]">
                  Deploy a new UERC20 token on Unichain
                </p>
              </div>
              <button
                onClick={() => setStep("token-status")}
                className="text-sm font-medium text-[color:var(--bereal-accent)] hover:text-[color:var(--bereal-accent-dark)]"
              >
                <ArrowLeft className="mr-1 inline-block h-4 w-4" /> Back
              </button>
            </div>
            <CreateTokenForm 
              address={address} 
              chainId={chainId}
              onSuccess={(tokenAddress) => {
                // Auto-advance to auction config with token address
                setStep("auction-config");
              }}
            />
            <button
              onClick={() => setStep("auction-config")}
              className="mt-4 w-full rounded-lg bg-[color:var(--bereal-primary)] px-6 py-3 font-semibold text-white transition-all hover:bg-[color:var(--bereal-primary-dark)]"
            >
              Continue to Auction Setup
              <ArrowRight className="ml-2 inline-block h-4 w-4" />
            </button>
          </div>
        )}

        {step === "auction-config" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[color:var(--bereal-text-primary)]">
                  Configure Your Auction
                </h2>
                <p className="mt-1 text-sm text-[color:var(--bereal-text-secondary)]">
                  Set pricing, timing, and bot protection
                </p>
              </div>
              <button
                onClick={() => setStep(hasToken ? "token-status" : "token-creation")}
                className="text-sm font-medium text-[color:var(--bereal-accent)] hover:text-[color:var(--bereal-accent-dark)]"
              >
                <ArrowLeft className="mr-1 inline-block h-4 w-4" /> Back
              </button>
            </div>
            <InitializeDistributionForm address={address} chainId={chainId} />
          </div>
        )}
      </div>
    </div>
  );
}
