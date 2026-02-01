import { useEffect, useState, useCallback } from "react";
import { ISuccessResult } from "@worldcoin/idkit";

type Options = {
  walletAddress?: string;
  action: string;
  chainId?: number;
};

export function useHumanVerification({ walletAddress, action, chainId }: Options) {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!walletAddress || !chainId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        walletAddress,
        action,
        chainId: String(chainId),
      });
      const res = await fetch(`/api/verify/store?${params.toString()}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setVerified(Boolean(data.verified));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check verification");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, action, chainId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const submitProof = useCallback(
    async (proof: ISuccessResult) => {
      if (!walletAddress || !chainId) throw new Error("Missing wallet or chainId");
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/verify/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            chainId,
            action,
            proof,
          }),
        });
        const data = await res.json();
        if (res.status === 409 || data?.reused) {
          const message = data?.message || "World ID proof already used";
          setVerified(false);
          setError(message);
          throw new Error(message);
        }
        if (!res.ok) throw new Error(`Status ${res.status}`);
        setVerified(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to store verification");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, chainId, action],
  );

  return { verified, loading, error, submitProof, refresh: fetchStatus };
}
