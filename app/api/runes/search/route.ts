import { NextRequest, NextResponse } from "next/server";
import { queryRunes } from "@/lib/chain-api";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword");
  try {
    if (!keyword) {
      throw new Error("Missing parameter(s)");
    }
    const res = await queryRunes(keyword);

    return NextResponse.json({
      success: true,
      data: res,
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
