import { NextRequest, NextResponse } from "next/server";
import { Exchange } from "@/lib/exchange";
import axios from "axios";

import { PoolInfo } from "@/types";

const STORAGE_URL = process.env.STORAGE_URL!;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const pools = (await axios(`${STORAGE_URL}/pool-list.json`).then(
      (res) => res.data
    )) as PoolInfo[];

    const portfolios = await Promise.all(
      pools.map((pool) => Exchange.getPosition(pool.address, address))
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
