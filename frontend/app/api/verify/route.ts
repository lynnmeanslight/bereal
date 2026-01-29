import { IVerifyResponse, verifyCloudProof } from "@worldcoin/idkit";
import {} from "@worldcoin/idkit-core";
import { NextApiRequest, NextApiResponse } from "next";

export async function POST(request: Request) {
  try {
    const proof = await request.json();
    const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`;
    const action = process.env.NEXT_PUBLIC_WORLD_APP_ACTION_ID as string;
    console.log(app_id, action);
    const verifyRes = (await verifyCloudProof(
      proof,
      app_id,
      action,
    )) as IVerifyResponse;

    if (verifyRes.success) {
      // This is where you should perform backend actions if the verification succeeds
      // Such as, setting a user as "verified" in a database
      return Response.json(verifyRes, { status: 200 });
    } else {
      // This is where you should handle errors from the World ID /verify endpoint.
      // Usually these errors are due to a user having already verified.
      console.log(verifyRes);

      return Response.json(verifyRes, { status: 400 });
    }
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Unexpected error";

    return new Response(message, { status: 500 });
  }
}
