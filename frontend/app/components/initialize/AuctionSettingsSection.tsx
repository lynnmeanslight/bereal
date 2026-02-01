import { ethers } from "ethers";

type AuctionSettingsProps = {
  currency: string;
  tokensRecipient: string;
  fundsRecipient: string;
  floorPrice: string;
  requiredCurrencyRaised: string;
  onChange: (key: "currency" | "tokensRecipient" | "fundsRecipient" | "floorPrice" | "requiredCurrencyRaised", value: string) => void;
  address?: string;
};

export function AuctionSettingsSection({
  currency,
  tokensRecipient,
  fundsRecipient,
  floorPrice,
  requiredCurrencyRaised,
  onChange,
  address,
}: AuctionSettingsProps) {
  const isEth = !currency || currency === ethers.ZeroAddress;
  const canAutoFill = Boolean(address);
  const isTokensAuto = Boolean(address && tokensRecipient === address);
  const isFundsAuto = Boolean(address && fundsRecipient === address);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="block text-sm font-medium text-[color:var(--bereal-text-primary)]">
          Payment Currency
        </span>
        <div className="inline-flex rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-1">
          <button
            type="button"
            onClick={() => onChange("currency", ethers.ZeroAddress)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isEth
                ? "bg-[color:var(--bereal-primary)] text-white"
                : "text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]"
            }`}
          >
            ETH
          </button>
          <button
            type="button"
            onClick={() => onChange("currency", isEth ? "" : currency)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              !isEth
                ? "bg-[color:var(--bereal-primary)] text-white"
                : "text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]"
            }`}
          >
            Custom
          </button>
        </div>

        {!isEth && (
          <input
            value={currency}
            onChange={(e) => onChange("currency", e.target.value)}
            className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
            placeholder="0x..."
            required
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <span className="block text-sm font-medium text-[color:var(--bereal-text-primary)]">
            Tokens Recipient
          </span>
          <div className="inline-flex rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-1">
            <button
              type="button"
              onClick={() => address && onChange("tokensRecipient", address)}
              disabled={!canAutoFill}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isTokensAuto
                  ? "bg-[color:var(--bereal-primary)] text-white"
                  : "text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]"
              } ${!canAutoFill ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              My Wallet
            </button>
            <button
              type="button"
              onClick={() => onChange("tokensRecipient", isTokensAuto ? "" : tokensRecipient)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isTokensAuto
                  ? "bg-[color:var(--bereal-primary)] text-white"
                  : "text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]"
              }`}
            >
              Custom
            </button>
          </div>

          {!isTokensAuto && (
            <input
              value={tokensRecipient}
              onChange={(e) => onChange("tokensRecipient", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
              placeholder="0x..."
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-[color:var(--bereal-text-primary)]">
            Funds Recipient
          </span>
          <div className="inline-flex rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-1">
            <button
              type="button"
              onClick={() => address && onChange("fundsRecipient", address)}
              disabled={!canAutoFill}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isFundsAuto
                  ? "bg-[color:var(--bereal-primary)] text-white"
                  : "text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]"
              } ${!canAutoFill ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              My Wallet
            </button>
            <button
              type="button"
              onClick={() => onChange("fundsRecipient", isFundsAuto ? "" : fundsRecipient)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isFundsAuto
                  ? "bg-[color:var(--bereal-primary)] text-white"
                  : "text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]"
              }`}
            >
              Custom
            </button>
          </div>

          {!isFundsAuto && (
            <input
              value={fundsRecipient}
              onChange={(e) => onChange("fundsRecipient", e.target.value)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
              placeholder="0x..."
              required
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
            Floor Price
          </span>
          <input
            value={floorPrice}
            onChange={(e) => onChange("floorPrice", e.target.value)}
            className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
            placeholder="e.g. 0.01"
            inputMode="decimal"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
            Min Currency Raised
          </span>
          <input
            type="text"
            value={requiredCurrencyRaised}
            onChange={(e) => onChange("requiredCurrencyRaised", e.target.value)}
            className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
            placeholder="e.g. 0.5"
            inputMode="decimal"
            required
          />
        </label>
      </div>
    </div>
  );
}
