"use client";

import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";

type Props = {
  walletAddress?: string;
  onSuccess: () => void;
  onVerify: (proof: ISuccessResult) => Promise<void>;
};

export function WorldIDSection({ walletAddress, onSuccess, onVerify }: Props) {
  return (
    <div className="rounded-xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4 text-[color:var(--bereal-text-primary)]">
      <p className="mb-2 text-sm font-semibold text-[color:var(--bereal-text-primary)]">
        World ID Verification
      </p>
      <IDKitWidget
        app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`}
        action={process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID as `app_${string}`}
        onSuccess={onSuccess}
        handleVerify={onVerify}
        verification_level={VerificationLevel.Orb}
        signal={walletAddress}
      >
        {({ open }) => (
          <button
            className="rounded-lg bg-[color:var(--bereal-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[color:var(--bereal-primary-dark)]"
            onClick={open}
          >
            Verify with World ID
          </button>
        )}
      </IDKitWidget>
    </div>
  );
}
