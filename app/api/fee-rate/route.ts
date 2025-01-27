import { NextResponse } from "next/server";
import { getFeeSummary } from "@/lib/chain-api";

export async function GET() {
  try {
    const feeSummary = await getFeeSummary();
    return NextResponse.json({
      success: true,
      data: feeSummary,
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
