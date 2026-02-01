"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ethers } from "ethers";
import { UERC20Metadata } from "../lib/types";
import { USUPERC20_FACTORY_ABI } from "../lib/abis/USUPERC20_FACTORY_ABI";
import { USUPERC20_FACTORY_ADDRESS } from "../lib/constants";
import { formatCompact } from "../lib/format";
import { useHumanVerification } from "../hooks/useHumanVerification";
import { Shield, AlertCircle } from "lucide-react";
import { WorldIDSection } from "./WorldIDSection";

type Props = {
  address?: string;
  chainId?: number;
  onSuccess?: (tokenAddress: string) => void;
};

type SubmitState = {
  submitting: boolean;
  txHash?: string;
  predictedAddress?: string;
  error?: string;
  verifying?: boolean;
  tokenBalance?: string;
  verified?: boolean;
};

const defaultForm = {
  factoryAddress: USUPERC20_FACTORY_ADDRESS,
  name: "My Super Token",
  symbol: "MSUP",
  decimals: "18",
  humanSupply: "1,000,000,000", // human-readable total supply
  recipient: "",
  creator: "",
  homeChainId: "1301", // Unichain Sepolia
  description: "A programmable super UERC20 token",
  website: "https://example.com",
  image: "https://example.com/logo.png",
  salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

export function CreateTokenForm({ address, chainId, onSuccess }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [state, setState] = useState<SubmitState>({ submitting: false });
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [showVerificationError, setShowVerificationError] = useState(false);
  const [verificationErrorMessage, setVerificationErrorMessage] = useState("");
  const [showAlreadyVerifiedWarning, setShowAlreadyVerifiedWarning] = useState(false);
  
  const { verified: isWorldIDVerified, loading: verificationLoading } = useHumanVerification({
    walletAddress: address,
    action: process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID || "bereal-token-creation",
    chainId,
  });

  // Auto-fill wallet-dependent defaults when available (without overwriting user edits).
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      recipient: prev.recipient || address || "",
      creator: prev.creator || address || "",
    }));
  }, [address, chainId]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address) {
      setState({ submitting: false, error: "Connect your wallet first" });
      return;
    }
    if (!isWorldIDVerified) {
      setState({ submitting: false, error: "World ID verification required to create tokens" });
      return;
    }
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setState({ submitting: false, error: "No injected wallet found" });
      return;
    }

    try {
      setState({ submitting: true });

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const decimalsNum = Number(form.decimals);
      if (!Number.isFinite(decimalsNum) || decimalsNum < 0 || decimalsNum > 255) {
        throw new Error("Decimals must be between 0 and 255");
      }

      const cleanedHuman = (form.humanSupply || "0").replace(/,/g, "").trim();
      const totalSupply = ethers.parseUnits(cleanedHuman || "0", decimalsNum);
      const homeChainId = BigInt(1301); // Unichain Sepolia
      const creator = address; // Always use connected wallet
      const recipient = address; // Always use connected wallet
      const salt = form.salt && form.salt.trim() !== "" ? form.salt : ethers.ZeroHash;
      const metadata: UERC20Metadata = {
        description: form.description,
        website: form.website,
        image: form.image,
      };

      const factory = new ethers.Contract(
        form.factoryAddress,
        USUPERC20_FACTORY_ABI,
        signer,
      );

      // Static call to preview created token address
      const predictedAddress: string = await factory.createToken.staticCall(
        form.name,
        form.symbol,
        decimalsNum,
        totalSupply,
        recipient,
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "address", "tuple(string description,string website,string image)"],
          [homeChainId, creator, metadata],
        ),
        salt,
      );

      const tx = await factory.createToken(
        form.name,
        form.symbol,
        decimalsNum,
        totalSupply,
        recipient,
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "address", "tuple(string description,string website,string image)"],
          [homeChainId, creator, metadata],
        ),
        salt,
      );

      const receipt = await tx.wait();

      setState({
        submitting: false,
        txHash: receipt?.hash,
        predictedAddress,
        verifying: true,
      });

      // Verify token creation by checking balance
      try {
        const tokenContract = new ethers.Contract(
          predictedAddress,
          [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
          ],
          provider,
        );

        // Wait a bit for blockchain state to update
        await new Promise(resolve => setTimeout(resolve, 2500));

        const balance = await tokenContract.balanceOf(recipient);
        const decimals = await tokenContract.decimals();
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        setState({
          submitting: false,
          txHash: receipt?.hash,
          predictedAddress,
          verifying: false,
          tokenBalance: balanceFormatted,
          verified: true,
        });

        // Wait a moment to show verification success, then redirect
        setTimeout(() => {
          if (onSuccess && predictedAddress) {
            onSuccess(predictedAddress);
          }
        }, 1500);
      } catch (verifyError) {
        setState({
          submitting: false,
          txHash: receipt?.hash,
          predictedAddress,
          verifying: false,
          error: "Token created but failed to verify balance",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create token";
      setState({ submitting: false, error: message });
    }
  };

  // Preview computed total supply for UX.
  let supplyPreview: { raw?: bigint; compact?: string; error?: string } = {};
  const decimalsNum = Number(form.decimals);
  if (Number.isFinite(decimalsNum) && decimalsNum >= 0 && decimalsNum <= 255) {
    try {
      const cleanedHuman = (form.humanSupply || "0").replace(/,/g, "").trim();
      const raw = ethers.parseUnits(cleanedHuman || "0", decimalsNum);
      // Format the human-readable number, not the raw wei value
      const humanNumber = parseFloat(cleanedHuman || "0");
      supplyPreview = { raw, compact: formatCompact(humanNumber.toString()) };
    } catch (err) {
      supplyPreview = { error: "Invalid supply for given decimals" };
    }
  } else {
    supplyPreview = { error: "Decimals must be 0-255" };
  }

  return (
    <div className="rounded-xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-4 text-[color:var(--bereal-text-primary)]">
      {/* Verification Error Message */}
      {showVerificationError && (
        <div className="mb-4 rounded-xl border-2 border-[color:var(--bereal-danger)] bg-linear-to-br from-red-500/5 to-[color:var(--bereal-danger)]/10 p-5 animate-slide-down shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--bereal-danger)] shadow-md">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-bold text-[color:var(--bereal-danger)] mb-2 flex items-center gap-2">
                World ID Already Connected
                <span className="inline-flex items-center rounded-full bg-[color:var(--bereal-danger)]/20 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--bereal-danger)]">
                  DUPLICATE
                </span>
              </h3>
              <p className="text-sm text-[color:var(--bereal-text-primary)] leading-relaxed mb-3">
                {verificationErrorMessage}
              </p>
              <div className="rounded-lg bg-[color:var(--bereal-bg)]/60 border border-[color:var(--bereal-danger)]/20 p-3">
                <p className="text-xs text-[color:var(--bereal-text-secondary)] leading-relaxed">
                  <strong className="text-[color:var(--bereal-text-primary)]">Why this happens:</strong> Each World ID can only be verified once across all wallets to ensure fair, one-person-one-vote participation.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--bereal-text-muted)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Try using a different wallet or contact support for assistance</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Already Verified Warning */}
      {showAlreadyVerifiedWarning && (
        <div className="mb-4 rounded-xl border-2 border-[color:var(--bereal-warning)] bg-linear-to-br from-yellow-500/5 to-[color:var(--bereal-warning)]/10 p-5 animate-slide-down shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[color:var(--bereal-warning)] to-yellow-600 shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-bold text-[color:var(--bereal-warning)] mb-2 flex items-center gap-2">
                Human Verified
                <span className="inline-flex items-center rounded-full bg-[color:var(--bereal-warning)]/20 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--bereal-warning)]">
                  ✓ HUMAN
                </span>
              </h3>
              <p className="text-sm text-[color:var(--bereal-text-primary)] leading-relaxed mb-3">
                You're human‑verified. No need to verify again!
              </p>
              <div className="rounded-lg bg-[color:var(--bereal-bg)]/60 border border-[color:var(--bereal-warning)]/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[color:var(--bereal-text-secondary)]">Verified Wallet</span>
                  <span className="text-xs font-mono text-[color:var(--bereal-warning)] font-semibold">
                    {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Wallet connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[color:var(--bereal-text-secondary)]">Status</span>
                  <span className="text-xs font-semibold text-[color:var(--bereal-warning)]">Human & Ready</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--bereal-text-muted)]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You can create tokens and participate in auctions</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Success Message */}
      {showVerificationSuccess && (
        <div className="mb-4 rounded-xl border-2 border-[color:var(--bereal-success)] bg-linear-to-br from-green-500/5 to-[color:var(--bereal-success)]/10 p-5 animate-slide-down shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[color:var(--bereal-success)] to-green-600 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-bold text-[color:var(--bereal-success)] mb-2 flex items-center gap-2">
                Human Verified!
                <span className="inline-flex items-center rounded-full bg-[color:var(--bereal-success)]/20 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--bereal-success)]">
                  ✓ HUMAN
                </span>
              </h3>
              <p className="text-sm text-[color:var(--bereal-text-primary)] leading-relaxed mb-3">
                You're verified as a real human. Create tokens and join auctions.
              </p>
              <div className="rounded-lg bg-[color:var(--bereal-bg)]/60 border border-[color:var(--bereal-success)]/20 p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[color:var(--bereal-text-secondary)]">Connected Wallet</span>
                  <span className="text-xs font-mono text-[color:var(--bereal-success)] font-semibold">
                    {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Wallet connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[color:var(--bereal-text-secondary)]">Verification Status</span>
                  <span className="text-xs font-semibold text-[color:var(--bereal-success)]">Human Verified</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[color:var(--bereal-text-muted)]">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:var(--bereal-success)] border-t-transparent"></div>
                <span>Updating verification status...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* World ID Verification Status */}
      {!verificationLoading && (
        <div className={`mb-4 rounded-lg border p-3 ${
          isWorldIDVerified 
            ? "border-[color:var(--bereal-success)] bg-[color:var(--bereal-success)]/10" 
            : "border-[color:var(--bereal-warning)] bg-[color:var(--bereal-warning)]/10"
        }`}>
          {isWorldIDVerified ? (
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[color:var(--bereal-success)] shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[color:var(--bereal-success)]">Human verified ✨</p>
                <p className="text-xs text-[color:var(--bereal-text-secondary)]">Ready to launch tokens & auctions</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-[color:var(--bereal-warning)] shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[color:var(--bereal-warning)]">World ID Verification Required</p>
                  <p className="text-xs text-[color:var(--bereal-text-secondary)]">Verify below to create tokens</p>
                </div>
              </div>
              <WorldIDSection
                walletAddress={address}
                action={process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID || "bereal-token-creation"}
                chainId={chainId}
                onSuccess={(alreadyVerified?: boolean) => {
                  if (alreadyVerified) {
                    // Wallet was already verified - show warning and don't reload
                    setShowVerificationError(false);
                    setShowVerificationSuccess(false);
                    setShowAlreadyVerifiedWarning(true);
                    // Auto-dismiss after 6 seconds to give user time to read
                    setTimeout(() => {
                      setShowAlreadyVerifiedWarning(false);
                    }, 6000);
                  } else {
                    // New verification - show success message and reload after delay
                    setShowVerificationError(false);
                    setShowAlreadyVerifiedWarning(false);
                    setShowVerificationSuccess(true);
                    setTimeout(() => {
                      window.location.reload();
                    }, 3000);
                  }
                }}
                onFailure={() => {
                  // Show error message - nullifier hash already used by another wallet
                  setShowVerificationSuccess(false);
                  setShowAlreadyVerifiedWarning(false);
                  setShowVerificationError(true);
                  setVerificationErrorMessage(
                    "This World ID has already been verified with a different wallet address. Each person can only verify once."
                  );
                }}
              />
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[color:var(--bereal-text-primary)]">
            Create UERC20 Token
          </p>
          <p className="text-xs text-[color:var(--bereal-text-secondary)]">
            Deploy a Super UERC20 via the factory. Enter human-readable amounts; we convert to on-chain units.
          </p>
        </div>
        <span className="rounded-full bg-[color:var(--bereal-surface-hover)] px-2 py-1 text-[11px] font-medium text-[color:var(--bereal-success)]">
          Requires connected wallet
        </span>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Name</span>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="e.g. My Super Token"
              required
            />
          </label>
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Symbol</span>
            <input
              value={form.symbol}
              onChange={(e) => updateField("symbol", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="e.g. MSUP"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Decimals</span>
            <input
              value={form.decimals}
              onChange={(e) => updateField("decimals", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="18"
              required
            />
          </label>
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Total supply (human)</span>
            <input
              value={form.humanSupply}
              onChange={(e) => updateField("humanSupply", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="e.g. 1,000,000,000"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Description</span>
            <input
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="Short description"
            />
          </label>
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Website</span>
            <input
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="https://example.com"
            />
          </label>
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Image URL</span>
            <input
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="https://example.com/logo.png"
            />
          </label>
        </div>

        <div className="rounded-lg bg-[color:var(--bereal-bg)] border border-[color:var(--bereal-border)] p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-[color:var(--bereal-text-primary)] mb-1">
              Summary
            </h4>
            <p className="text-xs text-[color:var(--bereal-text-muted)]">
              Review your token configuration before creating
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-[color:var(--bereal-border)]">
              <span className="text-xs text-[color:var(--bereal-text-secondary)]">Connected Wallet</span>
              <span className="text-xs font-mono text-[color:var(--bereal-text-primary)]">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[color:var(--bereal-border)]">
              <span className="text-xs text-[color:var(--bereal-text-secondary)]">Network</span>
              <span className="text-xs font-medium text-[color:var(--bereal-text-primary)]">
                {chainId === 1301 ? "Unichain Sepolia" : chainId ?? "Unknown"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[color:var(--bereal-border)]">
              <span className="text-xs text-[color:var(--bereal-text-secondary)]">Token Name</span>
              <span className="text-xs font-semibold text-[color:var(--bereal-text-primary)]">
                {form.name || "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[color:var(--bereal-border)]">
              <span className="text-xs text-[color:var(--bereal-text-secondary)]">Symbol</span>
              <span className="text-xs font-bold text-[color:var(--bereal-success)]">
                {form.symbol || "—"}
              </span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[color:var(--bereal-text-secondary)]">Total Supply</span>
                {supplyPreview.error ? (
                  <span className="text-xs text-[color:var(--bereal-danger)] font-medium">
                    {supplyPreview.error}
                  </span>
                ) : supplyPreview.compact ? (
                  <span className="text-sm font-bold text-[color:var(--bereal-success)]">
                    {supplyPreview.compact} {form.symbol || "tokens"}
                  </span>
                ) : (
                  <span className="text-xs text-[color:var(--bereal-text-muted)]">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={state.submitting || state.verifying || !address || !isWorldIDVerified}
            className="rounded-lg bg-[color:var(--bereal-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[color:var(--bereal-primary-dark)] disabled:opacity-50"
          >
            {state.submitting ? "Creating..." : state.verifying ? "Verifying..." : "Create Token"}
          </button>
          {state.error ? (
            <p className="text-sm text-[color:var(--bereal-danger)]">{state.error}</p>
          ) : null}
        </div>

        {state.verifying && (
          <div className="rounded-lg border border-[color:var(--bereal-accent)] bg-[color:var(--bereal-surface)] p-3 text-xs text-[color:var(--bereal-text-secondary)]">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--bereal-accent)] border-t-transparent"></div>
              <span>Verifying token creation and checking balance...</span>
            </div>
          </div>
        )}

        {state.verified && state.tokenBalance && (
          <div className="rounded-lg border border-[color:var(--bereal-success)] bg-[color:var(--bereal-surface)] p-3 text-xs">
            <div className="flex items-center gap-2 text-[color:var(--bereal-success)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Token verified successfully!</span>
            </div>
            <div className="mt-2 text-[color:var(--bereal-text-secondary)]">
              Balance: <span className="font-mono text-[color:var(--bereal-success)]">{state.tokenBalance}</span>
            </div>
            <div className="mt-1 text-[color:var(--bereal-text-muted)]">
              Redirecting to auction creation...
            </div>
          </div>
        )}

        {state.predictedAddress && !state.verified ? (
          <div className="rounded-lg border border-[color:var(--bereal-accent)] bg-[color:var(--bereal-surface)] p-3 text-xs text-[color:var(--bereal-text-secondary)]">
            <div>
              Predicted token address: <span className="font-mono text-[color:var(--bereal-text-primary)]">{state.predictedAddress}</span>
            </div>
          </div>
        ) : null}

        {state.txHash ? (
          <div className="rounded-lg border border-[color:var(--bereal-success)] bg-[color:var(--bereal-surface)] p-3 text-xs text-[color:var(--bereal-text-secondary)]">
            <div>
              Tx hash: <span className="font-mono text-[color:var(--bereal-text-primary)]">{state.txHash}</span>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
