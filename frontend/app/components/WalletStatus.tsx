"use client";

type Props = {
  status: "connected" | "connecting" | "disconnected" | "reconnecting" | "unauthenticated";
  onConnect: () => void | Promise<void>;
  onDisconnect: () => void | Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;
  canConnect: boolean;
};

export function WalletStatus({
  status,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
  canConnect,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-500">Wallet status</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {status === "connected" ? "Connected" : "Disconnected"}
        </p>
      </div>
      {status === "connected" ? (
        <button
          onClick={() => void onDisconnect()}
          disabled={isDisconnecting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isDisconnecting ? "Disconnecting..." : "Disconnect"}
        </button>
      ) : (
        <button
          onClick={() => void onConnect()}
          disabled={!canConnect || isConnecting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
