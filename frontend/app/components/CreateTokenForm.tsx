"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ethers } from "ethers";
import { createUSUPERC20 } from "../services/createToken";
import { UERC20Metadata } from "../lib/types";
import { USUPERC20_FACTORY_ABI } from "../lib/abis/USUPERC20_FACTORY_ABI";
import { USUPERC20_FACTORY_ADDRESS } from "../lib/constants";
import { formatCompact } from "../lib/format";

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
};

const defaultForm = {
  factoryAddress: USUPERC20_FACTORY_ADDRESS,
  name: "My Super Token",
  symbol: "MSUP",
  decimals: "18",
  humanSupply: "1,000,000,000", // human-readable total supply
  recipient: "",
  creator: "",
  homeChainId: "",
  description: "A programmable super UERC20 token",
  website: "https://example.com",
  image: "https://example.com/logo.png",
  salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

export function CreateTokenForm({ address, chainId, onSuccess }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [state, setState] = useState<SubmitState>({ submitting: false });

  // Auto-fill wallet-dependent defaults when available (without overwriting user edits).
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      recipient: prev.recipient || address || "",
      creator: prev.creator || address || "",
      homeChainId: prev.homeChainId || (chainId ? String(chainId) : ""),
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
      const homeChainId = BigInt(form.homeChainId || chainId || 0);
      const creator = form.creator || address;
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
        form.recipient,
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "address", "tuple(string description,string website,string image)"],
          [homeChainId, creator, metadata],
        ),
        salt,
      );

      const receipt = await createUSUPERC20(signer, form.factoryAddress, {
        name: form.name,
        symbol: form.symbol,
        decimals: decimalsNum,
        totalSupply,
        recipient: form.recipient,
        creator,
        homeChainId,
        metadata,
        salt,
      });

      setState({
        submitting: false,
        txHash: receipt?.hash,
        predictedAddress,
      });
      
      // Call onSuccess callback with the predicted token address
      if (onSuccess && predictedAddress) {
        onSuccess(predictedAddress);
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
      supplyPreview = { raw, compact: formatCompact(raw.toString()) };
    } catch (err) {
      supplyPreview = { error: "Invalid supply for given decimals" };
    }
  } else {
    supplyPreview = { error: "Decimals must be 0-255" };
  }

  return (
    <div className="rounded-xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-4 text-[color:var(--bereal-text-primary)]">
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
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Factory address</span>
            <input
              value={form.factoryAddress}
              onChange={(e) => updateField("factoryAddress", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="Factory contract address"
              required
            />
          </label>
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Salt (bytes32)</span>
            <input
              value={form.salt}
              onChange={(e) => updateField("salt", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="Randomize for unique address"
              required
            />
          </label>
        </div>

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

        <div className="grid gap-3 sm:grid-cols-3">
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
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Home chain ID</span>
            <input
              value={form.homeChainId || (chainId ? String(chainId) : "")}
              onChange={(e) => updateField("homeChainId", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="Defaults to connected chain"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Recipient</span>
            <input
              value={form.recipient || address || ""}
              onChange={(e) => updateField("recipient", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="Defaults to your address"
              required
            />
          </label>
          <label className="text-sm text-[color:var(--bereal-text-secondary)]">
            <span className="mb-1 block text-xs font-medium text-[color:var(--bereal-text-secondary)]">Creator</span>
            <input
              value={form.creator || address || ""}
              onChange={(e) => updateField("creator", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--bereal-primary)]"
              placeholder="Defaults to your address"
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

        <div className="rounded-lg bg-[color:var(--bereal-bg)] p-3 text-xs text-[color:var(--bereal-text-secondary)]">
          <div className="flex justify-between">
            <span>Connected</span>
            <span>{address ?? "Not connected"}</span>
          </div>
          <div className="flex justify-between">
            <span>Chain ID</span>
            <span>{chainId ?? "?"}</span>
          </div>
          <div className="mt-2 rounded border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-2">
            <div className="flex justify-between">
              <span>Supply preview</span>
              <span className="font-mono text-[11px] text-[color:var(--bereal-text-secondary)]">
                {form.humanSupply || "0"} @ {form.decimals} decimals
              </span>
            </div>
            {supplyPreview.error ? (
              <div className="text-xs text-[color:var(--bereal-danger)]">{supplyPreview.error}</div>
            ) : supplyPreview.raw !== undefined ? (
              <div className="text-xs text-[color:var(--bereal-text-secondary)]">
                Compact: <span className="text-[color:var(--bereal-success)]">{supplyPreview.compact}</span>
                <div className="font-mono text-[11px] text-[color:var(--bereal-text-muted)] break-all">
                  Raw: {supplyPreview.raw.toString()}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={state.submitting || !address}
            className="rounded-lg bg-[color:var(--bereal-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[color:var(--bereal-primary-dark)] disabled:opacity-50"
          >
            {state.submitting ? "Creating..." : "Create Token"}
          </button>
          {state.error ? (
            <p className="text-sm text-[color:var(--bereal-danger)]">{state.error}</p>
          ) : null}
        </div>

        {state.predictedAddress ? (
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
