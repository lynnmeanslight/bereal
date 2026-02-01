import { ethers } from "ethers";
import { AuctionParameters } from "../lib/types";
import { BE_REAL_REGISTRY_ADDRESS } from "../lib/constants";
import { BeRealRegistry_ABI } from "../lib/abis/BeRealRegistry";

export async function initializeDistribution(
  signer: ethers.Signer,
  tokenAddress: string,
  totalAuctionSupply: bigint,
  auctionParams: AuctionParameters,
  chainId?: number,
  auctionSalt: string = ethers.ZeroHash,
) {
  console.log(signer);
  console.log(tokenAddress);
  console.log(totalAuctionSupply);
  console.log(auctionParams);
  console.log(chainId);
  console.log(auctionSalt);

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

  // Pre-approve registry to pull the tokens so initializeFull can fund + notify in a single tx
  const erc20Abi = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
  ];

  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
  const sender = await signer.getAddress();

  const currentAllowance = await tokenContract.allowance(
    sender,
    BE_REAL_REGISTRY_ADDRESS,
  );

  if (currentAllowance < totalAuctionSupply) {
    const approveTx = await tokenContract.approve(
      BE_REAL_REGISTRY_ADDRESS,
      totalAuctionSupply,
    );
    await approveTx.wait();
  }

  const registry = new ethers.Contract(
    BE_REAL_REGISTRY_ADDRESS,
    BeRealRegistry_ABI,
    signer,
  );

  const tx = await registry.createAuctionWithApproval(
    tokenAddress,
    totalAuctionSupply,
    encodedParams,
    auctionSalt,
    { gasLimit: BigInt(12_000_000) },
  );

  const receipt = await tx.wait();
  const iface = new ethers.Interface(BeRealRegistry_ABI);

  const auctionAddress = (() => {
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "AuctionRecorded") {
          return parsed.args?.auction as string;
        }
      } catch (err) {
        // skip non-registry logs
      }
    }
    // Fallback: first log address if parsing fails
    return receipt?.logs?.[0]?.address ?? "";
  })();

  return {
    txHash: receipt!.hash,
    blockNumber: receipt!.blockNumber,
    configData: encodedParams,
    auctionAddress,
    chainId,
  };
}
