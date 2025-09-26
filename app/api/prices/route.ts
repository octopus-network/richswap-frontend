import { NextRequest, NextResponse } from "next/server";

import Decimal from "decimal.js";

import { PoolInfo } from "@/types";
import { BITCOIN } from "@/lib/constants";
import { Maestro } from "@/lib/maestro";

export const dynamic = "force-dynamic";

const STORAGE_URL = process.env.STORAGE_URL!;

const MAESTRO_API_URL = process.env.MAESTRO_API_URL!;
const MAESTRO_API_KEY = process.env.MAESTRO_API_KEY!;

async function getPriceInBtc(coinId: string) {
  const pools = (await fetch(`${STORAGE_URL}/pool-list.json`, {
    cache: "no-cache",
  }).then((res) => res.json())) as PoolInfo[];

  const pool = pools.find((pool) => pool.coinB.id === coinId);
  if (!pool) {
    return 0;
  }

  const coinInBtc =
    pool.coinA.balance !== "0" && pool.coinB.balance !== "0"
      ? new Decimal(pool.coinA.balance)
          .div(Math.pow(10, pool.coinA.decimals))
          .div(
            new Decimal(pool.coinB.balance).div(
              Math.pow(10, pool.coinB.decimals)
            )
          )
          .toNumber()
      : 0;

  return coinInBtc;
}

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  try {
    if (!ids) {
      throw new Error("Missing parameter(s)");
    }

    const maestro = new Maestro({
      baseUrl: MAESTRO_API_URL,
      apiKey: MAESTRO_API_KEY,
    });

    const { price: btcPrice } = await maestro.btcPriceByTimestamp(
      Math.floor(Date.now() / 1000)
    );

    const idsArr = ids.split(",").filter((id) => id !== BITCOIN.id);

    const pricesInBtc = await Promise.all(
      idsArr.map((id) => getPriceInBtc(id))
    );

    const tmpObj: Record<string, number> = { [BITCOIN.id]: btcPrice };

    pricesInBtc.forEach((price, idx) => {
      const id = idsArr[idx];
      tmpObj[id] = new Decimal(btcPrice * price).toNumber();
    });

    return NextResponse.json({
      success: true,
      data: tmpObj,
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
