import { ethers } from "ethers";
import { UERC20Metadata } from "../lib/types";
import { USUPERC20_FACTORY_ABI } from "../lib/abis/USUPERC20_FACTORY_ABI";

export async function createUSUPERC20(
  signer: ethers.Signer,
  factoryAddress: string,
  params: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    recipient: string;
    creator: string; // address(this) in tests
    homeChainId: bigint; // block.chainid
    metadata: UERC20Metadata;
    salt: string; // bytes32
  },
) {
  const factory = new ethers.Contract(
    factoryAddress,
    USUPERC20_FACTORY_ABI,
    signer,
  );

  // 🔑 ABI ENCODE: (uint256, address, UERC20Metadata)
  const data = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "uint256",
      "address",
      "tuple(string description,string website,string image)",
    ],
    [params.homeChainId, params.creator, params.metadata],
  );

  const tx = await factory.createToken(
    params.name,
    params.symbol,
    params.decimals,
    params.totalSupply,
    params.recipient,
    data,
    params.salt,
  );

  const receipt = await tx.wait();
  return receipt;
}
