"use client";

import { ISuccessResult } from "@worldcoin/idkit";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { ethers } from "ethers";
import { LandingPage } from "./components/LandingPage";
import { CreatorFlow } from "./components/CreatorFlow";
import { BidderFlow } from "./components/BidderFlow";

type AppView = "landing" | "creator" | "bidder";

export default function Home() {
  const router = useRouter();
  const { address, connector, status } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();
  const [view, setView] = useState<AppView>("landing");
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const injectedConnector =
    connectors.find((item) => item.id === "injected") ||
    connectors.find((item) => item.type === "injected");


  const [walletMeta, setWalletMeta] = useState<{
    address: string;
    chainId: number | null;
    connector: string;
    connectedAt: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      if (status !== "connected" || !address) {
        setEthBalance(null);
        setBalanceError(null);
        setIsBalanceLoading(false);
        return;
      }

      if (typeof window === "undefined" || !(window as any).ethereum) {
        setBalanceError("No injected wallet found");
        setIsBalanceLoading(false);
        return;
      }

      try {
        setIsBalanceLoading(true);
        const provider = new ethers.JsonRpcProvider("https://sepolia.unichain.org");
        const raw = await provider.getBalance(address);
        if (cancelled) return;
        setEthBalance(ethers.formatEther(raw));
        setBalanceError(null);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to fetch balance";
        setBalanceError(message);
      } finally {
        if (!cancelled) setIsBalanceLoading(false);
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [status, address]);
  

  useEffect(() => {
    const stored = localStorage.getItem("wallet-meta");
    if (stored) {
      setWalletMeta(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (address && connector) {
      const meta = {
        address,
        chainId: chainId ?? null,
        connector: connector.name,
        connectedAt: new Date().toISOString(),
      };
      setWalletMeta(meta);
      localStorage.setItem("wallet-meta", JSON.stringify(meta));
    }
  }, [address, chainId, connector]);

  const handleInjectedConnect = async () => {
    if (!injectedConnector) {
      throw new Error("Injected wallet connector missing");
    }
    await connectAsync({ connector: injectedConnector });
  };

  const handleWalletDisconnect = async () => {
    await disconnectAsync();
    setWalletMeta(null);
    localStorage.removeItem("wallet-meta");
  };

  const handleVerify = async (proof: ISuccessResult) => {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    });

    if (!res.ok) {
      throw new Error("Verification failed.");
    }
  };

  const onSuccess = () => {
    router.push("/success");
  };

  const walletAddress = address ?? undefined;

  // Wallet widget - always visible
  const WalletWidget = () => (
    <div className="fixed right-6 top-6 z-50">
      <div className="rounded-xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-3 shadow-lg">
        {walletAddress ? (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium text-[color:var(--bereal-text-primary)]">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              <div className="text-xs text-[color:var(--bereal-text-secondary)]">
                Chain: {chainId ?? "?"}
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--bereal-text-secondary)]">
                {isBalanceLoading && "Balance: Loading..."}
                {!isBalanceLoading && balanceError && `Balance error: ${balanceError}`}
                {!isBalanceLoading && !balanceError && ethBalance &&
                  `Balance: ${Number(ethBalance).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })} ETH`}
                {!isBalanceLoading && !balanceError && !ethBalance && "Balance: --"}
              </div>
            </div>
            <button
              onClick={handleWalletDisconnect}
              disabled={isDisconnecting}
              className="rounded-lg bg-[color:var(--bereal-danger)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[color:var(--bereal-danger-dark)]"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleInjectedConnect}
            disabled={isPending}
            className="rounded-lg bg-[color:var(--bereal-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--bereal-primary-dark)]"
          >
            {isPending ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <WalletWidget />
      {view === "landing" && (
        <LandingPage onSelectRole={(role) => setView(role)} />
      )}
      {view === "creator" && (
        <CreatorFlow
          address={walletAddress}
          chainId={chainId ?? undefined}
          onBack={() => setView("landing")}
        />
      )}
      {view === "bidder" && (
        <BidderFlow
          address={walletAddress}
          onBack={() => setView("landing")}
        />
      )}
    </>
  );
}
