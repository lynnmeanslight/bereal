import { ethers } from "ethers";

export const MPS = 10_000_000; // uint24, exactly matches Solidity

export class AuctionStepsBuilderTS {
  private data: string;

  private constructor() {
    this.data = "0x";
  }

  static init(): AuctionStepsBuilderTS {
    return new AuctionStepsBuilderTS();
  }

  /** Solidity: addStep(uint24 mps, uint40 blockDelta) */
  addStep(
    mps: number | bigint,
    blockDelta: number | bigint,
  ): AuctionStepsBuilderTS {
    const packed = ethers.solidityPacked(
      ["uint24", "uint40"],
      [mps, blockDelta],
    );
    this.data = ethers.concat([this.data, packed]);
    return this;
  }

  /** Solidity: splitEvenlyAmongSteps(uint40 numberOfSteps) */
  splitEvenlyAmongSteps(numberOfSteps: number | bigint): AuctionStepsBuilderTS {
    const mps = BigInt(MPS) / BigInt(numberOfSteps);
    const packed = ethers.solidityPacked(
      ["uint24", "uint40"],
      [mps, numberOfSteps],
    );
    this.data = ethers.concat([this.data, packed]);
    return this;
  }

  build(): string {
    return this.data;
  }
}

export function buildAuctionSteps({
  startBlock,
  endBlock,
}: {
  startBlock: bigint;
  endBlock: bigint;
}): `0x${string}` {
  if (endBlock <= startBlock) {
    throw new Error("endBlock must be greater than startBlock");
  }

  const totalBlocks = Number(endBlock - startBlock);

  if (totalBlocks < 20) {
    throw new Error("Auction duration too short");
  }

  // Block distribution (50% / 45% / remainder)
  const step1Blocks = Math.floor(totalBlocks * 0.5);
  const step2Blocks = Math.floor(totalBlocks * 0.45);
  const step3Blocks = totalBlocks - step1Blocks - step2Blocks;

  if (step3Blocks <= 0) {
    throw new Error("Final auction step must have at least 1 block");
  }

  // segment-level issuance (must sum to MPS)
  const SEG1 = BigInt(1_000_000); // 10%
  const SEG2 = BigInt(4_900_000); // 49%
  const TOTAL_MPS = BigInt(MPS);

  
  const step1Mps = SEG1 / BigInt(step1Blocks);
  const step2Mps = SEG2 / BigInt(step2Blocks);

  const usedMps =
    step1Mps * BigInt(step1Blocks) + step2Mps * BigInt(step2Blocks);
  const remainingMps = TOTAL_MPS - usedMps;

  if (remainingMps <= BigInt(0)) {
    throw new Error("Final auction step too weak");
  }

  const step3BlocksBig = BigInt(step3Blocks);
  const baseStep3Mps = remainingMps / step3BlocksBig;
  const remainder = remainingMps % step3BlocksBig;

  if (baseStep3Mps <= BigInt(0)) {
    throw new Error("Final auction step too weak");
  }

  const builder = AuctionStepsBuilderTS.init()
    .addStep(step1Mps, BigInt(step1Blocks))
    .addStep(step2Mps, BigInt(step2Blocks));

  if (remainder > BigInt(0)) {
    builder
      .addStep(baseStep3Mps + BigInt(1), remainder)
      .addStep(baseStep3Mps, step3BlocksBig - remainder);
  } else {
    builder.addStep(baseStep3Mps, step3BlocksBig);
  }

  return builder.build() as `0x${string}`;
}
