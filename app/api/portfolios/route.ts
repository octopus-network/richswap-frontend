import { NextRequest, NextResponse } from "next/server";
import { Exchange } from "@/lib/exchange";

import { PoolInfo } from "@/types";

const STORAGE_URL = process.env.UNISAT_API!;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const pools = (await fetch(`${STORAGE_URL}/pool-list.json`, {
      cache: "no-cache",
    }).then((res) => res.json())) as PoolInfo[];

    const portfolios = await Promise.all(
      pools.map((pool) => Exchange.getPosition(pool, address))
    ).then((res) => res.filter((position) => !!position));

    return NextResponse.json({
      success: true,
      data: portfolios,
    });
  } catch (error) {
    console.log(error);
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
