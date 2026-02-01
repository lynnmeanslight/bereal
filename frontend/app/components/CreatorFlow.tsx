"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Target, Rocket, TrendingUp, Shield, Zap, Info, CheckCircle2, Clock } from "lucide-react";
import { CreateTokenForm } from "./CreateTokenForm";
import { InitializeDistributionForm } from "./InitializeDistributionForm";
import { BackButton } from "./BackButton";

type CreatorStep = "token-status" | "token-creation" | "auction-config";

export function CreatorFlow({ address, chainId, onBack }: { address?: string; chainId?: number; onBack: () => void }) {
  const [step, setStep] = useState<CreatorStep>("token-status");
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string>("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  return (
    <div className="min-h-screen bg-(--bereal-bg) py-8 md:py-12 text-(--bereal-text-primary)">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="mb-6 animate-slide-down rounded-xl bg-linear-to-r from-(--bereal-success) to-green-600 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-white shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white">Token Created Successfully!</p>
                <p className="text-sm text-white/90">Proceeding to auction configuration...</p>
              </div>
            </div>
          </div>
        )}

        {/* Header with Gradient */}
        <div className="mb-8 md:mb-12">
          <BackButton
            label="Back to Home"
            onClick={onBack}
            className="mb-6"
          />
          
          <div className="relative">
            <div className="absolute -inset-1 bg-linear-to-r from-(--bereal-primary) to-(--bereal-accent) rounded-lg blur opacity-20"></div>
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-(--bereal-text-primary) to-(--bereal-primary) bg-clip-text text-transparent">
                Launch Your Token
              </h1>
              <p className="mt-3 text-lg text-(--bereal-text-secondary) max-w-2xl">
                Create a fair, bot-proof auction for your token with built-in sybil resistance
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="mb-10 md:mb-12">
          <div className="relative flex items-center">
            {/* Step 1: Token */}
            <div className="flex-1">
              <div className="relative flex flex-col items-center">
                <div className={`relative z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                  step === "token-status" || step === "token-creation" 
                    ? "border-white bg-linear-to-br from-(--bereal-success) to-green-600 shadow-lg shadow-green-500/50 scale-110" 
                    : createdTokenAddress || hasToken
                    ? "border-white bg-(--bereal-success) shadow-md"
                    : "border-(--bereal-border) bg-(--bereal-surface)"
                }`}>
                  {createdTokenAddress || hasToken ? (
                    <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  ) : (
                    <Sparkles className={`h-6 w-6 md:h-7 md:w-7 ${step === "token-status" || step === "token-creation" ? "text-white" : "text-(--bereal-text-muted)"}`} />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-xs md:text-sm font-semibold ${step === "token-status" || step === "token-creation" ? "text-(--bereal-success)" : "text-(--bereal-text-muted)"}`}>
                    Step 1
                  </p>
                  <p className={`text-sm md:text-base font-bold ${step === "token-status" || step === "token-creation" ? "text-(--bereal-text-primary)" : "text-(--bereal-text-secondary)"}`}>
                    Token Setup
                  </p>
                </div>
              </div>
            </div>

            {/* Connecting Line */}
            <div className="absolute left-1/4 right-1/4 top-6 md:top-7 z-0 flex items-center px-12 md:px-16">
              <div className="h-1 w-full bg-(--bereal-border) rounded-full overflow-hidden">
                <div className={`h-full bg-linear-to-r from-(--bereal-success) to-(--bereal-accent) transition-all duration-500 ${
                  step === "auction-config" || createdTokenAddress || hasToken ? "w-full" : "w-0"
                }`}></div>
              </div>
            </div>

            {/* Step 2: Auction */}
            <div className="flex-1">
              <div className="relative flex flex-col items-center">
                <div className={`relative z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                  step === "auction-config" 
                    ? "border-white bg-linear-to-br from-(--bereal-accent) to-(--bereal-primary) shadow-lg shadow-purple-500/50 scale-110" 
                    : createdTokenAddress || hasToken
                    ? "border-(--bereal-border) bg-(--bereal-surface) hover:border-(--bereal-accent)"
                    : "border-(--bereal-border) bg-(--bereal-surface)"
                }`}>
                  <Rocket className={`h-6 w-6 md:h-7 md:w-7 ${step === "auction-config" ? "text-white" : "text-(--bereal-text-muted)"}`} />
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-xs md:text-sm font-semibold ${step === "auction-config" ? "text-(--bereal-accent)" : "text-(--bereal-text-muted)"}`}>
                    Step 2
                  </p>
                  <p className={`text-sm md:text-base font-bold ${step === "auction-config" ? "text-(--bereal-text-primary)" : "text-(--bereal-text-secondary)"}`}>
                    Auction Config
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === "token-status" && (
          <div className="animate-fade-in">
            {/* Info Banner */}
            <div className="mb-6 rounded-xl bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-(--bereal-text-secondary)">
                  <p className="font-semibold text-(--bereal-text-primary) mb-1">Choose Your Path</p>
                  <p>Create a new token or use an existing one to launch your fair distribution auction</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-(--bereal-border) bg-(--bereal-surface) p-6 md:p-8 shadow-xl">
              <h2 className="mb-2 text-2xl md:text-3xl font-bold text-(--bereal-text-primary)">
                Do you already have a token?
              </h2>
              <p className="mb-8 text-(--bereal-text-secondary)">
                Select an option to get started with your token launch
              </p>
              
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Create New Token Card */}
                <button
                  onClick={() => {
                    setHasToken(false);
                    setStep("token-creation");
                  }}
                  className="group relative overflow-hidden rounded-2xl border-2 border-(--bereal-border) bg-linear-to-br from-(--bereal-bg) to-(--bereal-surface) p-6 md:p-8 text-left transition-all duration-300 hover:border-(--bereal-success) hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-1"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-br from-(--bereal-success)/0 to-(--bereal-success)/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-(--bereal-success) to-green-600 shadow-lg">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-(--bereal-text-primary) group-hover:text-(--bereal-success) transition-colors">
                      Create New Token
                    </h3>
                    <p className="mb-4 text-sm text-(--bereal-text-secondary) leading-relaxed">
                      Deploy a fresh UERC20 token with custom parameters, supply, and metadata
                    </p>
                    
                    {/* Features List */}
                    <ul className="space-y-2 text-xs text-(--bereal-text-secondary)">
                      <li className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-(--bereal-success)" />
                        <span>Instant deployment</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-(--bereal-success)" />
                        <span>Audited contracts</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-(--bereal-success)" />
                        <span>Gas optimized</span>
                      </li>
                    </ul>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-(--bereal-success)">Recommended</span>
                      <ArrowRight className="h-5 w-5 text-(--bereal-text-muted) group-hover:text-(--bereal-success) group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>

                {/* Use Existing Token Card */}
                <button
                  onClick={() => {
                    setHasToken(true);
                    setStep("auction-config");
                  }}
                  className="group relative overflow-hidden rounded-2xl border-2 border-(--bereal-border) bg-linear-to-br from-(--bereal-bg) to-(--bereal-surface) p-6 md:p-8 text-left transition-all duration-300 hover:border-(--bereal-accent) hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-br from-(--bereal-accent)/0 to-(--bereal-accent)/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-(--bereal-accent) to-(--bereal-primary) shadow-lg">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-(--bereal-text-primary) group-hover:text-(--bereal-accent) transition-colors">
                      Use Existing Token
                    </h3>
                    <p className="mb-4 text-sm text-(--bereal-text-secondary) leading-relaxed">
                      Connect your existing token contract to launch a fair distribution
                    </p>
                    
                    {/* Features List */}
                    <ul className="space-y-2 text-xs text-(--bereal-text-secondary)">
                      <li className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-(--bereal-accent)" />
                        <span>Skip token creation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-(--bereal-accent)" />
                        <span>Works with any ERC20</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Rocket className="h-3.5 w-3.5 text-(--bereal-accent)" />
                        <span>Launch immediately</span>
                      </li>
                    </ul>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs font-semibold text-(--bereal-text-muted)">Quick start</span>
                      <ArrowRight className="h-5 w-5 text-(--bereal-text-muted) group-hover:text-(--bereal-accent) group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "token-creation" && (
          <div className="animate-fade-in">
            <div className="rounded-2xl border-2 border-(--bereal-border) bg-(--bereal-surface) shadow-xl overflow-hidden">
              {/* Header Section with Gradient */}
              <div className="bg-linear-to-r from-(--bereal-success)/10 to-green-600/10 border-b-2 border-(--bereal-border) p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-(--bereal-success) to-green-600 shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-(--bereal-text-primary)">
                        Create Your Token
                      </h2>
                    </div>
                    <p className="text-(--bereal-text-secondary) max-w-2xl">
                      Deploy a new UERC20 token on Unichain with your custom parameters
                    </p>
                  </div>
                  <BackButton
                    label="Back"
                    onClick={() => setStep("token-status")}
                    size="sm"
                  />
                </div>
              </div>

              {/* Form Section */}
              <div className="p-6 md:p-8">
                <CreateTokenForm 
                  address={address} 
                  chainId={chainId}
                  onSuccess={(tokenAddress) => {
                    setCreatedTokenAddress(tokenAddress);
                    setShowSuccessBanner(true);
                    setTimeout(() => {
                      setStep("auction-config");
                      setShowSuccessBanner(false);
                    }, 2000);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === "auction-config" && (
          <div className="animate-fade-in">
            <div className="rounded-2xl border-2 border-(--bereal-border) bg-(--bereal-surface) shadow-xl overflow-hidden">
              {/* Header Section with Gradient */}
              <div className="bg-linear-to-r from-(--bereal-accent)/10 to-(--bereal-primary)/10 border-b-2 border-(--bereal-border) p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-(--bereal-accent) to-(--bereal-primary) shadow-lg">
                        <Rocket className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-(--bereal-text-primary)">
                        Configure Your Auction
                      </h2>
                    </div>
                    <p className="text-(--bereal-text-secondary) max-w-2xl">
                      Set pricing, timing, and bot protection parameters for your fair distribution
                    </p>
                  </div>
                  <BackButton
                    label="Back"
                    onClick={() => setStep(hasToken ? "token-status" : "token-creation")}
                    size="sm"
                  />
                </div>

                {/* Token Info Banner (if created) */}
                {createdTokenAddress && (
                  <div className="mt-6 rounded-xl bg-(--bereal-bg) border border-(--bereal-success)/30 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-(--bereal-success) shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-(--bereal-text-primary)">
                          Token Created Successfully
                        </p>
                        <p className="text-xs text-(--bereal-text-secondary) font-mono truncate">
                          {createdTokenAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Section */}
              <div className="p-6 md:p-8">
                <InitializeDistributionForm 
                  address={address} 
                  chainId={chainId}
                  initialTokenAddress={createdTokenAddress}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
