import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-context";
import { getGmailConnectionInfo } from "@/db/connections";
import { isGmailConfigured } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ connected: false }, { status: 401 });

  const configured = isGmailConfigured();
  if (!configured) {
    return NextResponse.json({ connected: false, configured: false });
  }

  const info = await getGmailConnectionInfo(ctx.userId);
  return NextResponse.json({
    configured: true,
    connected: Boolean(info),
    emailAddress: info?.emailAddress ?? null,
  });
}
