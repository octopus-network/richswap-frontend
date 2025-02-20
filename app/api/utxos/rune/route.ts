import { NextRequest, NextResponse } from "next/server";
import { getAddressType } from "@/lib/utils";

import { OpenApi } from "@/lib/open-api";

const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const runeid = req.nextUrl.searchParams.get("runeid");
  const pubkey = req.nextUrl.searchParams.get("pubkey") ?? "";
  try {
    if (!address || !runeid) {
      throw new Error("Missing parameter(s)");
    }

    const openapi = new OpenApi({
      baseUrl: "https://open-api.unisat.io",
      apiKey: UNISAT_API_KEY,
    });

    const addressType = getAddressType(address);

    const utxos = await openapi
      .getAddressRunesUtxo(address, runeid)
      .then((res) =>
        res.utxo.map((utxo) => ({
          pubkey,
          txid: utxo.txid,
          vout: utxo.vout,
          satoshis: utxo.satoshi.toString(),
          scriptPk: utxo.scriptPk,
          address,
          addressType,
          runes: utxo.runes.map((rune) => ({
            id: rune.runeid,
            amount: rune.amount.toString(),
          })),
        }))
      );

    return NextResponse.json({
      success: true,
      data: utxos,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      error:
        error instanceof Error
          ? error.message || error.toString()
          : "Unkown Error",
      success: false,
    });
  }
}
