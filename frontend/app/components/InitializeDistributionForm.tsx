"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Settings,
  Target,
  XCircle,
} from "lucide-react";
import { ethers } from "ethers";
import { AuctionParameters } from "../lib/types";
import { initializeDistribution } from "../services/initializeDistribution";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { formatCompact } from "../lib/format";
import { CreateTokenForm } from "./CreateTokenForm";
import { AuctionStepsBuilderTS, buildAuctionSteps } from "../lib/AuctionStepsBuilderTS";

const defaultForm = {
  tokenAddress: "",
  humanAuctionSupply: "",
  currency: ethers.ZeroAddress,
  tokensRecipient: "",
  fundsRecipient: "",
  startBlock: "",
  endBlock: "",
  claimBlock: "",
  tickSpacing: "1005",
  validationHook: "0x0000000000000000000000000000000000000000",
  floorPrice: "5025",
  requiredCurrencyRaised: "0",
  auctionStepsData: "0x",
};

const AVG_BLOCK_TIME_BY_CHAIN: Record<number, number> = {
  1: 12,
  5: 12,
  11155111: 12,
  8453: 2,
  84532: 2,
  130: 1,
  1301: 1,
};

const START_BUFFER_BLOCKS = 2;
const END_PAD_BLOCKS = 2;
const SHORT_AUCTION_SECONDS = 12 * 60 * 60;
const Q96 = BigInt(2) ** BigInt(96);
const AUCTION_DURATION_ROUNDING = 100;

type Props = {
  address?: string;
  chainId?: number;
};

type SubmitState = {
  submitting: boolean;
  txHash?: string;
  auctionAddress?: string;
  error?: string;
};

