/**
 * Prospect queries scoped to an organization.
 */
import { db } from "./index";
import { prospects, type NewProspect, type Prospect as DbProspect } from "./schema";
import { and, eq, desc } from "drizzle-orm";
import type { Prospect as UiProspect } from "@/lib/mock-prospects";

/** Convert a DB row to the UI Prospect shape used throughout the dashboard. */
export function toUiProspect(row: DbProspect): UiProspect {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.ownerName ?? undefined,
    industry: (row.industry ?? "Other") as UiProspect["industry"],
    city: row.city ?? "",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    quality: (row.quality ?? "No Website") as UiProspect["quality"],
    qualityIssues: (row.qualityIssues as string[] | null) ?? [],
    rating: row.rating ?? undefined,
    reviewCount: row.reviewCount ?? undefined,
    googlePlaceId: row.googlePlaceId ?? undefined,
    address: row.address ?? undefined,
    status: row.status as UiProspect["status"],
    source: (row.source ?? "Google Maps Bot") as UiProspect["source"],
    channel: row.channel ?? undefined,
    packageName: row.packageName ?? undefined,
    valueCents: row.valueCents ?? undefined,
    lastContactedAt: row.lastContactedAt?.toISOString().slice(0, 10),
    nextFollowUpAt: row.nextFollowUpAt?.toISOString().slice(0, 10),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString().slice(0, 10),
  };
}

export async function listProspects(orgId: string): Promise<UiProspect[]> {
  if (!db) throw new Error("DATABASE_URL is not set");
  const rows = await db
    .select()
    .from(prospects)
    .where(eq(prospects.orgId, orgId))
    .orderBy(desc(prospects.createdAt));
  return rows.map(toUiProspect);
}

export async function insertProspects(orgId: string, items: Omit<NewProspect, "orgId">[]): Promise<UiProspect[]> {
  if (!db) throw new Error("DATABASE_URL is not set");
  if (items.length === 0) return [];
  const rows = await db
    .insert(prospects)
    .values(items.map((i) => ({ ...i, orgId })))
    .onConflictDoNothing({ target: [prospects.orgId, prospects.googlePlaceId] })
    .returning();
  return rows.map(toUiProspect);
}

export async function updateProspect(
  orgId: string,
  id: string,
  patch: Partial<NewProspect>,
): Promise<UiProspect | null> {
  if (!db) throw new Error("DATABASE_URL is not set");
  const rows = await db
    .update(prospects)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(prospects.id, id), eq(prospects.orgId, orgId)))
    .returning();
  return rows[0] ? toUiProspect(rows[0]) : null;
}

export async function deleteProspect(orgId: string, id: string): Promise<boolean> {
  if (!db) throw new Error("DATABASE_URL is not set");
  const rows = await db
    .delete(prospects)
    .where(and(eq(prospects.id, id), eq(prospects.orgId, orgId)))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function getExistingProspectNames(orgId: string): Promise<string[]> {
  if (!db) throw new Error("DATABASE_URL is not set");
  const rows = await db
    .select({ name: prospects.name })
    .from(prospects)
    .where(eq(prospects.orgId, orgId));
  return rows.map((r) => r.name);
}
