"use client";

type WalletMetaProps = {
  address: string;
  chainId: number | null;
  connector: string;
  connectedAt: string;
};

type Props = {
  meta: WalletMetaProps | null;
};

export function WalletMeta({ meta }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
      <div className="mb-2 font-semibold">Wallet metadata</div>
      {meta ? (
        <dl className="space-y-1">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Address</dt>
            <dd className="font-mono text-xs">{meta.address}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Chain ID</dt>
            <dd>{meta.chainId ?? "unknown"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Connector</dt>
            <dd>{meta.connector}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Connected at</dt>
            <dd>{new Date(meta.connectedAt).toLocaleString()}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-zinc-500">No wallet metadata saved yet.</p>
      )}
    </div>
  );
}
