import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword");
  try {
    if (!keyword) {
      throw new Error("Missing parameter(s)");
    }
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
