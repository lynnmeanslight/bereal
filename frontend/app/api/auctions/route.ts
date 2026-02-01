import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client.js";
import { createPublicClient, http } from "viem";
import { unichainSepolia } from "viem/chains";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const RPC_URL = process.env.RPC_URL || "https://sepolia.unichain.org";
const CHAIN_ID = Number(process.env.CHAIN_ID || 1301);

export async function GET() {
  const client = createPublicClient({
    chain: CHAIN_ID === unichainSepolia.id ? unichainSepolia : undefined,
    transport: http(RPC_URL),
  });

  const currentBlock = await client.getBlockNumber();

  const auctions = await prisma.auction.findMany({
    where: {
      chainId: CHAIN_ID,
      startBlock: { lte: currentBlock },
      endBlock: { gt: currentBlock },
    },
    orderBy: { blockNumber: "desc" },
    take: 200,
  });

  const payload = auctions.map((a) => ({
    id: a.id,
    chainId: a.chainId,
    token: a.token,
    amount: a.amount,
    configHash: a.configHash,
    creator: a.creator,
    startBlock: a.startBlock.toString(),
    endBlock: a.endBlock.toString(),
    claimBlock: a.claimBlock.toString(),
    blockNumber: a.blockNumber.toString(),
    logIndex: a.logIndex,
    txHash: a.txHash,
    active: a.active,
    createdAt: a.createdAt.toISOString(),
  }));

  return NextResponse.json({ currentBlock: currentBlock.toString(), auctions: payload });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      auction,
      token,
      amount,
      configHash,
      creator,
      startBlock,
      endBlock,
      claimBlock,
      blockNumber,
      logIndex = 0,
      txHash,
      chainId = CHAIN_ID,
      configData,
    } = body || {};

    if (!auction || !token || !amount || !startBlock || !endBlock || !claimBlock || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const chainIdNum = Number(chainId);
    const auctionId = String(auction).toLowerCase();

    await prisma.auction.upsert({
      where: { id_chainId: { id: auctionId, chainId: chainIdNum } },
      create: {
        id: auctionId,
        chainId: chainIdNum,
        token: String(token).toLowerCase(),
        amount: String(amount),
        configHash: String(configHash || ""),
        creator: String(creator || "").toLowerCase(),
        startBlock: BigInt(startBlock),
        endBlock: BigInt(endBlock),
        claimBlock: BigInt(claimBlock),
        blockNumber: BigInt(blockNumber || 0),
        logIndex: Number(logIndex || 0),
        txHash: txHash,
        active: true,
      },
      update: {
        token: String(token).toLowerCase(),
        amount: String(amount),
        configHash: String(configHash || ""),
        creator: String(creator || "").toLowerCase(),
        startBlock: BigInt(startBlock),
        endBlock: BigInt(endBlock),
        claimBlock: BigInt(claimBlock),
        blockNumber: BigInt(blockNumber || 0),
        logIndex: Number(logIndex || 0),
        txHash: txHash,
        active: true,
      },
    });

    if (configData) {
      const bytes = typeof configData === "string" && configData.startsWith("0x")
        ? Buffer.from(configData.slice(2), "hex")
        : configData;

      await prisma.rawConfig.upsert({
        where: { auctionId_chainId: { auctionId, chainId: chainIdNum } },
        create: { auctionId, chainId: chainIdNum, configData: bytes },
        update: { configData: bytes },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auctions error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
