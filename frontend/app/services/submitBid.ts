import { ethers } from "ethers";
import { AuctionABI } from "../lib/abis/AuctionABI";

export async function submitBidETH({
  auctionAddress,
  signer,
  depositEth,
  maxPriceEth,
}: {
  auctionAddress: string;
  signer: ethers.Signer;
  depositEth: string;
  maxPriceEth: string;
}) {
  const Q96 = BigInt(1) << BigInt(96);

  if (!ethers.isAddress(auctionAddress)) {
    throw new Error("Invalid auction address");
  }

  const depositWei = ethers.parseEther(depositEth);
  const owner = await signer.getAddress();

  const auction = new ethers.Contract(auctionAddress, AuctionABI, signer);

  // ---- read on-chain tick config ----
  const floorPrice: bigint = await auction.floorPrice();
  const tickSpacing: bigint = await auction.tickSpacing();

  // ---- user price → Q96 ----
  const rawMaxPriceQ96 =
    (ethers.parseEther(maxPriceEth) * Q96) / BigInt(10) ** BigInt(18);

  if (rawMaxPriceQ96 <= floorPrice) {
    throw new Error("Max price must be above floor price");
  }

  // ---- SNAP TO TICK GRID (THIS IS THE KEY FIX) ----
  const snappedMaxPriceQ96 =
    floorPrice +
    ((rawMaxPriceQ96 - floorPrice) / tickSpacing) * tickSpacing;

  // Optional: round UP instead of down
  // const snappedMaxPriceQ96 =
  //   floorPrice +
  //   (((rawMaxPriceQ96 - floorPrice + tickSpacing - 1n) / tickSpacing) * tickSpacing);

  return auction.submitBid(
    snappedMaxPriceQ96,
    depositWei,
    owner,
    floorPrice, // // valid prev tick
    "0x",
    { value: depositWei, gasLimit: BigInt(500_000) }
  );
}
