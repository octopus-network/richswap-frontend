import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { UnspentOutput } from "@/types";
import { hexToBytes, reverseBuffer } from "@/lib/utils";
import { NETWORK } from "@/lib/constants";

const UTXO_PROOF_SERVER = process.env.UTXO_PROOF_SERVER!;

export async function POST(req: NextRequest) {
  const { utxos, address } = await req.json();

  try {
    if (!address || !utxos.length) {
      throw new Error("Missing parameter(s)");
    }

    console.log(utxos);

    const data = await axios
      .post(`${UTXO_PROOF_SERVER}/get_proof`, {
        network: NETWORK === "mainnet" ? "Mainnet" : "Testnet",
        btc_address: address,
        utxos: utxos.map(({ height, txid, satoshis, vout }: UnspentOutput) => ({
          outpoint: {
            txid: Array.from(reverseBuffer(hexToBytes(txid))),
            vout,
          },
          value: Number(satoshis),
          height,
        })),
      })
      .then((res) => res.data);

    return NextResponse.json({
      success: true,
      data: data.Ok ?? [],
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
