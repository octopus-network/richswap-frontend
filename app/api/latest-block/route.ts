import { NextResponse } from "next/server";
import { Maestro } from "@/lib/maestro";

export const dynamic = "force-dynamic";

const MAESTRO_API_URL = process.env.MAESTRO_API_URL!;
const MAESTRO_API_KEY = process.env.MAESTRO_API_KEY!;

export async function GET() {
  try {
    const maestro = new Maestro({
      baseUrl: MAESTRO_API_URL,
      apiKey: MAESTRO_API_KEY,
    });
    const { data } = await maestro.latestBlock();

    return NextResponse.json({
      success: true,
      data: data.height,
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
