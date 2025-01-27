import { NextRequest, NextResponse } from "next/server";
import { getAddressUtxos } from "@/lib/chain-api";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  try {
    if (!address) {
      throw new Error("Missing parameter(s)");
    }

    const utxos = await getAddressUtxos(address);

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
