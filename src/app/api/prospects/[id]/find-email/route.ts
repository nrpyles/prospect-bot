import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-context";
import { db } from "@/db";
import { prospects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { findEmailsForWebsite } from "@/lib/email-finder";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  // Optional body: { save: true | false, email?: string } — if save+email provided,
  // saves that specific email to the prospect record.
  let body: { save?: boolean; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const [row] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, id), eq(prospects.orgId, ctx.orgId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  // Save-only path: caller already picked an email, just persist it.
  if (body.save && body.email) {
    await db
      .update(prospects)
      .set({ email: body.email.trim().toLowerCase(), updatedAt: new Date() })
      .where(and(eq(prospects.id, id), eq(prospects.orgId, ctx.orgId)));
    return NextResponse.json({ ok: true, email: body.email.trim().toLowerCase() });
  }

  if (!row.website) {
    return NextResponse.json(
      {
        emails: [],
        visitedUrls: [],
        errors: ["No website on file — can't scan."],
      },
      { status: 200 },
    );
  }

  try {
    const result = await findEmailsForWebsite(row.website);

    // Auto-save the highest-confidence email if the prospect doesn't have
    // one yet and the score is strong (≥80).
    if (!row.email && result.emails[0] && result.emails[0].score >= 80) {
      await db
        .update(prospects)
        .set({ email: result.emails[0].email, updatedAt: new Date() })
        .where(and(eq(prospects.id, id), eq(prospects.orgId, ctx.orgId)));
      return NextResponse.json({ ...result, autoSaved: result.emails[0].email });
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
