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
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
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
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
            onClick={open}
          >
            Verify with World ID
          </button>
        )}
      </IDKitWidget>
    </div>
  );
}
