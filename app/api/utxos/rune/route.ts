import { NextRequest, NextResponse } from "next/server";
import { addressToScriptPk, bytesToHex, getAddressType } from "@/lib/utils";

import { Maestro } from "@/lib/maestro";

const MAESTRO_API_URL = process.env.MAESTRO_API_URL!;
const MAESTRO_API_KEY = process.env.MAESTRO_API_KEY!;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const runeid = req.nextUrl.searchParams.get("runeid");
  const pubkey = req.nextUrl.searchParams.get("pubkey") ?? "";
  try {
    if (!address || !runeid) {
      throw new Error("Missing parameter(s)");
    }

    const maestro = new Maestro({
      baseUrl: MAESTRO_API_URL,
      apiKey: MAESTRO_API_KEY,
    });

    let cursor = null;
    const data = [];

    do {
      const res = await maestro.runeUtxosByAddress(address, runeid, cursor);
      data.push(...res.data);
      cursor = res.next_cursor;
    } while (cursor !== null);

    const addressType = getAddressType(address);

    const scriptPk = addressToScriptPk(address);

    const utxos = data.map((utxo) => ({
      pubkey,
      txid: utxo.txid,
      vout: utxo.vout,
      satoshis: utxo.satoshis.toString(),
      scriptPk: bytesToHex(scriptPk),
      address,
      height: utxo.height,
      addressType,
      runes: utxo.runes.map((rune) => ({
        id: rune.rune_id,
        amount: rune.amount.toString(),
      })),
    }));

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