export function InitializeDistributionForm({ address, chainId }: Props) {
  const [initForm, setInitForm] = useState(defaultForm);
  const [submitState, setSubmitState] = useState<SubmitState>({
    submitting: false,
  });
  const [lowDecimalConfirmed, setLowDecimalConfirmed] = useState(false);
  const [lockConfirmed, setLockConfirmed] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);
  const [startMode, setStartMode] = useState<"immediate" | "scheduled">(
    "immediate",
  );
  const [scheduledStart, setScheduledStart] = useState("");
  const [durationMode, setDurationMode] = useState<"preset" | "custom">(
    "preset",
  );
  const [durationPresetDays, setDurationPresetDays] = useState<1 | 3 | 7>(1);
  const [customEndDate, setCustomEndDate] = useState("");
  const [unlockImmediate, setUnlockImmediate] = useState(true);
  const [lockupValue, setLockupValue] = useState("7");
  const [lockupUnit, setLockupUnit] = useState<"days" | "hours" | "weeks">(
    "days",
  );
  const tokenBalanceState = useTokenBalance(address, initForm.tokenAddress);

  useEffect(() => {
    if (!address) return;
    setInitForm((prev) => ({
      ...prev,
      tokensRecipient: prev.tokensRecipient || address,
      fundsRecipient: prev.fundsRecipient || address,
    }));
  }, [address]);

  useEffect(() => {
    setLowDecimalConfirmed(false);
    setLockConfirmed(false);
  }, [initForm.tokenAddress]);

  const updateField = (key: keyof typeof initForm, value: string) => {
    setInitForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseBigInt = (label: string, value: string) => {
    if (!value) throw new Error(`${label} is required`);
    return BigInt(value);
  };

  const tokenDecimals =
    tokenBalanceState.status === "success" ? tokenBalanceState.decimals : 18;

  const avgBlockTime = AVG_BLOCK_TIME_BY_CHAIN[chainId ?? 1] ?? 12;

  const parseDateTimeLocal = (value: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatDateTime = (value: Date | null) => {
    if (!value) return "--";
    return value.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toLocalInputValue = (value: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  };

  const now = useMemo(
    () => new Date(),
    [
      currentBlock,
      startMode,
      scheduledStart,
      durationMode,
      durationPresetDays,
      customEndDate,
      unlockImmediate,
      lockupValue,
      lockupUnit,
    ],
  );

  const scheduledStartDate = parseDateTimeLocal(scheduledStart);

  const startAt = useMemo(() => {
    if (startMode === "immediate") {
      return new Date(
        now.getTime() + START_BUFFER_BLOCKS * avgBlockTime * 1000,
      );
    }
    return scheduledStartDate;
  }, [startMode, scheduledStartDate, now, avgBlockTime]);

  const isStartInPast =
    startMode === "scheduled" &&
    !!scheduledStartDate &&
    scheduledStartDate.getTime() < now.getTime();

  const durationSeconds = useMemo(() => {
    if (!startAt) return null;
    if (durationMode === "custom") {
      const end = parseDateTimeLocal(customEndDate);
      if (!end) return null;
      if (end.getTime() <= startAt.getTime()) return null;
      return Math.floor((end.getTime() - startAt.getTime()) / 1000);
    }
    return durationPresetDays * 24 * 60 * 60;
  }, [startAt, durationMode, customEndDate, durationPresetDays]);

  const endAt = useMemo(() => {
    if (!startAt || durationSeconds === null) return null;
    return new Date(startAt.getTime() + durationSeconds * 1000);
  }, [startAt, durationSeconds]);

  const isEndBeforeStart = useMemo(() => {
    if (durationMode !== "custom") return false;
    if (!startAt) return false;
    const end = parseDateTimeLocal(customEndDate);
    if (!end) return false;
    return end.getTime() <= startAt.getTime();
  }, [durationMode, startAt, customEndDate]);

  const lockupSeconds = useMemo(() => {
    if (unlockImmediate) return 0;
    const parsed = Number(lockupValue);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    if (lockupUnit === "hours") return parsed * 60 * 60;
    if (lockupUnit === "weeks") return parsed * 7 * 24 * 60 * 60;
    return parsed * 24 * 60 * 60;
  }, [unlockImmediate, lockupValue, lockupUnit]);

  const claimAt = useMemo(() => {
    if (!endAt) return null;
    return new Date(endAt.getTime() + lockupSeconds * 1000);
  }, [endAt, lockupSeconds]);

  const blocksFromSeconds = (seconds: number) =>
    Math.ceil(seconds / avgBlockTime);

  const computedStartBlock = useMemo(() => {
    if (currentBlock === null || !startAt) return "";
    if (isStartInPast) return "";
    if (startMode === "immediate")
      return String(currentBlock + START_BUFFER_BLOCKS);
    const diffSeconds = Math.max(
      0,
      Math.ceil((startAt.getTime() - now.getTime()) / 1000),
    );
    return String(currentBlock + blocksFromSeconds(diffSeconds));
  }, [currentBlock, startAt, startMode, now, avgBlockTime, isStartInPast]);

  const computedEndBlock = useMemo(() => {
    if (!computedStartBlock || durationSeconds === null) return "";
    const startBlockNumber = Number(computedStartBlock);
    if (!Number.isFinite(startBlockNumber)) return "";
    const durationBlocks = blocksFromSeconds(durationSeconds);
    return String(startBlockNumber + durationBlocks + END_PAD_BLOCKS);
  }, [computedStartBlock, durationSeconds, avgBlockTime]);

  const computedClaimBlock = useMemo(() => {
    if (!computedEndBlock) return "";
    const endBlockNumber = Number(computedEndBlock);
    if (!Number.isFinite(endBlockNumber)) return "";
    if (unlockImmediate) return String(endBlockNumber);
    const extraBlocks = blocksFromSeconds(lockupSeconds);
    return String(endBlockNumber + extraBlocks);
  }, [computedEndBlock, unlockImmediate, lockupSeconds, avgBlockTime]);

  const isShortAuction =
    durationSeconds !== null && durationSeconds < SHORT_AUCTION_SECONDS;

  useEffect(() => {
    updateField("startBlock", computedStartBlock || "");
    updateField("endBlock", computedEndBlock || "");
    updateField("claimBlock", computedClaimBlock || "");
  }, [computedStartBlock, computedEndBlock, computedClaimBlock]);

  useEffect(() => {
    if (startMode === "scheduled" && !scheduledStart) {
      const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
      setScheduledStart(toLocalInputValue(defaultStart));
    }
  }, [startMode, scheduledStart, now]);

  useEffect(() => {
    if (durationMode === "custom" && !customEndDate && startAt) {
      const defaultEnd = new Date(startAt.getTime() + 24 * 60 * 60 * 1000);
      setCustomEndDate(toLocalInputValue(defaultEnd));
    }
  }, [durationMode, customEndDate, startAt]);

  useEffect(() => {
    if (!initForm.tickSpacing) return;
    try {
      const tickRatio = BigInt(initForm.tickSpacing);
      const derivedFloor = (tickRatio * BigInt(5)).toString();
      if (initForm.floorPrice !== derivedFloor) {
        updateField("floorPrice", derivedFloor);
      }
    } catch {
      if (initForm.floorPrice !== "") {
        updateField("floorPrice", "");
      }
    }
  }, [initForm.tickSpacing, initForm.floorPrice]);

  const computeRawSupply = () => {
    const cleaned = (initForm.humanAuctionSupply || "0")
      .replace(/,/g, "")
      .trim();
    if (!cleaned) return null;
    try {
      return ethers.parseUnits(cleaned, tokenDecimals);
    } catch (e) {
      return null;
    }
  };

  const supplyPreview = (() => {
    const raw = computeRawSupply();
    if (raw === null)
      return { label: "", detail: "Enter supply", error: false };
    return {
      label: formatCompact(raw.toString()),
      detail: raw.toString(),
      error: false,
    };
  })();

  const setSupplyFromPercent = (percent: number) => {
    if (tokenBalanceState.status !== "success") return;
    const rawBal = ethers.parseUnits(
      tokenBalanceState.balance,
      tokenBalanceState.decimals,
    );
    const raw = (rawBal * BigInt(Math.round(percent * 100))) / BigInt(10000); // percent with two decimals
    const human = ethers.formatUnits(raw, tokenBalanceState.decimals);
    updateField("humanAuctionSupply", human);
  };

  const handleInitializeDistribution = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!address) {
      setSubmitState({ submitting: false, error: "Connect your wallet first" });
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setSubmitState({ submitting: false, error: "No injected wallet found" });
      return;
    }

    try {
      setSubmitState({ submitting: true });

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const currentBlockValue = BigInt(await provider.getBlockNumber());
      setCurrentBlock(Number(currentBlockValue));

      const nowLocal = new Date();
      const scheduledStartLocal = parseDateTimeLocal(scheduledStart);
      const startAtLocal =
        startMode === "immediate"
          ? new Date(
              nowLocal.getTime() + START_BUFFER_BLOCKS * avgBlockTime * 1000,
            )
          : scheduledStartLocal;

      if (!startAtLocal) {
        throw new Error("Start time is required");
      }

      if (
        startMode === "scheduled" &&
        startAtLocal.getTime() < nowLocal.getTime()
      ) {
        throw new Error("Start time cannot be in the past");
      }

      const durationSecondsLocal =
        durationMode === "custom"
          ? (() => {
              const endLocal = parseDateTimeLocal(customEndDate);
              if (!endLocal) return null;
              const diff = Math.floor(
                (endLocal.getTime() - startAtLocal.getTime()) / 1000,
              );
              return diff > 0 ? diff : null;
            })()
          : durationPresetDays * 24 * 60 * 60;

      if (!durationSecondsLocal) {
        throw new Error("Auction duration is invalid");
      }

      const startDiffSeconds = Math.max(
        0,
        Math.ceil((startAtLocal.getTime() - nowLocal.getTime()) / 1000),
      );

      const resolvedStartBlock =
        startMode === "immediate"
          ? currentBlockValue + BigInt(START_BUFFER_BLOCKS)
          : currentBlockValue + BigInt(blocksFromSeconds(startDiffSeconds));

      const rawDurationBlocks = blocksFromSeconds(durationSecondsLocal);
      const roundedDurationBlocks = Math.max(
        AUCTION_DURATION_ROUNDING,
        Math.round(rawDurationBlocks / AUCTION_DURATION_ROUNDING) * AUCTION_DURATION_ROUNDING,
      );

      const endBlockValue =
        resolvedStartBlock + BigInt(roundedDurationBlocks + END_PAD_BLOCKS);

      const lockupSecondsLocal = unlockImmediate
        ? 0
        : lockupUnit === "hours"
          ? Number(lockupValue) * 60 * 60
          : lockupUnit === "weeks"
            ? Number(lockupValue) * 7 * 24 * 60 * 60
            : Number(lockupValue) * 24 * 60 * 60;

      const claimBlockValue = unlockImmediate
        ? endBlockValue
        : endBlockValue + BigInt(blocksFromSeconds(lockupSecondsLocal));

      const tickRatio = parseBigInt("Tick spacing", initForm.tickSpacing);
      const tickSpacingValue = (Q96 * tickRatio) / BigInt(1000);
      const floorPriceValue = tickSpacingValue * BigInt(5);

      //   const auctionStepsData = AuctionStepsBuilderTS.init()
      //     .addStep(20_000, 50)
      //     .addStep(100_000, 49)
      //     .addStep(4_100_000, 1)
      //     .build();
      const auctionStepsData = buildAuctionSteps({
        startBlock: resolvedStartBlock,
        endBlock: endBlockValue,
      });

      const auctionParams: AuctionParameters = {
        currency: initForm.currency,
        tokensRecipient: initForm.tokensRecipient,
        fundsRecipient: initForm.fundsRecipient,
        startBlock: resolvedStartBlock,
        endBlock: endBlockValue,
        claimBlock: claimBlockValue,
        tickSpacing: tickSpacingValue,
        validationHook: initForm.validationHook,
        floorPrice: floorPriceValue,
        requiredCurrencyRaised: parseBigInt(
          "Required currency raised",
          initForm.requiredCurrencyRaised,
        ),
        auctionStepsData,
      };

      if (
        !(
          auctionParams.startBlock < auctionParams.endBlock &&
          auctionParams.endBlock <= auctionParams.claimBlock
        )
      ) {
        throw new Error("Block order must be start < end ≤ claim");
      }

      const rawSupply = computeRawSupply();
      if (rawSupply === null) {
        throw new Error("Total auction supply is invalid");
      }
      if (rawSupply > BigInt(10) ** BigInt(30)) {
        throw new Error("Total supply exceeds CCA maximum (1e30 wei)");
      }

      console.log({
        signer,
        token: initForm.tokenAddress,
        rawSupply,
        auctionParams,
      });

      const { txHash, auctionAddress } = await initializeDistribution(
        signer,
        initForm.tokenAddress,
        rawSupply,
        auctionParams,
      );

      setSubmitState({ submitting: false, txHash, auctionAddress });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSubmitState({ submitting: false, error: message });
    }
  };

  return (
    <div className="rounded-xl border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6 text-[color:var(--bereal-text-primary)] shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[color:var(--bereal-text-primary)]">
          <Target className="h-5 w-5 text-[color:var(--bereal-primary)]" />{" "}
          Initialize Auction
        </h2>
        <p className="mt-1 text-sm text-[color:var(--bereal-text-secondary)]">
          Set up your continuous clearing auction with simple steps.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleInitializeDistribution}>
        {/* Token Setup Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
            Step 1: Token Setup
          </h3>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
              Token Address
            </span>
            <input
              value={initForm.tokenAddress}
              onChange={(e) => updateField("tokenAddress", e.target.value)}
              className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-4 py-3 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
              placeholder="Enter ERC20 token address (0x...)"
              required
            />
            <div className="mt-1 text-xs text-[color:var(--bereal-text-secondary)]">
              {tokenBalanceState.status === "idle" &&
                "Enter an ERC20 address to fetch your balance"}
              {tokenBalanceState.status === "loading" && "Fetching balance..."}
              {tokenBalanceState.status === "error" && (
                <span className="text-[color:var(--bereal-danger)]">
                  {tokenBalanceState.message}
                </span>
              )}
              {tokenBalanceState.status === "success" && (
                <span className="text-[color:var(--bereal-success)]">
                  Balance: {formatCompact(tokenBalanceState.balance)}{" "}
                  {tokenBalanceState.symbol}
                  <span className="ml-1 text-[11px] text-[color:var(--bereal-text-muted)]">
                    ({tokenBalanceState.balance})
                  </span>
                </span>
              )}
              {tokenBalanceState.status === "success" &&
                tokenBalanceState.decimals < 6 && (
                  <div className="mt-1 text-[11px] text-[color:var(--bereal-danger)]">
                    Warning: token has {tokenBalanceState.decimals} decimals
                    (&lt; 6). Low decimals can cause rounding loss. Confirm to
                    proceed.
                  </div>
                )}
            </div>
          </label>

          {tokenBalanceState.status === "success" &&
          tokenBalanceState.decimals < 6 ? (
            <label className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[color:var(--bereal-danger)]">
              <input
                type="checkbox"
                checked={lowDecimalConfirmed}
                onChange={(e) => setLowDecimalConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--bereal-danger)] text-[color:var(--bereal-danger)] focus:ring-[color:var(--bereal-danger)]"
              />
              I understand the risks of using a token with &lt; 6 decimals.
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
              Auction Supply
            </span>
            <div className="mb-2 flex items-center justify-between">
              {tokenBalanceState.status === "success" ? (
                <div className="flex gap-2">
                  <span className="text-xs text-[color:var(--bereal-text-secondary)]">
                    Quick fill:
                  </span>
                  <button
                    type="button"
                    className="rounded-md bg-[color:var(--bereal-surface-hover)] px-2.5 py-1 text-xs font-medium text-[color:var(--bereal-success)] transition-colors hover:bg-[color:var(--bereal-border)]"
                    onClick={() => setSupplyFromPercent(100)}
                  >
                    Max
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-[color:var(--bereal-surface-hover)] px-2.5 py-1 text-xs font-medium text-[color:var(--bereal-success)] transition-colors hover:bg-[color:var(--bereal-border)]"
                    onClick={() => setSupplyFromPercent(80)}
                  >
                    80%
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-[color:var(--bereal-surface-hover)] px-2.5 py-1 text-xs font-medium text-[color:var(--bereal-success)] transition-colors hover:bg-[color:var(--bereal-border)]"
                    onClick={() => setSupplyFromPercent(50)}
                  >
                    50%
                  </button>
                </div>
              ) : null}
            </div>
            <input
              value={initForm.humanAuctionSupply}
              onChange={(e) =>
                updateField("humanAuctionSupply", e.target.value)
              }
              className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-4 py-3 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
              placeholder="e.g. 1,000,000"
              required
            />
            <div className="mt-1 text-[11px] text-[color:var(--bereal-text-secondary)]">
              Decimals: {tokenDecimals} | Raw preview:{" "}
              {supplyPreview.label || "--"}
              {supplyPreview.detail ? (
                <span className="ml-1 font-mono text-[10px] text-[color:var(--bereal-text-muted)]">
                  ({supplyPreview.detail})
                </span>
              ) : null}
            </div>
          </label>
        </div>

        {/* Auction Configuration Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
            Step 2: Auction Settings
          </h3>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
              Payment Currency
            </span>
            <input
              value={initForm.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-4 py-3 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
              placeholder={ethers.ZeroAddress}
              required
            />
            <p className="mt-1 text-xs text-[color:var(--bereal-text-secondary)]">
              Use {ethers.ZeroAddress} for ETH or enter a token address
            </p>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                Tokens Recipient
              </span>
              <input
                value={initForm.tokensRecipient}
                onChange={(e) => updateField("tokensRecipient", e.target.value)}
                className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-4 py-3 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                placeholder="Address receiving tokens"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                Funds Recipient
              </span>
              <input
                value={initForm.fundsRecipient}
                onChange={(e) => updateField("fundsRecipient", e.target.value)}
                className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] px-4 py-3 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                placeholder="Address receiving funds"
                required
              />
            </label>
          </div>
        </div>

        {/* Timing Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
              Step 3: Timing
            </h3>
            <p className="text-xs text-[color:var(--bereal-text-secondary)]">
              We convert human time to blocks using an average block time of{" "}
              {avgBlockTime}s.
              {currentBlock !== null ? ` Current block: #${currentBlock}` : ""}
            </p>
          </div>

          <div className="rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4">
            <p className="mb-2 text-sm font-medium text-[color:var(--bereal-text-primary)]">
              Start Time
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  startMode === "immediate"
                    ? "bg-[color:var(--bereal-primary)] text-white"
                    : "bg-[color:var(--bereal-surface-hover)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-border)]"
                }`}
                onClick={() => setStartMode("immediate")}
              >
                Start Immediately
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  startMode === "scheduled"
                    ? "bg-[color:var(--bereal-primary)] text-white"
                    : "bg-[color:var(--bereal-surface-hover)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-border)]"
                }`}
                onClick={() => setStartMode("scheduled")}
              >
                Schedule
              </button>
            </div>

            {startMode === "scheduled" ? (
              <div className="mt-3">
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  min={toLocalInputValue(now)}
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                />
                {isStartInPast ? (
                  <p className="mt-2 text-xs text-[color:var(--bereal-danger)]">
                    Start time cannot be in the past.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 text-xs text-[color:var(--bereal-text-secondary)]">
              Start block ≈ #{computedStartBlock || "--"}
            </div>
          </div>

          <div className="rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4">
            <p className="mb-2 text-sm font-medium text-[color:var(--bereal-text-primary)]">
              How long should the auction run?
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    durationMode === "preset" && durationPresetDays === days
                      ? "bg-[color:var(--bereal-primary)] text-white"
                      : "bg-[color:var(--bereal-surface-hover)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-border)]"
                  }`}
                  onClick={() => {
                    setDurationMode("preset");
                    setDurationPresetDays(days as 1 | 3 | 7);
                  }}
                >
                  {days} Day{days > 1 ? "s" : ""}
                </button>
              ))}
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  durationMode === "custom"
                    ? "bg-[color:var(--bereal-primary)] text-white"
                    : "bg-[color:var(--bereal-surface-hover)] text-[color:var(--bereal-text-secondary)] hover:bg-[color:var(--bereal-border)]"
                }`}
                onClick={() => setDurationMode("custom")}
              >
                Custom Date
              </button>
            </div>

            {durationMode === "custom" ? (
              <div className="mt-3">
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={startAt ? toLocalInputValue(startAt) : undefined}
                  disabled={!startAt}
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                />
                {isEndBeforeStart ? (
                  <p className="mt-2 text-xs text-[color:var(--bereal-danger)]">
                    End time must be after the start.
                  </p>
                ) : null}
              </div>
            ) : null}

            {isShortAuction ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--bereal-warning-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--bereal-warning-text)]">
                <AlertTriangle className="h-3.5 w-3.5" /> Short auctions favor
                bots. “BeReal” recommends at least 24 hours.
              </div>
            ) : null}

            <div className="mt-3 text-xs text-[color:var(--bereal-text-secondary)]">
              End block (exclusive) ≈ #{computedEndBlock || "--"}
            </div>
          </div>

          <div className="rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-text-primary)]">
              <input
                type="checkbox"
                checked={unlockImmediate}
                onChange={(e) => setUnlockImmediate(e.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--bereal-primary)] text-[color:var(--bereal-primary)] focus:ring-[color:var(--bereal-primary)]"
              />
              Tokens are tradable immediately after auction ends.
            </label>

            {!unlockImmediate ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-xs text-[color:var(--bereal-text-secondary)]">
                  Lock for
                </span>
                <input
                  type="number"
                  min={0}
                  value={lockupValue}
                  onChange={(e) => setLockupValue(e.target.value)}
                  className="w-24 rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                />
                <select
                  value={lockupUnit}
                  onChange={(e) =>
                    setLockupUnit(e.target.value as "days" | "hours" | "weeks")
                  }
                  className="rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-3 py-2 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            ) : null}

            <div className="mt-3 text-xs text-[color:var(--bereal-text-secondary)]">
              Unlock block ≈ #{computedClaimBlock || "--"}
            </div>
          </div>

          <div className="rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4">
            <p className="mb-4 text-sm font-medium text-[color:var(--bereal-text-primary)]">
              Timeline
            </p>
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[color:var(--bereal-border)]" />
              {[
                {
                  label: "Start",
                  time: formatDateTime(startAt),
                  block: computedStartBlock,
                },
                {
                  label: "End",
                  time: formatDateTime(endAt),
                  block: computedEndBlock,
                },
                {
                  label: "Unlock",
                  time: formatDateTime(claimAt),
                  block: computedClaimBlock,
                },
              ].map((node) => (
                <div
                  key={node.label}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div className="h-3 w-3 rounded-full bg-[color:var(--bereal-primary)]" />
                  <div className="mt-2 text-xs font-semibold text-[color:var(--bereal-text-primary)]">
                    {node.label}
                  </div>
                  <div className="mt-1 text-[11px] text-[color:var(--bereal-text-secondary)]">
                    {node.label}: {node.time}
                  </div>
                  <div className="text-[11px] text-[color:var(--bereal-text-muted)]">
                    Block ~#{node.block || "--"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings - Collapsible */}
        <details className="group rounded-lg border-2 border-dashed border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4">
          <summary className="cursor-pointer select-none text-sm font-semibold text-[color:var(--bereal-text-secondary)] transition-colors hover:text-[color:var(--bereal-text-primary)]">
            <span className="inline-flex items-center gap-2">
              <Settings className="h-4 w-4" /> Advanced Settings (optional)
            </span>
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Start Block
                </span>
                <input
                  value={initForm.startBlock}
                  readOnly
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                  placeholder="Auto-calculated"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  End Block
                </span>
                <input
                  value={initForm.endBlock}
                  readOnly
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                  placeholder="Auto-calculated"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Claim Block
                </span>
                <input
                  value={initForm.claimBlock}
                  readOnly
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                  placeholder="Auto-calculated"
                  required
                />
              </label>
            </div>
            <p className="text-xs text-[color:var(--bereal-text-secondary)]">
              Auto-calculated from time inputs. Must follow: Start &lt; End ≤
              Claim
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Tick Spacing
                </span>
                <input
                  value={initForm.tickSpacing}
                  onChange={(e) => updateField("tickSpacing", e.target.value)}
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                  placeholder="e.g. 1"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Floor Price
                </span>
                <input
                  value={initForm.floorPrice}
                  readOnly
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                  placeholder="Auto-calculated"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Min Currency Raised
                </span>
                <input
                  value={initForm.requiredCurrencyRaised}
                  onChange={(e) =>
                    updateField("requiredCurrencyRaised", e.target.value)
                  }
                  className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                  placeholder="0"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--bereal-text-primary)]">
                Validation Hook (optional)
              </span>
              <input
                value={initForm.validationHook}
                onChange={(e) => updateField("validationHook", e.target.value)}
                className="w-full rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] px-4 py-2.5 text-sm text-[color:var(--bereal-text-primary)] outline-none transition-all focus:border-[color:var(--bereal-primary)] focus:ring-4 focus:ring-[color:var(--bereal-primary)]/20"
                placeholder="0x0000000000000000000000000000000000000000"
              />
            </label>
          </div>
        </details>

        {/* Submit Section */}
        <div className="space-y-4 rounded-lg border-2 border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={lockConfirmed}
              onChange={(e) => setLockConfirmed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-[color:var(--bereal-warning)] text-[color:var(--bereal-warning)] focus:ring-2 focus:ring-[color:var(--bereal-warning)]"
            />
            <span className="inline-flex items-start gap-2 text-sm font-medium text-[color:var(--bereal-warning)]">
              <AlertTriangle className="mt-0.5 h-4 w-4" />I understand tokens
              and currency are permanently locked once initialized and cannot be
              recovered.
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[color:var(--bereal-text-secondary)]">
              {address ? (
                <span className="text-[color:var(--bereal-success)]">
                  ✓ Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              ) : (
                <span className="text-[color:var(--bereal-danger)]">
                  ✗ Not connected
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={
                submitState.submitting ||
                !address ||
                !startAt ||
                !endAt ||
                isStartInPast ||
                isEndBeforeStart ||
                (tokenBalanceState.status === "success" &&
                  tokenBalanceState.decimals < 6 &&
                  !lowDecimalConfirmed) ||
                !lockConfirmed
              }
              className="w-full rounded-lg bg-[color:var(--bereal-primary)] px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-[color:var(--bereal-primary-dark)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[color:var(--bereal-primary)] sm:w-auto"
            >
              {submitState.submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Initializing...
                </span>
              ) : (
                "Initialize Auction"
              )}
            </button>
          </div>
        </div>

        {submitState.error ? (
          <div className="rounded-lg border-2 border-[color:var(--bereal-danger)] bg-[color:var(--bereal-bg)] p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-[color:var(--bereal-danger)]">
              <XCircle className="h-4 w-4" /> Error: {submitState.error}
            </p>
          </div>
        ) : null}
        {submitState.txHash ? (
          <div className="rounded-lg border-2 border-[color:var(--bereal-success)] bg-[color:var(--bereal-bg)] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--bereal-success)]">
              <CheckCircle className="h-4 w-4" /> Auction Initialized
              Successfully
            </p>
            <div className="space-y-1 text-xs text-[color:var(--bereal-text-secondary)]">
              <div>
                Transaction:{" "}
                <span className="font-mono">{submitState.txHash}</span>
              </div>
              {submitState.auctionAddress ? (
                <div>
                  Auction Address:{" "}
                  <span className="font-mono font-semibold text-[color:var(--bereal-text-primary)]">
                    {submitState.auctionAddress}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>

      <details className="mt-6 rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-bg)] p-3 text-xs text-[color:var(--bereal-text-primary)]">
        <summary className="cursor-pointer select-none font-medium">
          Need a token? Create a UERC20
        </summary>
        <div className="mt-3">
          <CreateTokenForm address={address} chainId={chainId} />
        </div>
      </details>
    </div>
  );
}
