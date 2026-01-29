"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

export type TokenBalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; symbol: string; decimals: number; balance: string };

export function useTokenBalance(address?: string, tokenAddress?: string) {
  const [state, setState] = useState<TokenBalanceState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      const token = (tokenAddress ?? "").trim();
      if (!address || !token || !ethers.isAddress(token)) {
        setState({ status: "idle" });
        return;
      }
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setState({ status: "error", message: "No injected wallet found" });
        return;
      }

      try {
        setState({ status: "loading" });
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const erc20Abi = [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function symbol() view returns (string)",
        ];
        const contract = new ethers.Contract(token, erc20Abi, provider);
        const [rawBalance, decimals, symbol] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
          contract.symbol(),
        ]);

        if (cancelled) return;

        const balance = ethers.formatUnits(rawBalance, decimals);
        setState({
          status: "success",
          symbol: String(symbol),
          decimals: Number(decimals),
          balance,
        });
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to load balance";
        setState({ status: "error", message });
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [address, tokenAddress]);

  return state;
}
