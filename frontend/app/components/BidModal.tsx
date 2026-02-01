"use client";

import { useMemo, useState } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { submitBidETH } from "../services/submitBid";

type BidModalProps = {
  isOpen: boolean;
  onClose: () => void;
  auctionAddress: string;
  tokenSymbol: string;
  clearingPrice: bigint;
  floorPrice: bigint;
  tickSpacing: bigint;
  totalCleared: bigint;
  isAuctionEnded: boolean;
};

export function BidModal({
  isOpen,
  onClose,
  auctionAddress,
  tokenSymbol,
  clearingPrice,
  floorPrice,
  tickSpacing,
  totalCleared,
  isAuctionEnded,
}: BidModalProps) {
  const { address } = useAccount();
  const [depositEth, setDepositEth] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const Q96 = BigInt(2) ** BigInt(96);

  const normalizeEthInput = (value: string) => {
    let cleaned = value.trim();
    if (!cleaned) return "";
    if (cleaned.includes(",") && !cleaned.includes(".")) {
      cleaned = cleaned.replace(",", ".");
    }
    cleaned = cleaned.replace(/,/g, "");
    if (cleaned.startsWith(".")) cleaned = `0${cleaned}`;
    if (cleaned.endsWith(".")) cleaned = `${cleaned}0`;
    return cleaned;
  };

  const toQ96FromEth = (value: string) => {
    const cleaned = normalizeEthInput(value);
    const wei = ethers.parseEther(cleaned);
    return (wei * Q96) / BigInt(10) ** BigInt(18);
  };

  const formatQ96ToEth = (valueQ96: bigint) => {
    const wei = (valueQ96 * BigInt(10) ** BigInt(18)) / Q96;
    const price = Number(ethers.formatUnits(wei, 18));
    return price.toFixed(6);
  };

  const formatClearingPrice = (priceQ96: bigint) => {
    const priceWei = (priceQ96 * BigInt(10) ** BigInt(18)) / Q96;
    const price = Number(ethers.formatUnits(priceWei, 18));
    return price.toFixed(6);
  };

  const clearingPriceEth = useMemo(() => {
    if (!clearingPrice || clearingPrice === BigInt(0)) return 0;
    const priceWei = (clearingPrice * BigInt(10) ** BigInt(18)) / Q96;
    return Number(ethers.formatUnits(priceWei, 18));
  }, [clearingPrice, Q96]);

  const minBidPriceQ96 = useMemo(
    () => clearingPrice + tickSpacing,
    [clearingPrice, tickSpacing],
  );

  const minBidPriceEth = useMemo(
    () => formatQ96ToEth(minBidPriceQ96),
    [minBidPriceQ96],
  );

  const isClearing = totalCleared > BigInt(0) && !isAuctionEnded;
  const isCleared = totalCleared > BigInt(0) && isAuctionEnded;

  const mapBidError = (message: string) => {
    if (message.includes("BidMustBeAboveClearingPrice")) {
      return "Your max price must be higher than the current clearing price.";
    }
    if (message.includes("TickPriceNotAtBoundary")) {
      return "Price adjusted to nearest valid price level.";
    }
    return message;
  };

  const maxPriceQ96 = useMemo(() => {
    try {
      if (!maxPriceInput) return BigInt(0);
      const inputQ96 = toQ96FromEth(maxPriceInput);
      if (inputQ96 <= clearingPrice) return minBidPriceQ96;
      return floorPrice + ((inputQ96 - floorPrice) / tickSpacing) * tickSpacing;
    } catch {
      return BigInt(0);
    }
  }, [maxPriceInput, clearingPrice, minBidPriceQ96, floorPrice, tickSpacing]);

  const maxPriceEthSnapped = useMemo(() => {
    if (!maxPriceInput) return "";
    if (maxPriceQ96 === BigInt(0)) return "";
    return formatQ96ToEth(maxPriceQ96);
  }, [maxPriceInput, maxPriceQ96]);

  const estimatedTokens = useMemo(() => {
    const deposit = Number(depositEth || 0);
    const maxPrice = Number(maxPriceEthSnapped || 0);
    if (!deposit || !maxPrice) return "";
    const denom = Math.max(maxPrice, clearingPriceEth || 0);
    if (!denom) return "";
    return (deposit / denom).toFixed(6);
  }, [depositEth, maxPriceEthSnapped, clearingPriceEth]);

  const handleMaxPriceChange = (value: string) => {
    setErrorMessage("");
    setMaxPriceInput(value);
  };

  const handleMaxPriceBlur = () => {
    if (!maxPriceInput.trim()) return;
    if (tickSpacing <= BigInt(0)) {
      setErrorMessage("Invalid tick spacing");
      return;
    }
    if (maxPriceQ96 === BigInt(0)) return;
    // Snap to the tick grid (Q96) on blur to keep input editable while typing.
    setMaxPriceInput(formatQ96ToEth(maxPriceQ96));
  };

  const handleSubmitBid = async () => {
    if (!address || !depositEth || !maxPriceInput) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (isAuctionEnded) {
      setErrorMessage("Auction has ended");
      return;
    }

    if (maxPriceQ96 < minBidPriceQ96) {
      setErrorMessage(`Max price must be at least ${minBidPriceEth} ETH`);
      return;
    }

    const snappedMaxPriceEth = formatQ96ToEth(maxPriceQ96);

    try {
      setIsSubmitting(true);
      setTxStatus("pending");
      setErrorMessage("");

      // Connect to provider
      const ethereum = (window as Window & { ethereum?: unknown }).ethereum;
      if (!ethereum) {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.BrowserProvider(ethereum as any);
      const signer = await provider.getSigner();

      const tx = await submitBidETH({
        auctionAddress,
        signer,
        depositEth,
        maxPriceEth: snappedMaxPriceEth,
      });

      setTxHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus("success");
        setTimeout(() => {
          onClose();
          // Reset form
          setDepositEth("");
          setMaxPriceInput("");
          setTxStatus("idle");
          setTxHash("");
        }, 2000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Bid submission error:", error);
      setTxStatus("error");
      setErrorMessage(mapBidError(error.message || "Failed to submit bid"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-(--bereal-surface) border-2 border-(--bereal-border) rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-(--bereal-text-primary)">Place Your Bid</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-(--bereal-bg) rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-(--bereal-text-secondary)" />
          </button>
        </div>

        {txStatus === "success" ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-(--bereal-success) mx-auto mb-4" />
            <h3 className="text-xl font-bold text-(--bereal-success) mb-2">
              Bid Submitted Successfully
            </h3>
            <p className="text-sm text-(--bereal-text-secondary) mb-4">
              Your ETH is locked and will be used to buy tokens once clearing begins.
              Unused ETH will be refunded automatically.
            </p>
            {txHash && (
              <a
                href={`https://sepolia.uniscan.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-(--bereal-primary) hover:underline font-mono"
              >
                View Transaction →
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div className="mb-6 rounded-lg border border-(--bereal-border) bg-(--bereal-bg) px-4 py-3 text-sm">
              <span className="font-semibold text-(--bereal-text-primary)">
                {totalCleared === BigInt(0)
                  ? "🕒 Bidding Phase – Funds are escrowed"
                  : isClearing
                    ? "🔄 Clearing in Progress"
                    : "✅ Auction Cleared"}
              </span>
            </div>

            {/* Current Price Info */}
            <div className="bg-(--bereal-bg) rounded-lg p-4 mb-6 border border-(--bereal-border)">
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-sm text-(--bereal-text-secondary)"
                  title="The price at which tokens are sold. This is set only when tokens begin clearing."
                >
                  Clearing Price
                </span>
                {totalCleared === BigInt(0) ? (
                  <span className="text-sm text-(--bereal-text-muted)">
                    Not established yet
                  </span>
                ) : (
                  <span className="text-lg font-bold text-(--bereal-primary)">
                    {formatClearingPrice(clearingPrice)} ETH
                  </span>
                )}
              </div>
              {totalCleared === BigInt(0) && (
                <p className="text-xs text-(--bereal-text-muted)">
                  Price will be determined once tokens begin selling.
                </p>
              )}
              <div className="mt-3 flex justify-between items-center">
                <span
                  className="text-sm text-(--bereal-text-secondary)"
                  title="Bids only lock ETH in escrow. Funds are raised once tokens are sold."
                >
                  ETH Locked (Pending Execution)
                </span>
                <span className="text-sm font-semibold text-(--bereal-text-primary)">
                  {depositEth ? `${parseFloat(depositEth).toFixed(6)} ETH` : "--"}
                </span>
              </div>
              {estimatedTokens && (
                <div className="flex justify-between items-center">
                  <span
                    className="text-sm text-(--bereal-text-secondary)"
                    title="Actual allocation depends on final clearing price and demand at your bid level."
                  >
                    Estimated Tokens (If clearing occurs at your max price)
                  </span>
                  <span className="text-sm font-semibold text-(--bereal-text-primary)">
                    {estimatedTokens} {tokenSymbol}
                  </span>
                </div>
              )}
            </div>

            {/* Bid Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-(--bereal-text-primary) mb-2">
                Deposit Amount (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={depositEth}
                  onChange={(e) => setDepositEth(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-(--bereal-bg) border border-(--bereal-border) rounded-lg text-(--bereal-text-primary) placeholder:text-(--bereal-text-muted) focus:outline-none focus:border-(--bereal-primary) font-mono"
                  disabled={isSubmitting}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-(--bereal-text-secondary)">
                  ETH
                </span>
              </div>
            </div>

            {/* Max Price Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-(--bereal-text-primary) mb-2">
                Max Price per Token
              </label>
              <p className="mb-2 text-xs text-(--bereal-text-secondary)">
                Minimum valid bid: {minBidPriceEth} ETH
              </p>
              <div className="relative">
                <input
                  type="number"
                  value={maxPriceInput}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  onBlur={handleMaxPriceBlur}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-(--bereal-bg) border border-(--bereal-border) rounded-lg text-(--bereal-text-primary) placeholder:text-(--bereal-text-muted) focus:outline-none focus:border-(--bereal-primary) font-mono"
                  disabled={isSubmitting}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-(--bereal-text-secondary)">
                  ETH
                </span>
              </div>
            </div>

            {/* Total Cost */}
            {depositEth && maxPriceInput && (
              <div className="bg-(--bereal-primary)/10 border border-(--bereal-primary)/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-(--bereal-text-secondary)">
                    Estimated Total Cost
                  </span>
                  <span className="text-lg font-bold text-(--bereal-primary)">
                    {parseFloat(depositEth).toFixed(6)} ETH
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-(--bereal-danger)/10 border border-(--bereal-danger)/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-(--bereal-danger) shrink-0 mt-0.5" />
                <p className="text-sm text-(--bereal-danger)">{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitBid}
              disabled={
                isSubmitting ||
                !address ||
                isAuctionEnded ||
                !(Number(depositEth) > 0) ||
                !(Number(maxPriceInput) > 0) ||
                maxPriceQ96 < minBidPriceQ96
              }
              className="w-full bg-linear-to-r from-(--bereal-primary) to-(--bereal-accent) text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Bid...</span>
                </>
              ) : (
                <span>Submit Bid</span>
              )}
            </button>

            {!address && (
              <p className="text-xs text-(--bereal-text-muted) text-center mt-3">
                Please connect your wallet to place a bid
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
