import { NextResponse } from "next/server";
import { getLatestBlockHeight } from "@/lib/chain-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const blockHeight = await getLatestBlockHeight();

    return NextResponse.json({
      success: true,
      data: blockHeight,
    });
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unkown Error",
      success: false,
    });
  }
}
