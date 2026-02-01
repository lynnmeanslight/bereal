import { ethers } from "ethers";
import { NextResponse } from "next/server";

type TokenBalanceItem = {
  contractAddress: string;
  tokenBalance: string;
};

type AlchemyTokenBalancesResponse = {
  jsonrpc: string;
  id: number;
  result: {
    address: string;
    tokenBalances: Array<TokenBalanceItem>;
  };
};

type AlchemyTokenMetadataResponse = {
  jsonrpc: string;
  id: number;
  result: {
    name?: string;
    symbol?: string;
    decimals?: number;
  };
};

const NETWORK_BY_CHAIN: Record<number, string> = {
  1301: "unichain-sepolia",
};

const callAlchemy = async <T,>(
  apiKey: string,
  network: string,
  method: string,
  params: unknown[],
): Promise<T> => {
  const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  });

  if (!res.ok) {
    throw new Error(`Alchemy request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") || "";
  const chainIdParam = searchParams.get("chainId") || "";
  const chainId = Number(chainIdParam);

  if (!address) {
    return NextResponse.json({ tokens: [] });
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Alchemy API key" },
      { status: 500 },
    );
  }

  const network = NETWORK_BY_CHAIN[chainId];
  if (!network) {
    return NextResponse.json(
      { error: "Unsupported chain" },
      { status: 400 },
    );
  }

  try {
    const balances = await callAlchemy<AlchemyTokenBalancesResponse>(
      apiKey,
      network,
      "alchemy_getTokenBalances",
      [address, "erc20"],
    );

    const nonZero = balances.result.tokenBalances.filter((item) => {
      try {
        return BigInt(item.tokenBalance || "0x0") > BigInt(0);
      } catch {
        return false;
      }
    });

    const tokens = await Promise.all(
      nonZero.map(async (item) => {
        const meta = await callAlchemy<AlchemyTokenMetadataResponse>(
          apiKey,
          network,
          "alchemy_getTokenMetadata",
          [item.contractAddress],
        );

        let balance = "0";
        try {
          const raw = BigInt(item.tokenBalance || "0x0");
          const decimals = meta.result.decimals ?? 18;
          balance = ethers.formatUnits(raw, decimals);
        } catch {
          balance = "0";
        }

        return {
          address: item.contractAddress,
          symbol: meta.result.symbol,
          name: meta.result.name,
          decimals: meta.result.decimals,
          balance,
        };
      }),
    );

    return NextResponse.json({ tokens });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tokens" },
      { status: 500 },
    );
  }
}
