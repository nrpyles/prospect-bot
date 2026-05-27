import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserContext } from "@/lib/server-context";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { toUiProspect } from "@/db/prospects";
import { draftEmail } from "@/lib/ai-drafter";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  senderName: z.string().optional(),
  senderCompany: z.string().optional(),
  packageHook: z.string().optional(),
  apiKey: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    parsed = {};
  }

  const row = (
    await db
      .select()
      .from(prospects)
      .where(and(eq(prospects.id, id), eq(prospects.orgId, ctx.orgId)))
      .limit(1)
  )[0];
  if (!row) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  try {
    const draft = await draftEmail({
      prospect: toUiProspect(row),
      senderName: parsed.senderName,
      senderCompany: parsed.senderCompany,
      packageHook: parsed.packageHook,
      apiKey: parsed.apiKey,
    });
    return NextResponse.json(draft);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
