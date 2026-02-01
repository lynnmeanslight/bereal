"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { unichainSepolia } from "wagmi/chains";
import { ethers } from "ethers";
import { LandingPage } from "./components/LandingPage";
import { CreatorFlow } from "./components/CreatorFlow";
import { BidderFlow } from "./components/BidderFlow";

type AppView = "landing" | "creator" | "bidder";

const REQUIRED_CHAIN_ID = unichainSepolia.id;

export default function Home() {
  const router = useRouter();
  const { address, connector, status } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [view, setView] = useState<AppView>("landing");
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const injectedConnector =
    connectors.find((item) => item.id === "injected") ||
    connectors.find((item) => item.type === "injected");


  const [walletMeta, setWalletMeta] = useState<{
    address: string;
    chainId: number | null;
    connector: string;
    connectedAt: string;
  } | null>(null);

  // Auto-switch to Unichain Sepolia if connected to wrong network
  useEffect(() => {
    const switchNetwork = async () => {
      if (status === "connected" && chainId && chainId !== REQUIRED_CHAIN_ID) {
        try {
          setNetworkError("Switching to Unichain Sepolia...");
          await switchChainAsync({ chainId: REQUIRED_CHAIN_ID });
          setNetworkError(null);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to switch network";
          setNetworkError(`Please switch to Unichain Sepolia (Chain ID: ${REQUIRED_CHAIN_ID})`);
          console.error("Network switch error:", message);
        }
      } else if (status === "connected" && chainId === REQUIRED_CHAIN_ID) {
        setNetworkError(null);
      }
    };

    switchNetwork();
  }, [status, chainId, switchChainAsync]);

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


  const walletAddress = address ?? undefined;

  // Wallet widget - always visible
  const WalletWidget = () => (
    <div className="fixed right-6 top-6 z-50">
      <div className="rounded-xl border border-(--bereal-border) bg-(--bereal-surface) px-4 py-3 shadow-lg">
        {walletAddress ? (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium text-(--bereal-text-primary)">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              <div className={`text-xs ${chainId === REQUIRED_CHAIN_ID ? "text-(--bereal-success)" : "text-(--bereal-danger)"}`}>
                Chain: {chainId ?? "?"} {chainId === REQUIRED_CHAIN_ID ? "✓" : "⚠️"}
              </div>
              {networkError && (
                <div className="mt-1 text-[11px] text-(--bereal-danger)">
                  {networkError}
                </div>
              )}
              <div className="mt-1 text-[11px] text-(--bereal-text-secondary)">
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
              className="rounded-lg bg-(--bereal-danger) px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--bereal-danger-dark)"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleInjectedConnect}
            disabled={isPending}
            className="rounded-lg bg-(--bereal-primary) px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--bereal-primary-dark)"
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
      
      {/* Wrong network blocking overlay */}
      {status === "connected" && chainId && chainId !== REQUIRED_CHAIN_ID && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-(--bereal-border) bg-(--bereal-surface) p-8 text-center shadow-2xl">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-2xl font-bold text-(--bereal-text-primary)">
              Wrong Network
            </h2>
            <p className="mb-4 text-(--bereal-text-secondary)">
              This app only works on <span className="font-semibold text-(--bereal-accent)">Unichain Sepolia</span>.
            </p>
            <p className="mb-6 text-sm text-(--bereal-text-muted)">
              Chain ID: {REQUIRED_CHAIN_ID}
            </p>
            {isSwitchingChain ? (
              <div className="rounded-lg bg-(--bereal-bg) py-3 text-(--bereal-text-secondary)">
                Switching network...
              </div>
            ) : (
              <button
                onClick={() => switchChainAsync({ chainId: REQUIRED_CHAIN_ID })}
                className="w-full rounded-lg bg-(--bereal-primary) px-6 py-3 font-semibold text-white transition-colors hover:bg-(--bereal-primary-dark)"
              >
                Switch to Unichain Sepolia
              </button>
            )}
          </div>
        </div>
      )}

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
