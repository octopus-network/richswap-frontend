import { NextRequest, NextResponse } from "next/server";

import { BITCOIN } from "@/lib/constants";
import { Maestro } from "@/lib/maestro";

import Decimal from "decimal.js";

const MAESTRO_API_URL = process.env.MAESTRO_API_URL!;
const MAESTRO_API_KEY = process.env.MAESTRO_API_KEY!;

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const maestro = new Maestro({
      baseUrl: MAESTRO_API_URL,
      apiKey: MAESTRO_API_KEY,
    });

    const [satoshiBalance, runes] = await Promise.all([
      maestro.satoshiBalanceByAddress(address),
      maestro.runesByAddress(address),
    ]);

    const data = {
      [BITCOIN.id]: new Decimal(satoshiBalance.data)
        .div(Math.pow(10, 8))
        .toFixed(),
      ...runes.data,
    };

    return NextResponse.json({
      success: true,
      data,
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
