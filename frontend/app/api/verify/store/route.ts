import { NextResponse } from "next/server";
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_CHAIN_ID = Number(process.env.CHAIN_ID || 0);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get("walletAddress") || "";
  const action = searchParams.get("action") || "";
  const chainId = Number(searchParams.get("chainId") ?? DEFAULT_CHAIN_ID);
  const nullifierHash = searchParams.get("nullifierHash") || "";

  if (nullifierHash) {
    const records = await prisma.$queryRaw<
      Array<{
        walletAddress: string;
        action: string;
        chainId: number;
        verifiedAt: Date;
        nullifierHash: string;
      }>
    >`
      SELECT "walletAddress", "action", "chainId", "verifiedAt", "nullifierHash"
      FROM "HumanVerification"
      WHERE "nullifierHash" = ${nullifierHash}
      LIMIT 1
    `;
    const record = records[0];

    return NextResponse.json({
      exists: Boolean(record),
      walletAddress: record?.walletAddress || null,
      action: record?.action || null,
      chainId: record?.chainId ?? null,
      verifiedAt: record?.verifiedAt?.toISOString() || null,
    });
  }

  if (!walletAddress || !action || !Number.isFinite(chainId)) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const records = await prisma.$queryRaw<
    Array<{
      nullifierHash: string;
      verifiedAt: Date;
    }>
  >`
    SELECT "nullifierHash", "verifiedAt"
    FROM "HumanVerification"
    WHERE "walletAddress" = ${walletAddress.toLowerCase()}
      AND "action" = ${action}
      AND "chainId" = ${chainId}
    LIMIT 1
  `;
  const record = records[0];

  return NextResponse.json({
    verified: Boolean(record),
    nullifierHash: record?.nullifierHash || null,
    verifiedAt: record?.verifiedAt?.toISOString() || null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const envAction = process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID as string;

    const proof = body?.proof || body; // Accept either wrapped or raw proof payload
    const action = body?.action || proof?.action || envAction;
    const chainId = Number(body?.chainId ?? proof?.chain_id ?? DEFAULT_CHAIN_ID);
    const walletAddress = (body?.walletAddress || proof?.signal || "").toString();
    console.log("IN verify store");
    
    console.log(walletAddress);
    

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }
    if (!Number.isFinite(chainId)) {
      return NextResponse.json({ error: "Missing chainId" }, { status: 400 });
    }

    const nullifierHash = proof?.nullifier_hash || proof?.nullifierHash;
    if (!nullifierHash) {
      return NextResponse.json({ error: "Missing nullifier" }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO "HumanVerification" ("walletAddress", "nullifierHash", "action", "chainId")
      VALUES (
        ${walletAddress.toLowerCase()},
        ${String(nullifierHash)},
        ${String(action)},
        ${chainId}
      )
    `;

    return NextResponse.json({ ok: true, reused: false });
  } catch (err: any) {
    if (err?.code === "P2002" || err?.code === "23505") {
      return NextResponse.json({ ok: false, reused: true, message: "World ID proof already used" }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Server error";
    console.error("POST /api/verify/store error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
