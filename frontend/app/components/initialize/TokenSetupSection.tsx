"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCompact } from "../../lib/format";

export type TokenBalanceState = {
  status: "idle" | "loading" | "error" | "success";
  balance?: string;
  symbol?: string;
  decimals?: number;
  message?: string;
};

export type SupplyPreview = {
  label?: string;
  detail?: string;
  error?: boolean;
};

type TokenFormType = {
  name: string;
  symbol: string;
  decimals: string;
  humanTotalSupply: string;
  recipient: string;
  creator: string;
  homeChainId: string;
  description: string;
  website: string;
  image: string;
  salt: string;
};

export type TokenSetupProps = {
  address?: string;
  chainId?: number;
  createNewToken: boolean;
  onCreateNewTokenChange: (value: boolean) => void;
  tokenAddress: string;
  onTokenAddressChange: (value: string) => void;
  tokenBalanceState: TokenBalanceState;
  tokenForm: TokenFormType;
  onTokenFieldChange: (key: keyof TokenFormType, value: string) => void;
  lowDecimalConfirmed: boolean;
  onLowDecimalConfirmedChange: (value: boolean) => void;
  humanAuctionSupply: string;
  onHumanAuctionSupplyChange: (value: string) => void;
  tokenDecimals: number;
  supplyPreview: SupplyPreview;
  onSupplyFromPercent: (percent: number) => void;
};

type WalletToken = {
  address: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  balance?: string;
};

export function TokenSetupSection({
  address,
  chainId,
  createNewToken,
  onCreateNewTokenChange,
  tokenAddress,
  onTokenAddressChange,
  tokenBalanceState,
  tokenForm,
  onTokenFieldChange,
  lowDecimalConfirmed,
  onLowDecimalConfirmedChange,
  humanAuctionSupply,
  onHumanAuctionSupplyChange,
  tokenDecimals,
  supplyPreview,
  onSupplyFromPercent,
}: TokenSetupProps) {
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);

  const formatAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  useEffect(() => {
    if (!address || !chainId || createNewToken) {
      setWalletTokens([]);
      setTokensError(null);
      setTokensLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setTokensLoading(true);
      setTokensError(null);
      try {
        const res = await fetch(
          `/api/tokens?address=${address}&chainId=${chainId}`,
        );
        if (!res.ok) {
          throw new Error("Failed to load tokens");
        }
        const data = await res.json();
        if (!cancelled) {
          setWalletTokens(Array.isArray(data.tokens) ? data.tokens : []);
        }
      } catch (e) {
        if (!cancelled) {
          setTokensError("Unable to load tokens");
        }
      } finally {
        if (!cancelled) {
          setTokensLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [address, chainId, createNewToken]);

  const tokenOptions = useMemo(() => {
    return walletTokens.map((token) => {
      const label = token.symbol || token.name || formatAddress(token.address);
      const balance = token.balance ? formatCompact(token.balance) : undefined;
      return {
        value: token.address,
        label: balance ? `${label} • ${balance}` : label,
      };
    });
  }, [walletTokens]);

  return (
    <div className="space-y-4">
      {tokenOptions.length > 0 && !createNewToken && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
            Select Token
          </span>
          <select
            value={tokenAddress}
            onChange={(e) => onTokenAddressChange(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
          >
            <option value="">Select a token</option>
            {tokenOptions.map((token) => (
              <option key={token.value} value={token.value}>
                {token.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
          Token Address
        </span>
        <input
          value={tokenAddress}
          onChange={(e) => onTokenAddressChange(e.target.value)}
          className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
          placeholder="0x..."
          required
        />
        {tokensLoading && (
          <p className="mt-1.5 text-xs text-[color:var(--bereal-text-secondary)]">
            Loading tokens...
          </p>
        )}
        {tokensError && (
          <p className="mt-1.5 text-xs text-[color:var(--bereal-danger)]">
            {tokensError}
          </p>
        )}
        {tokenBalanceState.status === "loading" && (
          <p className="mt-1.5 text-xs text-[color:var(--bereal-text-secondary)]">Loading...</p>
        )}
        {tokenBalanceState.status === "error" && (
          <p className="mt-1.5 text-xs text-[color:var(--bereal-danger)]">
            {tokenBalanceState.message}
          </p>
        )}
        {tokenBalanceState.status === "success" && (
          <p className="mt-1.5 text-xs text-[color:var(--bereal-text-secondary)]">
            Balance: {formatCompact(tokenBalanceState.balance || "0")} {tokenBalanceState.symbol}
          </p>
        )}
        {tokenBalanceState.status === "success" && (tokenBalanceState.decimals ?? 18) < 6 && (
          <p className="mt-1.5 text-xs text-[color:var(--bereal-warning)]">
            Low decimals ({tokenBalanceState.decimals}) may cause rounding issues
          </p>
        )}
      </label>

      {tokenBalanceState.status === "success" && (tokenBalanceState.decimals ?? 18) < 6 && (
        <label className="flex items-center gap-2 text-xs text-[color:var(--bereal-text-secondary)]">
          <input
            type="checkbox"
            checked={lowDecimalConfirmed}
            onChange={(e) => onLowDecimalConfirmedChange(e.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--bereal-border)] text-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
          />
          I understand the risks
        </label>
      )}

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-[color:var(--bereal-text-primary)]">
            Auction Supply
          </span>
          {tokenBalanceState.status === "success" && (
            <div className="flex gap-1.5">
              <button
                type="button"
                className="rounded px-2 py-0.5 text-xs font-medium text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)] hover:text-[color:var(--bereal-text-primary)]"
                onClick={() => onSupplyFromPercent(100)}
              >
                Max
              </button>
              <button
                type="button"
                className="rounded px-2 py-0.5 text-xs font-medium text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)] hover:text-[color:var(--bereal-text-primary)]"
                onClick={() => onSupplyFromPercent(80)}
              >
                80%
              </button>
              <button
                type="button"
                className="rounded px-2 py-0.5 text-xs font-medium text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)] hover:text-[color:var(--bereal-text-primary)]"
                onClick={() => onSupplyFromPercent(50)}
              >
                50%
              </button>
            </div>
          )}
        </div>
        <input
          value={humanAuctionSupply}
          onChange={(e) => onHumanAuctionSupplyChange(e.target.value)}
          className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
          placeholder="e.g. 1,000,000"
          required
        />
     
      </label>
    </div>
  );
}
