import { NextRequest, NextResponse } from "next/server";
import { getAddressType } from "@/lib/utils";

import { OpenApi } from "@/lib/open-api";
import axios from "axios";

const UNISAT_API_KEY = process.env.UNISAT_API_KEY!;

async function getLatestBlockHeight() {
  const data = await axios
    .get("https://blockchain.info/q/getblockcount")
    .then((res) => res.data);

  return data;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const pubkey = req.nextUrl.searchParams.get("pubkey") ?? "";
  try {
    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const openapi = new OpenApi({
      baseUrl: "https://open-api.unisat.io",
      apiKey: UNISAT_API_KEY,
    });

    const addressType = getAddressType(address);

    const blockHeight = await getLatestBlockHeight();

    const utxos = await openapi.getAddressUtxoData(address).then((res) =>
      res.utxo
        .filter(
          ({ height, inscriptions }) =>
            height <= Number(blockHeight) && !inscriptions.length
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
