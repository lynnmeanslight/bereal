import { ethers } from "ethers";
import { ContinuousClearingAuctionFactory_ABI } from "../lib/abis/ContinuousClearingAuctionFactory";
import { AuctionParameters } from "../lib/types";
import { CCA_FACTORY_ADDRESS } from "../lib/constants";

export async function initializeDistribution(
  signer: ethers.Signer,
  tokenAddress: string,
  totalAuctionSupply: bigint,
  auctionParams: AuctionParameters,
) {
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

  const factory = new ethers.Contract(
    CCA_FACTORY_ADDRESS,
    ContinuousClearingAuctionFactory_ABI,
    signer,
  );

  const tx = await factory.initializeDistribution(
    tokenAddress,
    totalAuctionSupply,
    encodedParams,
    ethers.ZeroHash,
  );

  const receipt = await tx.wait();

  // ⚠️ Prefer decoding events if ABI exposes them
  const auctionAddress = receipt!.logs[0].address;

  return {
    txHash: receipt!.hash,
    auctionAddress,
  };
}