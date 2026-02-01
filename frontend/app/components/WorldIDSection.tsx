"use client";

import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

type Props = {
  walletAddress?: string;
  action?: string;
  chainId?: number;
  error?: string | null;
  onSuccess?: (alreadyVerified?: boolean) => void;
  onFailure?: () => void;
};

export function WorldIDSection({ walletAddress, action, chainId, error, onSuccess, onFailure }: Props) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async (proof: ISuccessResult) => {
    setLocalError(null);
    setSubmitting(true);
    const resolvedAction =
      (action as string) || process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID || "";

    // Short-circuit if this wallet is already verified for this action/chain
    if (walletAddress && chainId) {
      const params = new URLSearchParams({
        walletAddress,
        action: resolvedAction,
        chainId: String(chainId),
      });
      const statusRes = await fetch(`/api/verify/store?${params.toString()}`);
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (status?.verified) {
          onSuccess?.(true); // Pass true to indicate already verified
          setSubmitting(false);
          return;
        }
      }
    }

    const nullifierHash = proof.nullifier_hash || (proof as any)?.nullifierHash;

    if (!nullifierHash) {
      setLocalError("Missing nullifier hash from World ID proof.");
      onFailure?.();
      setSubmitting(false);
      return;
    }

    if (walletAddress) {
      const checkParams = new URLSearchParams({ nullifierHash });
      const existingRes = await fetch(`/api/verify/store?${checkParams.toString()}`);
      
      if (existingRes.ok) {
        const existing = await existingRes.json();
        if (existing?.exists && existing.walletAddress) {
          const linked = String(existing.walletAddress).toLowerCase();
          if (linked !== walletAddress.toLowerCase()) {
            setLocalError(
              `⚠️ This World ID is already verified by another wallet (${existing.walletAddress.slice(0, 6)}...${existing.walletAddress.slice(-4)}). Each human can only verify once.`
            );
            onFailure?.();
            setSubmitting(false);
            return;
          }
        }
      }
    }
    
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    });

    if (!res.ok) {
      setLocalError("Verification failed.");
      onFailure?.();
      setSubmitting(false);
      return;
    }

    if (walletAddress && chainId) {
      const storeRes = await fetch("/api/verify/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          chainId,
          action: resolvedAction,
          proof,
        }),
      });

      if (!storeRes.ok) {
        const data = await storeRes.json().catch(() => ({}));
        
        // Check if it's a duplicate proof error
        if (storeRes.status === 409 || (data as any)?.reused) {
          setLocalError(
            "⚠️ This World ID proof has already been used. Each person can only verify once per platform."
          );
        } else {
          const message =
            (data as { message?: string; error?: string })?.message ||
            (data as { message?: string; error?: string })?.error ||
            `Verification failed with status ${storeRes.status}`;
          setLocalError(message);
        }
        
        onFailure?.();
        setSubmitting(false);
        return;
      }
    }

    onSuccess?.(false); // Pass false to indicate new verification
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-[color:var(--bereal-border)] bg-gradient-to-br from-[color:var(--bereal-surface)] to-[color:var(--bereal-surface-hover)] p-5 text-[color:var(--bereal-text-primary)] shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
            Prove you’re human
          </p>
          <p className="text-xs text-[color:var(--bereal-text-secondary)]">
            Verify once to create or bid—fast, privacy-preserving, no wallet info shown.
          </p>
        </div>
        {submitting ? (
          <span className="rounded-full bg-[color:var(--bereal-border)] px-3 py-1 text-[11px] text-[color:var(--bereal-text-secondary)]">
            Verifying…
          </span>
        ) : null}
      </div>
      {error || localError ? (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-[color:var(--bereal-danger)]/10 border border-[color:var(--bereal-danger)]/30 px-3 py-2.5 text-xs">
          <AlertTriangle className="h-4 w-4 text-[color:var(--bereal-danger)] shrink-0 mt-0.5" />
          <div className="flex-1 text-[color:var(--bereal-danger)]">
            {localError || error}
          </div>
        </div>
      ) : null}
      <IDKitWidget
        app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
        action={(action as `app_${string}`) || (process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID as `app_${string}`)}
        onSuccess={() => {
          // IDKit close callback; prefer server-verified success callback above
          onSuccess?.();
        }}
        handleVerify={handleVerify}
        verification_level={VerificationLevel.Orb}
      >
        {({ open }) => (
          <button
            className="w-full rounded-lg bg-[color:var(--bereal-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-[1px] hover:bg-[color:var(--bereal-primary-dark)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/30 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={open}
            disabled={submitting}
          >
            {submitting ? "Verifying…" : "Verify with World ID"}
          </button>
        )}
      </IDKitWidget>
    </div>
  );
}
