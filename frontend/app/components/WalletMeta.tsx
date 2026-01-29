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
    <div className="rounded-xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4 text-sm text-[color:var(--bereal-text-secondary)]">
      <div className="mb-2 font-semibold text-[color:var(--bereal-text-primary)]">Wallet metadata</div>
      {meta ? (
        <dl className="space-y-1">
          <div className="flex justify-between">
            <dt className="text-[color:var(--bereal-text-muted)]">Address</dt>
            <dd className="font-mono text-xs">{meta.address}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[color:var(--bereal-text-muted)]">Chain ID</dt>
            <dd>{meta.chainId ?? "unknown"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[color:var(--bereal-text-muted)]">Connector</dt>
            <dd>{meta.connector}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[color:var(--bereal-text-muted)]">Connected at</dt>
            <dd>{new Date(meta.connectedAt).toLocaleString()}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-[color:var(--bereal-text-muted)]">No wallet metadata saved yet.</p>
      )}
    </div>
  );
}
