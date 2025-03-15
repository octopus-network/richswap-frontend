import { NextRequest, NextResponse } from "next/server";

import { OpenApi } from "@/lib/open-api";

const UNISAT_API = process.env.UNISAT_API!;
const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword");
  try {
    if (!keyword) {
      throw new Error("Missing parameter(s)");
    }

    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const { detail } = await openApi.getRunesInfoList(keyword);

    return NextResponse.json({
      success: true,
      data: detail?.length
        ? detail.map(
            ({
              runeid,
              spacedRune,
              rune,
              symbol,
              divisibility,
              etching,
              number,
            }) => ({
              id: runeid,
              name: spacedRune,
              runeId: rune,
              runeSymbol: symbol,
              decimals: divisibility,
              etching,
              number,
            })
          )
        : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message || error.toString()
            : "Unkown Error",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
