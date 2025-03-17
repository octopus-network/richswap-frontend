import { PoolInfo } from "@/types";
import { NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const STORAGE_URL = process.env.STORAGE_URL!;

export async function GET() {
  try {
    const cache = (await axios
      .get(`${STORAGE_URL}/pool-list.json`)
      .then((res) => res.data)) as PoolInfo[];

    return NextResponse.json({
      success: true,
      data: cache.filter((pool) => pool.coinA.balance !== "0") ?? [],
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
      {
        status: 500,
      }
    );
  }
}
