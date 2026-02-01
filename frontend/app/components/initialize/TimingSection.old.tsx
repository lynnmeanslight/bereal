import { AlertTriangle } from "lucide-react";

export type TimingSectionProps = {
  avgBlockTime: number;
  currentBlock: number | null;
  startMode: "immediate" | "scheduled";
  onStartModeChange: (value: "immediate" | "scheduled") => void;
  scheduledStart: string;
  onScheduledStartChange: (value: string) => void;
  isStartInPast: boolean;
  durationMode: "preset" | "custom";
  onDurationModeChange: (value: "preset" | "custom") => void;
  durationPresetDays: 1 | 3 | 7;
  onDurationPresetDaysChange: (value: 1 | 3 | 7) => void;
  customEndDate: string;
  onCustomEndDateChange: (value: string) => void;
  isEndBeforeStart: boolean;
  isShortAuction: boolean;
  unlockImmediate: boolean;
  onUnlockImmediateChange: (value: boolean) => void;
  lockupValue: string;
  onLockupValueChange: (value: string) => void;
  lockupUnit: "days" | "hours" | "weeks";
  onLockupUnitChange: (value: "days" | "hours" | "weeks") => void;
  computedStartBlock: string;
  computedEndBlock: string;
  computedClaimBlock: string;
  startAt: Date | null;
  endAt: Date | null;
  claimAt: Date | null;
  now: Date;
  toLocalInputValue: (value: Date) => string;
  formatDateTime: (value: Date | null) => string;
};

