import { NextResponse } from "next/server";
import { IVerifyResponse, verifyCloudProof } from "@worldcoin/idkit";

// Pure verification endpoint: validates the proof with World ID and returns the result.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`;
    const envAction = process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID as string;

    if (!app_id || !envAction) {
      return NextResponse.json(
        { error: "World ID env not configured" },
        { status: 500 },
      );
    }


    const action = body?.action || body?.action || envAction;
    console.log("this is request body");
    console.log(body);
    
    
    

    const verifyRes = (await verifyCloudProof(
      body,
      app_id,
      action,
    )) as IVerifyResponse;
    console.log(verifyRes);

    if (!verifyRes.success) {
      return NextResponse.json(verifyRes, { status: 400 });
    }

    return NextResponse.json(verifyRes, { status: 200 });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("POST /api/verify error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
