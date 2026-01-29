"use client";

import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";
import { ethers } from "ethers";

export default function Home() {
  const router = useRouter();
  const { address, connector, status } = useAccount();
  const chainId = useChainId();
  const {
    connectAsync,
    connectors,
    error: connectError,
    isPending,
  } = useConnect();
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
    router.push("/success"); // ✅ safe
  };

  const walletAddress = address ?? undefined;

  const [initForm, setInitForm] = useState({
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
  });

  const [submitState, setSubmitState] = useState<{
    submitting: boolean;
    txHash?: string;
    auctionAddress?: string;
    error?: string;
  }>({ submitting: false });

  const updateField = (key: keyof typeof initForm, value: string) => {
    setInitForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseBigInt = (label: string, value: string) => {
    if (!value) throw new Error(`${label} is required`);
    return BigInt(value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Wallet status</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {status === "connected" ? "Connected" : "Disconnected"}
            </p>
          </div>
          {status === "connected" ? (
            <button
              onClick={handleWalletDisconnect}
              disabled={isDisconnecting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={handleInjectedConnect}
              disabled={!injectedConnector || isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
          <div className="mb-2 font-semibold">Wallet metadata</div>
          {walletMeta ? (
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Address</dt>
                <dd className="font-mono text-xs">{walletMeta.address}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Chain ID</dt>
                <dd>{walletMeta.chainId ?? "unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Connector</dt>
                <dd>{walletMeta.connector}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Connected at</dt>
                <dd>{new Date(walletMeta.connectedAt).toLocaleString()}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-zinc-500">No wallet metadata saved yet.</p>
          )}
        </div>

        {connectError ? (
          <p className="text-sm text-red-500">{connectError.message}</p>
        ) : null}

        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            World ID Verification
          </p>
          <IDKitWidget
            app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
            action={
              process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID as `app_${string}`
            }
            onSuccess={onSuccess}
            handleVerify={handleVerify}
            verification_level={VerificationLevel.Orb}
            // signal={walletAddress}
          >
            {({ open }) => (
              <button
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                onClick={open}
              >
                Verify with World ID
              </button>
            )}
          </IDKitWidget>
        </div>
      </div>
    </div>
  );
}
