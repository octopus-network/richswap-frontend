import { PoolInfo } from "@/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cache = (await fetch(
      "https://vquok3pr3bhc6tui.public.blob.vercel-storage.com/pool-list.json",
      {
        cache: "no-cache",
      }
    ).then((res) => res.json())) as PoolInfo[];

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
