import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const cookieStore = await cookies();
  cookieStore.set("locale", data.locale || "en");

  return NextResponse.json({ success: true });
}
