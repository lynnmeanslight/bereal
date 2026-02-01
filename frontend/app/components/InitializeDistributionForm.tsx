/* eslint-disable */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Settings,
  Target,
  XCircle,
  Shield,
  AlertCircle,
} from "lucide-react";
import { ethers } from "ethers";
import { AuctionParameters } from "../lib/types";
import { initializeDistribution } from "../services/initializeDistribution";
import { createTokenAndAuction } from "../services/createTokenAndAuction";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { formatCompact } from "../lib/format";
import {
  AuctionStepsBuilderTS,
  buildAuctionSteps,
} from "../lib/AuctionStepsBuilderTS";
import { useHumanVerification } from "../hooks/useHumanVerification";
import { WorldIDSection } from "./WorldIDSection";
import { CreateTokenForm } from "./CreateTokenForm";
import { TokenSetupSection } from "./initialize/TokenSetupSection";
import { AuctionSettingsSection } from "./initialize/AuctionSettingsSection";
import { TimingSection } from "./initialize/TimingSection";

const defaultForm = {
  tokenAddress: "",
  humanAuctionSupply: "",
  currency: ethers.ZeroAddress,
  tokensRecipient: "",
  fundsRecipient: "",
  startBlock: "",
  endBlock: "",
  claimBlock: "",
  validationHook: "0x0000000000000000000000000000000000000000",
  floorPrice: "5025",
  requiredCurrencyRaised: "0",
  auctionStepsData: "0x",
};

const defaultTokenForm = {
  name: "My Super Token",
  symbol: "MSUP",
  decimals: "18",
  humanTotalSupply: "1,000,000,000",
  recipient: "",
  creator: "",
  homeChainId: "",
  description: "A programmable super UERC20 token",
  website: "https://example.com",
  image: "https://example.com/logo.png",
  salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
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
  initialTokenAddress?: string;
};

type SubmitState = {
  submitting: boolean;
  txHash?: string;
  auctionAddress?: string;
  error?: string;
};

