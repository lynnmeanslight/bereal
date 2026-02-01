type AdvancedSettingsProps = {
  startBlock: string;
  endBlock: string;
  claimBlock: string;
  tickSpacing: string;
  onChange: (key: "tickSpacing", value: string) => void;
};

export function AdvancedSettingsSection({
  startBlock,
  endBlock,
  claimBlock,
  tickSpacing,
  onChange,
}: AdvancedSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[--bereal-text-primary]">Start Block</span>
          <input
            value={startBlock}
            readOnly
            className="w-full rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-4 py-2.5 text-sm text-[--bereal-text-primary] outline-none transition-all"
            placeholder="Auto-calculated"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[--bereal-text-primary]">End Block</span>
          <input
            value={endBlock}
            readOnly
            className="w-full rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-4 py-2.5 text-sm text-[--bereal-text-primary] outline-none transition-all"
            placeholder="Auto-calculated"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[--bereal-text-primary]">Claim Block</span>
          <input
            value={claimBlock}
            readOnly
            className="w-full rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-4 py-2.5 text-sm text-[--bereal-text-primary] outline-none transition-all"
            placeholder="Auto-calculated"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[--bereal-text-primary]">Tick Spacing</span>
        <input
          value={tickSpacing}
          onChange={(e) => onChange("tickSpacing", e.target.value)}
          className="w-full rounded-lg border-2 border-[--bereal-border] bg-[--bereal-bg] px-4 py-2.5 text-sm text-[--bereal-text-primary] outline-none transition-all focus:border-[--bereal-primary] focus:ring-[--bereal-primary]/20"
          placeholder="e.g. 0.001"
          required
        />
      </label>

    </div>
  );
}
