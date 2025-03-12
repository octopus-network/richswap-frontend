import { NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cache = await axios
      .get(
        "https://vquok3pr3bhc6tui.public.blob.vercel-storage.com/pool-list.json"
      )
      .then((res) => res.data);

    return NextResponse.json({
      success: true,
      data: cache ?? [],
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
