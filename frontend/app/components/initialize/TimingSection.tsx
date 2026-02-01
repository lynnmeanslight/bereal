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
    <div className="space-y-6">
      {/* Start Time */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
          Start Time
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              startMode === "immediate"
                ? "bg-[color:var(--bereal-primary)] text-white"
                : "bg-[color:var(--bereal-surface)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)]"
            }`}
            onClick={() => onStartModeChange("immediate")}
          >
            Now
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              startMode === "scheduled"
                ? "bg-[color:var(--bereal-primary)] text-white"
                : "bg-[color:var(--bereal-surface)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)]"
            }`}
            onClick={() => onStartModeChange("scheduled")}
          >
            Schedule
          </button>
        </div>

        {startMode === "scheduled" && (
          <div className="mt-3">
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => onScheduledStartChange(e.target.value)}
              min={toLocalInputValue(now)}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
            />
            {isStartInPast && (
              <p className="mt-1.5 text-xs text-[color:var(--bereal-danger)]">Start time must be in the future</p>
            )}
          </div>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
          Duration
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 3, 7].map((days) => (
            <button
              key={days}
              type="button"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                durationMode === "preset" && durationPresetDays === days
                  ? "bg-[color:var(--bereal-primary)] text-white"
                  : "bg-[color:var(--bereal-surface)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)]"
              }`}
              onClick={() => {
                onDurationModeChange("preset");
                onDurationPresetDaysChange(days as 1 | 3 | 7);
              }}
            >
              {days}d
            </button>
          ))}
          <button
            type="button"
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              durationMode === "custom"
                ? "bg-[color:var(--bereal-primary)] text-white"
                : "bg-[color:var(--bereal-surface)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-surface-hover)]"
            }`}
            onClick={() => onDurationModeChange("custom")}
          >
            Custom
          </button>
        </div>

        {durationMode === "custom" && (
          <div className="mt-3">
            <input
              type="datetime-local"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              min={startAt ? toLocalInputValue(startAt) : undefined}
              disabled={!startAt}
              className="w-full rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20 disabled:opacity-50"
            />
            {isEndBeforeStart && (
              <p className="mt-1.5 text-xs text-[color:var(--bereal-danger)]">End must be after start</p>
            )}
          </div>
        )}

        {isShortAuction && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[color:var(--bereal-warning)]/5 border border-[color:var(--bereal-warning)]/30 px-3 py-2 text-xs text-[color:var(--bereal-text-secondary)]">
            <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--bereal-warning)]" />
            Short auctions may favor bots
          </div>
        )}
      </div>

      {/* Token Unlock */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-text-primary)]">
          <input
            type="checkbox"
            checked={unlockImmediate}
            onChange={(e) => onUnlockImmediateChange(e.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--bereal-border)] text-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
          />
          Unlock tokens immediately after auction
        </label>

        {!unlockImmediate && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[color:var(--bereal-text-secondary)]">Lock for</span>
            <input
              type="number"
              min={0}
              value={lockupValue}
              onChange={(e) => onLockupValueChange(e.target.value)}
              className="w-20 rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
            />
            <select
              value={lockupUnit}
              onChange={(e) => onLockupUnitChange(e.target.value as "days" | "hours" | "weeks")}
              className="rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none focus:border-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/20"
            >
              <option value="hours">hours</option>
              <option value="days">days</option>
              <option value="weeks">weeks</option>
            </select>
          </div>
        )}
      </div>

      {/* Timeline Preview */}
      <div className="rounded-lg bg-[color:var(--bereal-surface)] p-4">
        <p className="mb-4 text-xs font-medium text-[color:var(--bereal-text-secondary)]">Timeline</p>
        <div className="relative">
          <div className="absolute left-[16px] right-[16px] top-[6px] h-px bg-[color:var(--bereal-border)]" />
          <div className="relative flex justify-between">
            {[
              { label: "Start", time: formatDateTime(startAt) },
              { label: "End", time: formatDateTime(endAt) },
              { label: "Unlock", time: formatDateTime(claimAt) },
            ].map((node) => (
              <div key={node.label} className="flex flex-col items-center text-center">
                <div className="h-3 w-3 rounded-full bg-[color:var(--bereal-primary)] ring-4 ring-[color:var(--bereal-bg)]" />
                <div className="mt-2 text-xs font-medium text-[color:var(--bereal-text-primary)]">{node.label}</div>
                <div className="mt-0.5 text-[10px] text-[color:var(--bereal-text-muted)]">{node.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
