import { NextRequest, NextResponse } from "next/server";
import { getAddressType } from "@/lib/utils";
import { limitFunction } from "p-limit";
import { OpenApi } from "@/lib/open-api";

const UNISAT_API = process.env.UNISAT_API!;
const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const runeIds = req.nextUrl.searchParams.get("coinIds");
  const pubkey = req.nextUrl.searchParams.get("pubkey") ?? "";
  try {
    if (!address || !runeIds) {
      throw new Error("Missing parameter(s)");
    }

    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const addressType = getAddressType(address);

    const runeIdsArr = runeIds.split(",");

    const limitGetAddressRunesUtxo = limitFunction(
      async (coinId: string) =>
        openApi.getAddressRunesUtxo(address, coinId).then((res) =>
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
        ),
      { concurrency: 2 }
    );

    const utxosRes = await Promise.all(
      runeIdsArr.map((id) => limitGetAddressRunesUtxo(id))
    );

    return NextResponse.json({
      success: true,
      data: utxosRes.flat(1),
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
      { status: 500 }
    );
  }
}