export function InitializeDistributionForm({
  address,
  chainId,
  initialTokenAddress,
}: Props) {
  const [initForm, setInitForm] = useState(defaultForm);
  const [tokenForm, setTokenForm] = useState(defaultTokenForm);
  const [createNewToken, setCreateNewToken] = useState(false);
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
  const humanCheck = useHumanVerification({
    walletAddress: address,
    action: process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID || "initialize_auction",
    chainId,
  });

  // Auto-fill token address from initial prop or CreateTokenForm
  useEffect(() => {
    if (initialTokenAddress && !initForm.tokenAddress) {
      setInitForm((prev) => ({
        ...prev,
        tokenAddress: initialTokenAddress,
      }));
    }
  }, [initialTokenAddress]);

  useEffect(() => {
    if (!address) return;
    setInitForm((prev) => ({
      ...prev,
      tokensRecipient: prev.tokensRecipient || address,
      fundsRecipient: prev.fundsRecipient || address,
    }));
    setTokenForm((prev) => ({
      ...prev,
      recipient: prev.recipient || address,
      creator: prev.creator || address,
      homeChainId: prev.homeChainId || (chainId ? String(chainId) : ""),
    }));
  }, [address]);

  useEffect(() => {
    setLowDecimalConfirmed(false);
    setLockConfirmed(false);
  }, [initForm.tokenAddress]);

  const updateField = (key: keyof typeof initForm, value: string) => {
    setInitForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTokenField = (key: keyof typeof tokenForm, value: string) => {
    setTokenForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseEthAmount = (label: string, value: string) => {
    if (!value) throw new Error(`${label} is required`);
    let cleaned = value.trim();
    if (cleaned.includes(",") && !cleaned.includes(".")) {
      cleaned = cleaned.replace(",", ".");
    }
    cleaned = cleaned.replace(/,/g, "");
    if (cleaned.startsWith(".")) cleaned = `0${cleaned}`;
    if (cleaned.endsWith(".")) cleaned = `${cleaned}0`;
    try {
      return ethers.parseEther(cleaned);
    } catch {
      throw new Error(`${label} must be a valid ETH amount`);
    }
  };

  // ETH (human) → wei → Q96. Snap prices in wei space, then convert once.
 const snapWeiToTick = (valueWei: bigint, tickWei: bigint) => {
  if (tickWei <= BigInt(0)) return valueWei;
  return ((valueWei + tickWei - BigInt(1)) / tickWei) * tickWei;
};
  const isTokenAddressValid = createNewToken
    ? true
    : ethers.isAddress(initForm.tokenAddress || "");
  const isCurrencyValid =
    initForm.currency === ethers.ZeroAddress ||
    ethers.isAddress(initForm.currency || "");
  const isTokensRecipientValid = ethers.isAddress(
    initForm.tokensRecipient || "",
  );
  const isFundsRecipientValid = ethers.isAddress(initForm.fundsRecipient || "");

  const tokenDecimals =
    tokenBalanceState.status === "success" ? tokenBalanceState.decimals : 18;

  const tokenDecimalsForAuction = useMemo(() => {
    if (!createNewToken) return tokenDecimals;

    if (tokenForm.decimals === "") return 18;

    const val = Number(tokenForm.decimals);
    if (!Number.isFinite(val) || val < 0 || val > 255) return 18;

    return val;
  }, [createNewToken, tokenForm.decimals, tokenDecimals]);

  const rawSupply = useMemo(() => {
    const cleaned = (initForm.humanAuctionSupply || "")
      .replace(/,/g, "")
      .trim();

    if (!cleaned) return null;
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

    try {
      return ethers.parseUnits(cleaned, tokenDecimalsForAuction);
    } catch {
      return null;
    }
  }, [initForm.humanAuctionSupply, tokenDecimalsForAuction]);

  const isSupplyValid = rawSupply !== null;
  const isFloorPriceValid = (() => {
    try {
      parseEthAmount("Floor price", initForm.floorPrice);
      return true;
    } catch {
      return false;
    }
  })();
  const isMinRaisedValid = (() => {
    try {
      parseEthAmount("Min currency raised", initForm.requiredCurrencyRaised);
      return true;
    } catch {
      return false;
    }
  })();

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

  const disabledReasons: string[] = [];
  if (submitState.submitting) disabledReasons.push("Submitting");
  if (!address) disabledReasons.push("Connect your wallet");
  if (!startAt || !endAt) disabledReasons.push("Set auction timing");
  if (isStartInPast) disabledReasons.push("Start time is in the past");
  if (isEndBeforeStart) disabledReasons.push("End time must be after start");
  if (!isTokenAddressValid) disabledReasons.push("Enter a valid token address");
  if (!isCurrencyValid)
    disabledReasons.push("Enter a valid payment currency address");
  if (!isTokensRecipientValid)
    disabledReasons.push("Enter a valid tokens recipient");
  if (!isFundsRecipientValid)
    disabledReasons.push("Enter a valid funds recipient");
  if (!isSupplyValid) disabledReasons.push("Enter a valid auction supply");
  if (!isFloorPriceValid) disabledReasons.push("Enter a valid floor price");
  if (!isMinRaisedValid) disabledReasons.push("Enter a valid min currency raised");
  if (
    tokenBalanceState.status === "success" &&
    tokenBalanceState.decimals < 6 &&
    !lowDecimalConfirmed
  ) {
    disabledReasons.push("Confirm low token decimals");
  }
  if (!lockConfirmed) disabledReasons.push("Confirm the lock warning");

  const isSubmitDisabled = disabledReasons.length > 0;

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

  const supplyPreview = (() => {
    if (rawSupply === null)
      return { label: "", detail: "Enter supply", error: false };

    return {
      label: formatCompact(
        ethers.formatUnits(rawSupply, tokenDecimalsForAuction),
      ),
      detail: rawSupply.toString(),
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

      if (!humanCheck.verified) {
        throw new Error("Please complete human verification first");
      }

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
        Math.round(rawDurationBlocks / AUCTION_DURATION_ROUNDING) *
          AUCTION_DURATION_ROUNDING,
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

      // ETH (human) → wei → Q96. Tick spacing equals floor price (same ETH input).
      const floorPriceWei = parseEthAmount("Floor price", initForm.floorPrice);
      const tickSpacingWei = floorPriceWei;
      const snappedFloorWei = snapWeiToTick(floorPriceWei, tickSpacingWei);
      const floorPriceValue = (snappedFloorWei * Q96) / BigInt(10) ** BigInt(18);
      const tickSpacingValueLocal = floorPriceValue;

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
        tickSpacing: tickSpacingValueLocal,
        validationHook: initForm.validationHook,
        floorPrice: floorPriceValue,
        requiredCurrencyRaised: parseEthAmount(
          "Min currency raised",
          initForm.requiredCurrencyRaised,
        ),
        auctionStepsData,
      };

      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const encodedParams = abiCoder.encode(
        [
          "tuple(" +
            "address currency," +
            "address tokensRecipient," +
            "address fundsRecipient," +
            "uint64 startBlock," +
            "uint64 endBlock," +
            "uint64 claimBlock," +
            "uint256 tickSpacing," +
            "address validationHook," +
            "uint256 floorPrice," +
            "uint128 requiredCurrencyRaised," +
            "bytes auctionStepsData" +
            ")",
        ],
        [auctionParams],
      );

      if (
        !(
          auctionParams.startBlock < auctionParams.endBlock &&
          auctionParams.endBlock <= auctionParams.claimBlock
        )
      ) {
        throw new Error("Block order must be start < end ≤ claim");
      }

      if (rawSupply === null) {
        throw new Error("Total auction supply is invalid");
      }
      if (rawSupply > BigInt(10) ** BigInt(30)) {
        throw new Error("Total supply exceeds CCA maximum (1e30 wei)");
      }

      const auctionSalt = ethers.ZeroHash;

      let txHash = "";
      let auctionAddress = "";
      let createdTokenAddress = initForm.tokenAddress;
      let blockNumber: number | undefined;
      let configData = encodedParams;

      if (createNewToken) {
        const decimalsNum = Number(tokenForm.decimals);
        if (
          !Number.isFinite(decimalsNum) ||
          decimalsNum < 0 ||
          decimalsNum > 255
        ) {
          throw new Error("Token decimals must be between 0 and 255");
        }
        const totalSupply = (() => {
          const cleaned = (tokenForm.humanTotalSupply || "0")
            .replace(/,/g, "")
            .trim();
          return ethers.parseUnits(cleaned || "0", decimalsNum);
        })();
        if (totalSupply < rawSupply) {
          throw new Error("Token total supply must be >= auction supply");
        }

        const {
          txHash: hash,
          auctionAddress: auctionAddr,
          tokenAddress: tokenAddr,
          blockNumber: blk,
        } = await createTokenAndAuction(signer, {
          token: {
            name: tokenForm.name,
            symbol: tokenForm.symbol,
            decimals: decimalsNum,
            totalSupply,
            recipient: tokenForm.recipient || address || ethers.ZeroAddress,
            creator: tokenForm.creator || address || ethers.ZeroAddress,
            homeChainId: BigInt(tokenForm.homeChainId || chainId || 0),
            metadata: {
              description: tokenForm.description,
              website: tokenForm.website,
              image: tokenForm.image,
            },
            salt: tokenForm.salt,
          },
          auction: {
            amount: rawSupply,
            configData: encodedParams,
            salt: auctionSalt,
          },
        });

        txHash = hash || "";
        auctionAddress = auctionAddr || "";
        createdTokenAddress = tokenAddr || "";
        blockNumber = blk;
      } else {
        const result = await initializeDistribution(
          signer,
          initForm.tokenAddress,
          rawSupply,
          auctionParams,
          chainId,
          auctionSalt,
        );
        txHash = result.txHash;
        auctionAddress = result.auctionAddress;
        blockNumber = result.blockNumber;
        configData = result.configData;
      }

      try {
        const configHash = ethers.keccak256(configData);

        await fetch("/api/auctions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auction: auctionAddress,
            token: createdTokenAddress,
            amount: rawSupply.toString(),
            configHash,
            creator: address,
            startBlock: resolvedStartBlock.toString(),
            endBlock: endBlockValue.toString(),
            claimBlock: claimBlockValue.toString(),
            blockNumber: blockNumber?.toString() ?? "0",
            txHash,
            chainId: chainId ?? 0,
            configData,
          }),
        });
      } catch (persistError) {
        console.warn("Failed to persist auction off-chain", persistError);
      }

      setSubmitState({ submitting: false, txHash, auctionAddress });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSubmitState({ submitting: false, error: message });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[color:var(--bereal-text-primary)]">
          Launch Your Auction
        </h2>
        <p className="mt-2 text-sm text-[color:var(--bereal-text-secondary)]">
          Configure and initialize your continuous clearing auction
        </p>
      </div>

      {/* World ID Verification Status */}
      {!humanCheck.loading && (
        <div
          className={`rounded-lg border p-4 ${
            humanCheck.verified
              ? "border-[color:var(--bereal-success)]/30 bg-[color:var(--bereal-success)]/5"
              : "border-[color:var(--bereal-warning)]/30 bg-[color:var(--bereal-warning)]/5"
          }`}
        >
          {humanCheck.verified ? (
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[color:var(--bereal-success)]" />
              <div>
                <p className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
                  Human verified ✨
                </p>
                <p className="text-xs text-[color:var(--bereal-text-secondary)]">
                  Ready to launch
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[color:var(--bereal-warning)]" />
                <div>
                  <p className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
                    Verification Required
                  </p>
                  <p className="text-xs text-[color:var(--bereal-text-secondary)]">
                    Verify to continue
                  </p>
                </div>
              </div>
              <WorldIDSection
                walletAddress={address}
                chainId={chainId}
                error={humanCheck.error}
              />
            </div>
          )}
        </div>
      )}

      <form className="space-y-8" onSubmit={handleInitializeDistribution}>
        {/* Token Setup */}
        <div className="rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6">
          <h3 className="mb-4 text-base font-semibold text-[color:var(--bereal-text-primary)]">
            Token Setup
          </h3>
          <TokenSetupSection
            createNewToken={createNewToken}
            onCreateNewTokenChange={setCreateNewToken}
            tokenAddress={initForm.tokenAddress}
            onTokenAddressChange={(value) => updateField("tokenAddress", value)}
            tokenBalanceState={tokenBalanceState}
            tokenForm={tokenForm}
            onTokenFieldChange={updateTokenField}
            address={address}
            chainId={chainId}
            lowDecimalConfirmed={lowDecimalConfirmed}
            onLowDecimalConfirmedChange={setLowDecimalConfirmed}
            humanAuctionSupply={initForm.humanAuctionSupply}
            onHumanAuctionSupplyChange={(value) =>
              updateField("humanAuctionSupply", value)
            }
            tokenDecimals={tokenDecimals}
            supplyPreview={supplyPreview}
            onSupplyFromPercent={setSupplyFromPercent}
          />
        </div>

        {/* Auction Settings */}
        <div className="rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6">
          <h3 className="mb-4 text-base font-semibold text-[color:var(--bereal-text-primary)]">
            Auction Settings
          </h3>
          <AuctionSettingsSection
            currency={initForm.currency}
            tokensRecipient={initForm.tokensRecipient}
            fundsRecipient={initForm.fundsRecipient}
            floorPrice={initForm.floorPrice}
            requiredCurrencyRaised={initForm.requiredCurrencyRaised}
            onChange={updateField}
            address={address}
          />
        </div>

        {/* Timing */}
        <div className="rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)] p-6">
          <h3 className="mb-4 text-base font-semibold text-[color:var(--bereal-text-primary)]">
            Timing
          </h3>
          <TimingSection
            avgBlockTime={avgBlockTime}
            currentBlock={currentBlock}
            startMode={startMode}
            onStartModeChange={setStartMode}
            scheduledStart={scheduledStart}
            onScheduledStartChange={setScheduledStart}
            isStartInPast={isStartInPast}
            durationMode={durationMode}
            onDurationModeChange={setDurationMode}
            durationPresetDays={durationPresetDays}
            onDurationPresetDaysChange={setDurationPresetDays}
            customEndDate={customEndDate}
            onCustomEndDateChange={setCustomEndDate}
            isEndBeforeStart={isEndBeforeStart}
            isShortAuction={isShortAuction}
            unlockImmediate={unlockImmediate}
            onUnlockImmediateChange={setUnlockImmediate}
            lockupValue={lockupValue}
            onLockupValueChange={setLockupValue}
            lockupUnit={lockupUnit}
            onLockupUnitChange={setLockupUnit}
            computedStartBlock={computedStartBlock}
            computedEndBlock={computedEndBlock}
            computedClaimBlock={computedClaimBlock}
            startAt={startAt}
            endAt={endAt}
            claimAt={claimAt}
            now={now}
            toLocalInputValue={toLocalInputValue}
            formatDateTime={formatDateTime}
          />
        </div>

        {/* Submit Section */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-lg border border-[color:var(--bereal-warning)]/30 bg-[color:var(--bereal-warning)]/5 p-4">
            <input
              type="checkbox"
              checked={lockConfirmed}
              onChange={(e) => setLockConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[color:var(--bereal-border)] text-[color:var(--bereal-primary)] focus:ring-2 focus:ring-[color:var(--bereal-primary)]/30"
            />
            <span className="text-sm font-semibold text-[color:var(--bereal-text-primary)]">
              I understand that tokens and currency will be permanently locked
              once the auction is initialized
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* <div className="text-xs text-[color:var(--bereal-text-muted)]">
              {address ? (
                <span>Connected: {address.slice(0, 6)}...{address.slice(-4)}</span>
              ) : (
                <span className="text-[color:var(--bereal-danger)]">Wallet not connected</span>
              )}
            </div> */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="rounded-lg bg-[color:var(--bereal-primary)] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[color:var(--bereal-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
            >
              {submitState.submitting
                ? "Initializing..."
                : "Initialize Auction"}
            </button>
            {isSubmitDisabled && (
              <p className="text-xs text-[color:var(--bereal-text-secondary)]">
                {disabledReasons[0]}
              </p>
            )}
          </div>
        </div>

        {submitState.error && (
          <div className="rounded-lg border border-[color:var(--bereal-danger)]/30 bg-[color:var(--bereal-danger)]/5 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-[color:var(--bereal-danger)] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Failed to initialize
                </p>
                <p className="mt-1 text-xs text-[color:var(--bereal-text-secondary)]">
                  {submitState.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {submitState.txHash && (
          <div className="rounded-lg border border-[color:var(--bereal-success)]/30 bg-[color:var(--bereal-success)]/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-[color:var(--bereal-success)] shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-[color:var(--bereal-text-primary)]">
                  Auction initialized!
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[color:var(--bereal-text-muted)]">
                      Transaction:
                    </span>
                    <a
                      href={`https://sepolia.uniscan.xyz/tx/${submitState.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[color:var(--bereal-primary)] hover:underline"
                    >
                      {submitState.txHash.slice(0, 10)}...
                      {submitState.txHash.slice(-8)}
                    </a>
                  </div>
                  {submitState.auctionAddress && (
                    <div className="flex items-center gap-2">
                      <span className="text-[color:var(--bereal-text-muted)]">
                        Auction:
                      </span>
                      <a
                        href={`https://sepolia.uniscan.xyz/address/${submitState.auctionAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-medium text-[color:var(--bereal-primary)] hover:underline"
                      >
                        {submitState.auctionAddress.slice(0, 10)}...
                        {submitState.auctionAddress.slice(-8)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Create Token Helper
      <details className="rounded-lg border border-[color:var(--bereal-border)] bg-[color:var(--bereal-surface)]">
        <summary className="cursor-pointer p-4 text-sm font-medium text-[color:var(--bereal-text-secondary)] hover:text-[color:var(--bereal-text-primary)]">
          Need a token? Create one here
        </summary>
        <div className="border-t border-[color:var(--bereal-border)] p-4">
          <CreateTokenForm 
            address={address} 
            chainId={chainId}
            onSuccess={(tokenAddress) => {
              setInitForm((prev) => ({
                ...prev,
                tokenAddress: tokenAddress,
              }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </details> */}
    </div>
  );
}
