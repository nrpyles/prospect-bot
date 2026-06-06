import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getUserContext } from "@/lib/server-context";
import { db } from "@/db";
import { prospects, messages, organizations } from "@/db/schema";
import { getValidGmailAccessToken } from "@/db/connections";
import { sendGmailMessage } from "@/lib/gmail";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  prospectId: z.string().uuid(),
  to: z.string().email().optional(), // override; defaults to prospect.email
  subject: z.string().min(1),
  body: z.string().min(1),
  sequenceStepId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request", detail: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }

  // Resolve the prospect (and authorize org ownership)
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, parsed.prospectId), eq(prospects.orgId, ctx.orgId)))
    .limit(1);
  if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 });

  const toAddress = parsed.to ?? prospect.email;
  if (!toAddress) {
    return NextResponse.json(
      { error: "No recipient email. Find the owner's email first." },
      { status: 400 },
    );
  }

  // Get a valid Gmail access token (refreshes if needed)
  let tokenInfo: { accessToken: string; emailAddress: string | null } | null;
  try {
    tokenInfo = await getValidGmailAccessToken(ctx.userId);
  } catch {
    return NextResponse.json(
      { error: "Gmail token expired. Reconnect Gmail in Settings.", needsReconnect: true },
      { status: 401 },
    );
  }
  if (!tokenInfo) {
    return NextResponse.json(
      { error: "Gmail not connected. Connect it in Settings.", needsReconnect: true },
      { status: 401 },
    );
  }

  const fromAddress = tokenInfo.emailAddress ?? "me";

  // Pull sender display name from org
  const [org] = await db
    .select({ senderName: organizations.senderName })
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);

  try {
    const sent = await sendGmailMessage({
      accessToken: tokenInfo.accessToken,
      from: fromAddress,
      fromName: org?.senderName ?? undefined,
      to: toAddress,
      subject: parsed.subject,
      body: parsed.body,
    });

    // Persist the sent message
    await db.insert(messages).values({
      orgId: ctx.orgId,
      prospectId: parsed.prospectId,
      sequenceStepId: parsed.sequenceStepId ?? null,
      direction: "outbound",
      status: "sent",
      channel: "email",
      subject: parsed.subject,
      body: parsed.body,
      fromAddress,
      toAddress,
      providerMessageId: sent.id,
      threadId: sent.threadId,
      sentAt: new Date(),
    });

    // Advance prospect status + last-contacted if it was still a new lead
    if (prospect.status === "New Lead") {
      await db
        .update(prospects)
        .set({ status: "Email Sent", lastContactedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(prospects.id, parsed.prospectId), eq(prospects.orgId, ctx.orgId)));
    } else {
      await db
        .update(prospects)
        .set({ lastContactedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(prospects.id, parsed.prospectId), eq(prospects.orgId, ctx.orgId)));
    }

    return NextResponse.json({ ok: true, messageId: sent.id, from: fromAddress, to: toAddress });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const needsReconnect = /401|invalid_grant|unauthor/i.test(msg);
    return NextResponse.json({ error: msg, needsReconnect }, { status: 500 });
  }
}
