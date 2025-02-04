import { NextRequest, NextResponse } from "next/server";
import { getBtcUtxos, getRuneList, getRuneUtxos } from "@/lib/chain-api";
import { BITCOIN } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  try {
    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const promises = [];
    promises.push(getBtcUtxos(address));

    const runeList = await getRuneList(address);

    runeList.forEach((rune) => {
      if (rune.runeid !== BITCOIN.id) {
        promises.push(getRuneUtxos(address, rune.runeid));
      }
    });

    const res = await Promise.all(promises);

    return NextResponse.json({
      success: true,
      data: res.flat(1),
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
