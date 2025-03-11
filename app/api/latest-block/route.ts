import { NextResponse } from "next/server";

import { OpenApi } from "@/lib/open-api";

export const dynamic = "force-dynamic";

const UNISAT_API = process.env.UNISAT_API!;
const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;

export async function GET() {
  try {
    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const { blocks } = await openApi.getBlockchainInfo();

    return NextResponse.json({
      success: true,
      data: blocks,
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
