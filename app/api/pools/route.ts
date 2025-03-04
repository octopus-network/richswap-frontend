import { NextResponse } from "next/server";
import axios from "axios";
const STORAGE_URL = process.env.STORAGE_URL!;

export const dynamic = "force-dynamic";

export async function GET() {
  const cache = await axios(`${STORAGE_URL}/pool-list.json`)
    .then((res) => res.data)
    .catch(() => []);

  console.log("pools", cache);

  return NextResponse.json({
    success: true,
    data: cache,
  });
}
