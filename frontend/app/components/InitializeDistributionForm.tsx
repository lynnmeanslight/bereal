"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { AuctionParameters } from "../lib/types";
import { initializeDistribution } from "../services/initializeDistribution";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { formatCompact } from "../lib/format";

const defaultForm = {
  tokenAddress: "",
  totalAuctionSupply: "",
  currency: "",
  tokensRecipient: "",
  fundsRecipient: "",
  startBlock: "",
  endBlock: "",
  claimBlock: "",
  tickSpacing: "1",
  validationHook: "0x0000000000000000000000000000000000000000",
  floorPrice: "0",
  requiredCurrencyRaised: "0",
  auctionStepsData: "0x",
};

type Props = {
  address?: string;
  chainId?: number;
};

type SubmitState = {
  submitting: boolean;
  txHash?: string;
  auctionAddress?: string;
  error?: string;
};

export function InitializeDistributionForm({ address, chainId }: Props) {
  const [initForm, setInitForm] = useState(defaultForm);
  const [submitState, setSubmitState] = useState<SubmitState>({ submitting: false });
  const tokenBalanceState = useTokenBalance(address, initForm.tokenAddress);

  const updateField = (key: keyof typeof initForm, value: string) => {
    setInitForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseBigInt = (label: string, value: string) => {
    if (!value) throw new Error(`${label} is required`);
    return BigInt(value);
  };

  const handleInitializeDistribution = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!address) {
      setSubmitState({ submitting: false, error: "Connect your wallet first" });
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setSubmitState({ submitting: false, error: "No injected wallet found" });
      return;
    }

    try {
      setSubmitState({ submitting: true });

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const auctionParams: AuctionParameters = {
        currency: initForm.currency,
        tokensRecipient: initForm.tokensRecipient,
        fundsRecipient: initForm.fundsRecipient,
        startBlock: parseBigInt("Start block", initForm.startBlock),
        endBlock: parseBigInt("End block", initForm.endBlock),
        claimBlock: parseBigInt("Claim block", initForm.claimBlock),
        tickSpacing: parseBigInt("Tick spacing", initForm.tickSpacing),
        validationHook: initForm.validationHook,
        floorPrice: parseBigInt("Floor price", initForm.floorPrice),
        requiredCurrencyRaised: parseBigInt(
          "Required currency raised",
          initForm.requiredCurrencyRaised,
        ),
        auctionStepsData: initForm.auctionStepsData as `0x${string}`,
      };

      const { txHash, auctionAddress } = await initializeDistribution(
        signer,
        initForm.tokenAddress,
        parseBigInt("Total auction supply", initForm.totalAuctionSupply),
        auctionParams,
      );

      setSubmitState({ submitting: false, txHash, auctionAddress });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSubmitState({ submitting: false, error: message });
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Initialize Distribution
          </p>
          <p className="text-xs text-zinc-500">
            Submit parameters to ContinuousClearingAuctionFactory. Values are
            raw units (wei/blocks) and should already include decimals.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200">
          Requires connected wallet
        </span>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleInitializeDistribution}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Token address
            </span>
            <input
              value={initForm.tokenAddress}
              onChange={(e) => updateField("tokenAddress", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="0x..."
              required
            />
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {tokenBalanceState.status === "idle" &&
                "Enter an ERC20 address to fetch your balance"}
              {tokenBalanceState.status === "loading" && "Fetching balance..."}
              {tokenBalanceState.status === "error" && (
                <span className="text-red-500">{tokenBalanceState.message}</span>
              )}
              {tokenBalanceState.status === "success" && (
                <span className="text-emerald-600 dark:text-emerald-300">
                  Balance: {formatCompact(tokenBalanceState.balance)} {tokenBalanceState.symbol}
                  <span className="ml-1 text-[11px] text-zinc-500">
                    ({tokenBalanceState.balance})
                  </span>
                </span>
              )}
            </div>
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Total auction supply (raw)
            </span>
            <input
              value={initForm.totalAuctionSupply}
              onChange={(e) => updateField("totalAuctionSupply", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 1000000000000000000"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Currency (token address or 0x0 for ETH)
            </span>
            <input
              value={initForm.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="0x..."
              required
            />
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Validation hook (optional)
            </span>
            <input
              value={initForm.validationHook}
              onChange={(e) => updateField("validationHook", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="0x000..."
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Tokens recipient
            </span>
            <input
              value={initForm.tokensRecipient}
              onChange={(e) => updateField("tokensRecipient", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="0x..."
              required
            />
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Funds recipient
            </span>
            <input
              value={initForm.fundsRecipient}
              onChange={(e) => updateField("fundsRecipient", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="0x..."
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Start block
            </span>
            <input
              value={initForm.startBlock}
              onChange={(e) => updateField("startBlock", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 123456"
              required
            />
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              End block
            </span>
            <input
              value={initForm.endBlock}
              onChange={(e) => updateField("endBlock", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 123556"
              required
            />
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Claim block
            </span>
            <input
              value={initForm.claimBlock}
              onChange={(e) => updateField("claimBlock", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 123600"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Tick spacing
            </span>
            <input
              value={initForm.tickSpacing}
              onChange={(e) => updateField("tickSpacing", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 1"
              required
            />
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Floor price (raw)
            </span>
            <input
              value={initForm.floorPrice}
              onChange={(e) => updateField("floorPrice", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 100000000000000"
              required
            />
          </label>

          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Required currency raised (raw)
            </span>
            <input
              value={initForm.requiredCurrencyRaised}
              onChange={(e) => updateField("requiredCurrencyRaised", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 100000000000000"
              required
            />
          </label>
        </div>

        <label className="text-sm text-zinc-600 dark:text-zinc-300">
          <span className="mb-1 block text-xs font-medium text-zinc-500">
            Auction steps data (bytes)
          </span>
          <textarea
            value={initForm.auctionStepsData}
            onChange={(e) => updateField("auctionStepsData", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            rows={3}
            placeholder="0x..."
            required
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            Connected: {address ?? "Not connected"} | Chain ID: {chainId ?? "?"}
          </div>
          <button
            type="submit"
            disabled={submitState.submitting || !address}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitState.submitting ? "Submitting..." : "Initialize"}
          </button>
        </div>

        {submitState.error ? (
          <p className="text-sm text-red-500">{submitState.error}</p>
        ) : null}
        {submitState.txHash ? (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
            <div>Tx hash: {submitState.txHash}</div>
            {submitState.auctionAddress ? (
              <div>Auction address: {submitState.auctionAddress}</div>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
