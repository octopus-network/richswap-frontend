import { NextResponse } from "next/server";
import { Exchange } from "@/lib/exchange";
import { OpenApi } from "@/lib/open-api";
import { UNKNOWN_COIN, BITCOIN } from "@/lib/constants";

export const dynamic = "force-dynamic";

const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;
const UNISAT_API = process.env.UNISAT_API!;

export async function GET() {
  const res = await Exchange.getPoolList();

  const pools = [];

  const openApi = new OpenApi({
    baseUrl: UNISAT_API,
    apiKey: UNISAT_API_KEY,
  });

  const coinRes = await Promise.all(
    res.map(({ name }) => openApi.getRunesInfoList(name))
  );

  for (let i = 0; i < res.length; i++) {
    const { name, address, btcReserved, key } = res[i];

    const coinA = BITCOIN;
    const { detail: coinBRes } = coinRes[i];

    let coinB = UNKNOWN_COIN;
    if (coinBRes.length) {
      const {
        spacedRune,
        rune,
        symbol,
        divisibility,
        etching,
        runeid,
        number,
      } = coinBRes[0];

      coinB = {
        id: runeid,
        name: spacedRune,
        runeId: rune,
        runeSymbol: symbol,
        decimals: divisibility,
        etching,
        number,
      };
    }

    pools.push({
      key,
      address,
      name,
      btcReserved,
      coinA,
      coinB,
      incomes: "1000",
    });
  }

  return NextResponse.json({
    success: true,
    data: pools,
  });
}
