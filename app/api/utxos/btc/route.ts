import { NextRequest, NextResponse } from "next/server";
import { getAddressType } from "@/lib/utils";

import { Maestro } from "@/lib/maestro";

const MAESTRO_API_URL = process.env.MAESTRO_API_URL!;
const MAESTRO_API_KEY = process.env.MAESTRO_API_KEY!;

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    const pubkey = req.nextUrl.searchParams.get("pubkey") ?? "";
    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const maestro = new Maestro({
      baseUrl: MAESTRO_API_URL,
      apiKey: MAESTRO_API_KEY,
    });

    let cursor = null;
    const data = [];

    do {
      const res = await maestro.utxosByAddressMempoolAware(address, cursor);
      data.push(...res.data);
      cursor = res.next_cursor;
    } while (cursor !== null);

    console.log("res", data);

    const addressType = getAddressType(address);

    const utxos = data.map((utxo) => ({
      pubkey,
      addressType,
      txid: utxo.txid,
      vout: utxo.vout,
      satoshis: utxo.satoshis.toString(),
      scriptPk: utxo.script_pubkey,
      address,
      height: utxo.height,
      runes: [],
    }));

    return NextResponse.json({
      success: true,
      data: utxos,
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
