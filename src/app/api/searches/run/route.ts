import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { runLeadSearch } from "@/lib/lead-search";
import { INDUSTRIES, QUALITIES } from "@/lib/pipeline";
import { getUserContext } from "@/lib/server-context";
import { insertProspects, getExistingProspectNames } from "@/db/prospects";
import { db } from "@/db";
import { organizations } from "@/db/schema";

// cheerio + fetch with redirects need Node runtime, not Edge.
export const runtime = "nodejs";
export const maxDuration = 60; // seconds (Vercel limit on free tier)

const requestSchema = z.object({
  cities: z.array(z.string().min(1)).min(1).max(20),
  industries: z.array(z.enum(INDUSTRIES)).min(1).max(20),
  apiKey: z.string().optional(), // BYO key; falls back to shared FUNNELCLOSER_GMAPS_API_KEY for free trial
  minRating: z.number().min(0).max(5).optional(),
  qualityFilter: z.array(z.enum(QUALITIES)).optional(),
  maxResultsPerQuery: z.number().int().min(1).max(20).optional(),
  existingNames: z.array(z.string()).optional(),
});

const FREE_TRIAL_HARD_CAP = 25; // max prospects per shared-key search

export async function POST(req: Request) {
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Resolve API key: request body → org settings → shared env var.
  const userApiKey = parsed.data.apiKey?.trim();
  let orgApiKey: string | undefined;
  if (!userApiKey && db) {
    const [org] = await db
      .select({ key: organizations.googleMapsApiKey })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);
    orgApiKey = org?.key?.trim() || undefined;
  }
  const sharedApiKey = process.env.FUNNELCLOSER_GMAPS_API_KEY?.trim();
  const apiKey = userApiKey || orgApiKey || sharedApiKey;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No Google Maps API key available. Paste one in the modal, save it in Settings, or set FUNNELCLOSER_GMAPS_API_KEY on the server for free-trial use.",
      },
      { status: 400 },
    );
  }

  const usingSharedKey = !userApiKey && !orgApiKey;

  try {
    // Pull existing names from DB so we de-dupe across all prospects in this org,
    // not just the ones currently visible in the client's state.
    const dbExisting = await getExistingProspectNames(ctx.orgId);
    const allExisting = new Set(
      [...dbExisting, ...(parsed.data.existingNames ?? [])].map((n) => n.trim().toLowerCase()),
    );

    const result = await runLeadSearch({
      apiKey,
      cities: parsed.data.cities,
      industries: parsed.data.industries,
      minRating: parsed.data.minRating,
      qualityFilter: parsed.data.qualityFilter,
      maxResultsPerQuery: parsed.data.maxResultsPerQuery,
      existingNames: allExisting,
    });

    // Cap free-trial output so a single search can't blow through the shared quota.
    if (usingSharedKey && result.prospects.length > FREE_TRIAL_HARD_CAP) {
      result.prospects = result.prospects.slice(0, FREE_TRIAL_HARD_CAP);
      result.stats.totalAdded = FREE_TRIAL_HARD_CAP;
      result.errors.push(
        `Free-trial cap reached (${FREE_TRIAL_HARD_CAP} prospects). Connect your own Google Maps API key in Settings to remove the cap.`,
      );
    }

    // Persist to DB
    const saved = await insertProspects(
      ctx.orgId,
      result.prospects.map((p) => ({
        name: p.name,
        industry: p.industry,
        city: p.city,
        phone: p.phone,
        email: p.email,
        website: p.website,
        quality: p.quality,
        qualityIssues: p.qualityIssues,
        rating: p.rating,
        reviewCount: p.reviewCount,
        googlePlaceId: p.googlePlaceId,
        address: p.address,
        status: p.status,
        source: p.source,
      })),
    );

    return NextResponse.json({ ...result, prospects: saved, usingSharedKey });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
