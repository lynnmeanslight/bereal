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
  totalSupply: "1000000000000000000000000000", // 1,000,000,000 tokens @18 decimals
  recipient: "",
  creator: "",
  homeChainId: "",
  description: "A programmable super UERC20 token",
  website: "https://en.wikipedia.org/wiki/Myanmar",
  image: "https://asiantrails.b-cdn.net/wp-content/uploads/2020/06/bagan-zone-temple-view.jpg",
  salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

export function CreateTokenForm({ address, chainId }: Props) {
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

      const totalSupply = BigInt(form.totalSupply);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create token";
      setState({ submitting: false, error: message });
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Create UERC20 Token
          </p>
          <p className="text-xs text-zinc-500">
            Deploy a Super UERC20 via the factory. Values are raw units (wei) and should include decimals.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200">
          Requires connected wallet
        </span>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Factory address</span>
            <input
              value={form.factoryAddress}
              onChange={(e) => updateField("factoryAddress", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Factory contract address"
              required
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Salt (bytes32)</span>
            <input
              value={form.salt}
              onChange={(e) => updateField("salt", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Randomize for unique address"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Name</span>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. My Super Token"
              required
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Symbol</span>
            <input
              value={form.symbol}
              onChange={(e) => updateField("symbol", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. MSUP"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Decimals</span>
            <input
              value={form.decimals}
              onChange={(e) => updateField("decimals", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="18"
              required
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Total supply (raw)</span>
            <input
              value={form.totalSupply}
              onChange={(e) => updateField("totalSupply", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="e.g. 1000000000000000000000000"
              required
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Home chain ID</span>
            <input
              value={form.homeChainId || (chainId ? String(chainId) : "")}
              onChange={(e) => updateField("homeChainId", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Defaults to connected chain"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Recipient</span>
            <input
              value={form.recipient || address || ""}
              onChange={(e) => updateField("recipient", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Defaults to your address"
              required
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Creator</span>
            <input
              value={form.creator || address || ""}
              onChange={(e) => updateField("creator", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Defaults to your address"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Description</span>
            <input
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Short description"
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Website</span>
            <input
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="https://example.com"
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="mb-1 block text-xs font-medium text-zinc-500">Image URL</span>
            <input
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="https://example.com/logo.png"
            />
          </label>
        </div>

        <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
          <div className="flex justify-between">
            <span>Connected</span>
            <span>{address ?? "Not connected"}</span>
          </div>
          <div className="flex justify-between">
            <span>Chain ID</span>
            <span>{chainId ?? "?"}</span>
          </div>
          {form.totalSupply ? (
            <div className="flex justify-between">
              <span>Total supply (compact)</span>
              <span>{formatCompact(form.totalSupply)}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={state.submitting || !address}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {state.submitting ? "Creating..." : "Create Token"}
          </button>
          {state.error ? (
            <p className="text-sm text-red-500">{state.error}</p>
          ) : null}
        </div>

        {state.predictedAddress ? (
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-100">
            <div>Predicted token address: {state.predictedAddress}</div>
          </div>
        ) : null}

        {state.txHash ? (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
            <div>Tx hash: {state.txHash}</div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
