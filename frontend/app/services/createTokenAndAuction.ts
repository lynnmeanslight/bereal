import { ethers } from "ethers";
import { AuctionParameters, UERC20Metadata } from "../lib/types";
import { BE_REAL_REGISTRY_ADDRESS, USUPERC20_FACTORY_ADDRESS } from "../lib/constants";
import { BeRealRegistry_ABI } from "../lib/abis/BeRealRegistry";
import { USUPERC20_FACTORY_ABI } from "../lib/abis/USUPERC20_FACTORY_ABI";

export type CreateTokenAndAuctionParams = {
  token: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    recipient: string;
    creator: string;
    homeChainId: bigint;
    metadata: UERC20Metadata;
    salt?: string;
  };
  auction: {
    amount: bigint;
    configData: string;
    salt?: string;
  };
  registryAddress?: string;
  factoryAddress?: string;
};

export async function createTokenAndAuction(
  signer: ethers.Signer,
  params: CreateTokenAndAuctionParams,
) {
  const registryAddress = params.registryAddress ?? BE_REAL_REGISTRY_ADDRESS;
  const factoryAddress = params.factoryAddress ?? USUPERC20_FACTORY_ADDRESS;

  // Step 1: Create token using USUPERC20 Factory
  const tokenFactory = new ethers.Contract(
    factoryAddress,
    USUPERC20_FACTORY_ABI,
    signer,
  );

  const tokenData = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "uint256",
      "address",
      "tuple(string description,string website,string image)",
    ],
    [params.token.homeChainId, params.token.creator, params.token.metadata],
  );

  const createTokenTx = await tokenFactory.createToken(
    params.token.name,
    params.token.symbol,
    params.token.decimals,
    params.token.totalSupply,
    params.token.recipient,
    tokenData,
    params.token.salt ?? ethers.ZeroHash,
  );

  const createTokenReceipt = await createTokenTx.wait();
  
  // Parse token address from factory events or return value
  let tokenAddress = "";
  const factoryInterface = new ethers.Interface(USUPERC20_FACTORY_ABI);
  
  // Try to get from transaction return value first
  try {
    tokenAddress = await tokenFactory.createToken.staticCall(
      params.token.name,
      params.token.symbol,
      params.token.decimals,
      params.token.totalSupply,
      params.token.recipient,
      tokenData,
      params.token.salt ?? ethers.ZeroHash,
    );
  } catch (e) {
    // If staticCall fails, try to parse from logs
    for (const log of createTokenReceipt?.logs ?? []) {
      try {
        const parsed = factoryInterface.parseLog(log);
        if (parsed && parsed.args?.token) {
          tokenAddress = parsed.args.token as string;
          break;
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (!tokenAddress) {
    throw new Error("Failed to retrieve created token address");
  }

  // Step 2: Approve BeRealRegistry to spend tokens
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ["function approve(address spender, uint256 amount) returns (bool)"],
    signer,
  );

  const approveTx = await tokenContract.approve(
    registryAddress,
    params.auction.amount,
  );
  await approveTx.wait();

  // Step 3: Create auction using BeRealRegistry
  const registry = new ethers.Contract(
    registryAddress,
    BeRealRegistry_ABI,
    signer,
  );

  const createAuctionTx = await registry.createAuctionWithApproval(
    tokenAddress,
    params.auction.amount,
    params.auction.configData,
    params.auction.salt ?? ethers.ZeroHash,
  );

  const createAuctionReceipt = await createAuctionTx.wait();

  // Parse auction address from events
  let auctionAddress = "";
  const registryInterface = new ethers.Interface(BeRealRegistry_ABI);
  
  for (const log of createAuctionReceipt?.logs ?? []) {
    try {
      const parsed = registryInterface.parseLog(log);
      if (parsed?.name === "AuctionRecorded") {
        auctionAddress = (parsed.args?.auction as string) ?? auctionAddress;
      }
    } catch {
      /* ignore non-registry logs */
    }
  }

  return {
    txHash: createAuctionReceipt?.hash,
    blockNumber: createAuctionReceipt?.blockNumber,
    tokenAddress: tokenAddress,
    auctionAddress: auctionAddress,
    createTokenTxHash: createTokenReceipt?.hash,
    approveTxHash: approveTx.hash,
  };
}
