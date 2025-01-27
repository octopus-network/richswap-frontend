import { NextRequest, NextResponse } from "next/server";

import Decimal from "decimal.js";
import { getBtcPrice } from "@/lib/chain-api";
import { parseCoinAmount } from "@/lib/utils";
import { Exchange } from "@/lib/exchange";
import { SwapState } from "@/types";
import { COIN_LIST, BITCOIN } from "@/lib/constants";

const INPUT_BTC_AMOUNT = "0.00005";

async function getPriceInBtc(coinId: string) {
  const coin = COIN_LIST.find((c) => c.id === coinId);
  if (!coin) {
    return 0;
  }

  const inputAmount = parseCoinAmount(INPUT_BTC_AMOUNT, BITCOIN);
  const res = await Exchange.preSwap(BITCOIN, coin, inputAmount);

  if (!res || res.state !== SwapState.VALID) {
    return 0;
  }

  return res.outputAmount
    ? new Decimal(res.outputAmount).div(Math.pow(10, coin.decimals)).toNumber()
    : 0;
}

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  try {
    if (!ids) {
      throw new Error("Missing parameter(s)");
    }

    const btcPrice = await getBtcPrice();

    const idsArr = ids.split(",").filter((id) => id !== BITCOIN.id);

    const pricesInBtc = await Promise.all(
      idsArr.map((id) => getPriceInBtc(id))
    );

    const tmpObj: Record<string, number> = { [BITCOIN.id]: btcPrice };

    pricesInBtc.forEach((price, idx) => {
      const id = idsArr[idx];
      tmpObj[id] = new Decimal(btcPrice * Number(INPUT_BTC_AMOUNT))
        .div(price)
        .toNumber();
    });

    return NextResponse.json({
      success: true,
      data: tmpObj,
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
