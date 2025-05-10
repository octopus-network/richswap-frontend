import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { UnspentOutput } from "@/types";
import { hexToBytes } from "@/lib/utils";

const UTXO_PROOF_SERVER = process.env.UTXO_PROOF_SERVER!;

export async function POST(req: NextRequest) {
  const { utxos, address } = await req.json();

  try {
    if (!address || !utxos.length) {
      throw new Error("Missing parameter(s)");
    }

    const res = await axios.post(`${UTXO_PROOF_SERVER}/get_proof`, {
      network: "Mainnet",
      btc_address: address,
      utxos: utxos.map(({ height, txid, satoshis, vout }: UnspentOutput) => ({
        outpoint: {
          txid: Array.from(hexToBytes(txid)),
          vout,
        },
        value: Number(satoshis),
        height,
      })),
    });

    console.log(res);
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
