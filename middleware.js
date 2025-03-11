import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export const config = {
  matcher: ["/swap", "/pools", "/"],
};

export async function middleware(req) {
  // Check Edge Config to see if the maintenance page should be shown
  const isInMaintenanceMode = await get("isInMaintenanceMode");

  console.log("isInMaintenanceMode", isInMaintenanceMode);

  // If in maintenance mode, point the url pathname to the maintenance page
  if (isInMaintenanceMode) {
    req.nextUrl.pathname = `/maintenance`;

    // Rewrite to the url
    return NextResponse.rewrite(req.nextUrl);
  }
}
