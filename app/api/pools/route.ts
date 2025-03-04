import { NextResponse } from "next/server";

const STORAGE_URL = process.env.STORAGE_URL!;

export const dynamic = "force-dynamic";

export async function GET() {
  const cache = await fetch(`${STORAGE_URL}/pool-list.json`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .catch(() => []);

  return NextResponse.json({
    success: true,
    data: cache,
  });
}
