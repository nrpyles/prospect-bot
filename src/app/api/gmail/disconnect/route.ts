import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-context";
import { deleteGmailConnection } from "@/db/connections";

export const runtime = "nodejs";

export async function POST() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteGmailConnection(ctx.userId);
  return NextResponse.json({ ok: true });
}
