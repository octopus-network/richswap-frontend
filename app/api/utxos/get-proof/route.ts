import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { UnspentOutput } from "@/types";

const UTXO_PROOF_SERVER = process.env.UTXO_PROOF_SERVER!;

export async function POST(req: NextRequest) {
  const { utxos } = await req.json();

  try {
    if (!utxos.length) {
      throw new Error("Missing parameter(s)");
    }

    const data = await axios
      .post<{
        utxos: {
          txid: string;
          vout: number;
          status: number;
          value: number;
          string: string;
        }[];
        network: string;
        timestamp: number;
        signature: string;
      }>(
        `${UTXO_PROOF_SERVER}`,
        utxos.map(({ txid, vout }: UnspentOutput) => ({
          txid,
          vout,
        }))
      )
      .then((res) => res.data);

    return NextResponse.json({
      success: true,
      data,
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
