"use client";

import { ISuccessResult } from "@worldcoin/idkit";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { WalletStatus } from "./components/WalletStatus";
import { WalletMeta } from "./components/WalletMeta";
import { WorldIDSection } from "./components/WorldIDSection";
import { InitializeDistributionForm } from "./components/InitializeDistributionForm";

export default function Home() {
  const router = useRouter();
  const { address, connector, status } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, error: connectError, isPending } =
    useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <WalletStatus
          status={status}
          onConnect={handleInjectedConnect}
          onDisconnect={handleWalletDisconnect}
          isConnecting={isPending}
          isDisconnecting={isDisconnecting}
          canConnect={Boolean(injectedConnector)}
        />

        <WalletMeta meta={walletMeta} />

        {connectError ? (
          <p className="text-sm text-red-500">{connectError.message}</p>
        ) : null}

        <WorldIDSection
          walletAddress={walletAddress}
          onSuccess={onSuccess}
          onVerify={handleVerify}
        />

        <InitializeDistributionForm
          address={walletAddress}
          chainId={chainId ?? undefined}
        />
      </div>
    </div>
  );
}
