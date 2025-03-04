import { NextRequest, NextResponse } from "next/server";
import { getAddressType } from "@/lib/utils";

import { OpenApi } from "@/lib/open-api";

const UNISAT_API = process.env.UNISAT_API!;
const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const pubkey = req.nextUrl.searchParams.get("pubkey") ?? "";
  try {
    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const openApi = new OpenApi({
      baseUrl: UNISAT_API,
      apiKey: UNISAT_API_KEY,
    });

    const addressType = getAddressType(address);

    const { blocks } = await openApi.getBlockchainInfo();

    const utxos = await openApi.getAddressUtxoData(address).then((res) =>
      res.utxo
        .filter(
          ({ height, inscriptions }) => height <= blocks && !inscriptions.length
        )
        .map((utxo) => ({
          pubkey,
          addressType,
          txid: utxo.txid,
          vout: utxo.vout,
          satoshis: utxo.satoshi.toString(),
          scriptPk: utxo.scriptPk,
          address,
          runes: [],
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
