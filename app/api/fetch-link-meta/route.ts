import { NextRequest, NextResponse } from "next/server";
import { fetchLinkMetadata } from "@/lib/links/metadata";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = body?.url;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(url); // validate URL format
  } catch {
    return NextResponse.json({ error: "invalid URL" }, { status: 400 });
  }

  const meta = await fetchLinkMetadata(url);
  return NextResponse.json(meta);
}