export function TimingSection({
  avgBlockTime,
  currentBlock,
  startMode,
  onStartModeChange,
  scheduledStart,
  onScheduledStartChange,
  isStartInPast,
  durationMode,
  onDurationModeChange,
  durationPresetDays,
  onDurationPresetDaysChange,
  customEndDate,
  onCustomEndDateChange,
  isEndBeforeStart,
  isShortAuction,
  unlockImmediate,
  onUnlockImmediateChange,
  lockupValue,
  onLockupValueChange,
  lockupUnit,
  onLockupUnitChange,
  computedStartBlock,
  computedEndBlock,
  computedClaimBlock,
  startAt,
  endAt,
  claimAt,
  now,
  toLocalInputValue,
  formatDateTime,
}: TimingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[--bereal-text-primary]">Step 3: Timing</h3>
        <p className="text-xs text-[--bereal-text-secondary]">
          We convert human time to blocks using an average block time of {avgBlockTime}s.
        </p>
      </div>

      <div className="rounded-lg border-2 border-[--bereal-border] bg-[--bereal-bg] p-4">
        <p className="mb-2 text-sm font-medium text-[--bereal-text-primary]">Start Time</p>
        <div className="flex flex-wrap gap-2">
          {(["immediate", "scheduled"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                startMode === mode
                  ? "bg-[--bereal-primary] text-white"
                  : "bg-[--bereal-surface-hover] text-[--bereal-text-secondary] hover:bg-[--bereal-border]"
              }`}
              onClick={() => onStartModeChange(mode)}
            >
              {mode === "immediate" ? "Start Immediately" : "Schedule"}
            </button>
          ))}
        </div>

        {startMode === "scheduled" ? (
          <div className="mt-3">
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => onScheduledStartChange(e.target.value)}
              min={toLocalInputValue(now)}
              className="w-full rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-4 py-2.5 text-sm text-[--bereal-text-primary] outline-none transition-all focus:border-[--bereal-primary] focus:ring-[--bereal-primary]/20"
            />
            {isStartInPast ? (
              <p className="mt-2 text-xs text-[--bereal-danger]">Start time cannot be in the past.</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 text-xs text-[--bereal-text-secondary]">Start block ≈ #{computedStartBlock || "--"}</div>
      </div>

      <div className="rounded-lg border-2 border-[--bereal-border] bg-[--bereal-bg] p-4">
        <p className="mb-2 text-sm font-medium text-[--bereal-text-primary]">How long should the auction run?</p>
        <div className="flex flex-wrap gap-2">
          {[1, 3, 7].map((days) => (
            <button
              key={days}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                durationMode === "preset" && durationPresetDays === days
                  ? "bg-[--bereal-primary] text-white"
                  : "bg-[--bereal-surface-hover] text-[--bereal-text-secondary] hover:bg-[--bereal-border]"
              }`}
              onClick={() => {
                onDurationModeChange("preset");
                onDurationPresetDaysChange(days as 1 | 3 | 7);
              }}
            >
              {days} Day{days > 1 ? "s" : ""}
            </button>
          ))}
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              durationMode === "custom"
                ? "bg-[--bereal-primary] text-white"
                : "bg-[--bereal-surface-hover] text-[--bereal-text-secondary] hover:bg-[--bereal-border]"
            }`}
            onClick={() => onDurationModeChange("custom")}
          >
            Custom Date
          </button>
        </div>

        {durationMode === "custom" ? (
          <div className="mt-3">
            <input
              type="datetime-local"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              min={startAt ? toLocalInputValue(startAt) : undefined}
              disabled={!startAt}
              className="w-full rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-4 py-2.5 text-sm text-[--bereal-text-primary] outline-none transition-all focus:border-[--bereal-primary] focus:ring-[--bereal-primary]/20"
            />
            {isEndBeforeStart ? (
              <p className="mt-2 text-xs text-[--bereal-danger]">End time must be after the start.</p>
            ) : null}
          </div>
        ) : null}

        {isShortAuction ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[--bereal-warning-soft] px-3 py-1 text-xs font-semibold text-[--bereal-warning-text]">
            <AlertTriangle className="h-3.5 w-3.5" /> Short auctions favor bots. “BeReal” recommends at least 24 hours.
          </div>
        ) : null}

        <div className="mt-3 text-xs text-[--bereal-text-secondary]">End block (exclusive) ≈ #{computedEndBlock || "--"}</div>
      </div>

      <div className="rounded-lg border-2 border-[--bereal-border] bg-[--bereal-bg] p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-[--bereal-text-primary]">
          <input
            type="checkbox"
            checked={unlockImmediate}
            onChange={(e) => onUnlockImmediateChange(e.target.checked)}
            className="h-4 w-4 rounded border-[--bereal-primary] text-[--bereal-primary] focus:ring-[--bereal-primary]"
          />
          Tokens are tradable immediately after auction ends.
        </label>

        {!unlockImmediate ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-[--bereal-text-secondary]">Lock for</span>
            <input
              type="number"
              min={0}
              value={lockupValue}
              onChange={(e) => onLockupValueChange(e.target.value)}
              className="w-24 rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-3 py-2 text-sm text-[--bereal-text-primary] outline-none transition-all focus:border-[--bereal-primary] focus:ring-[--bereal-primary]/20"
            />
            <select
              value={lockupUnit}
              onChange={(e) => onLockupUnitChange(e.target.value as "days" | "hours" | "weeks")}
              className="rounded-lg border-2 border-[--bereal-border] bg-[--bereal-surface] px-3 py-2 text-sm text-[--bereal-text-primary] outline-none transition-all focus:border-[--bereal-primary] focus:ring-[--bereal-primary]/20"
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        ) : null}

        <div className="mt-3 text-xs text-[--bereal-text-secondary]">Unlock block ≈ #{computedClaimBlock || "--"}</div>
      </div>

      <div className="rounded-lg border-2 border-[--bereal-border] bg-[--bereal-bg] p-4">
        <p className="mb-4 text-sm font-medium text-[--bereal-text-primary]">Timeline</p>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[--bereal-border]" />
          {[{
            label: "Start",
            time: formatDateTime(startAt),
            block: computedStartBlock,
          }, {
            label: "End",
            time: formatDateTime(endAt),
            block: computedEndBlock,
          }, {
            label: "Unlock",
            time: formatDateTime(claimAt),
            block: computedClaimBlock,
          }].map((node) => (
            <div key={node.label} className="relative z-10 flex flex-col items-center text-center">
              <div className="h-3 w-3 rounded-full bg-[--bereal-primary]" />
              <div className="mt-2 text-xs font-semibold text-[--bereal-text-primary]">{node.label}</div>
              <div className="mt-1 text-[11px] text-[--bereal-text-secondary]">{node.label}: {node.time}</div>
              <div className="text-[11px] text-[--bereal-text-muted]">Block ~#{node.block || "--"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
