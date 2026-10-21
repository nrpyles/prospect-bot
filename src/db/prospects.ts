import {assessOpportunity,refreshSuggestedFields} from '@/lib/discovery/opportunities';
import {auditMatchesWebsite,websiteChanged} from '@/lib/crm-guards';
import type {AuditResult} from '@/lib/crm-types';
/**
 * Prospect queries scoped to an organization.
 */
import { db } from "./index";
import { prospects, prospectResearch, type NewProspect, type Prospect as DbProspect } from "./schema";
import { and, eq, desc, sql } from "drizzle-orm";
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
    researchState: row.researchState as UiProspect["researchState"],
    offerType: row.offerType as UiProspect["offerType"],
    nextAction: row.nextAction ?? undefined,
    externalProjectUrl: row.externalProjectUrl ?? undefined,
    outreachDisposition: row.outreachDisposition as UiProspect["outreachDisposition"],
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
  // Directory refreshes need observations, not the potentially large saved page corpus.
  const rows = await db.select({prospect:prospects,audit:sql<AuditResult|null>`${prospectResearch.audit} - 'siteResearch'`}).from(prospects)
    .leftJoin(prospectResearch,and(eq(prospectResearch.prospectId,prospects.id),eq(prospectResearch.orgId,prospects.orgId)))
    .where(eq(prospects.orgId,orgId)).orderBy(desc(prospects.createdAt));
  return rows.map(({prospect,audit})=>({...toUiProspect(prospect),opportunity:assessOpportunity(audit&&auditMatchesWebsite(audit,prospect.website)?audit:null,{website:prospect.website,googlePlaceId:prospect.googlePlaceId})}));
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
  return db.transaction(async tx => {
    const [previous] = await tx.select().from(prospects).where(and(eq(prospects.id,id),eq(prospects.orgId,orgId))).for('update');
    if(!previous)return null;
    const changed=patch.website!==undefined&&websiteChanged(previous.website,patch.website);
    const resetGenerated:Partial<NewProspect>={};
    if(changed){
      const [research]=await tx.select({audit:prospectResearch.audit}).from(prospectResearch).where(and(eq(prospectResearch.orgId,orgId),eq(prospectResearch.prospectId,id)));
      const opportunity=research?.audit&&auditMatchesWebsite(research.audit,previous.website)?assessOpportunity(research.audit,{website:previous.website,googlePlaceId:previous.googlePlaceId}):null;
      const reset=refreshSuggestedFields(previous,opportunity,null);
      if('offerType' in reset&&(patch.offerType===undefined||patch.offerType===previous.offerType))resetGenerated.offerType=null;
      if('nextAction' in reset&&(patch.nextAction===undefined||patch.nextAction===previous.nextAction))resetGenerated.nextAction=null;
      await tx.delete(prospectResearch).where(and(eq(prospectResearch.orgId,orgId),eq(prospectResearch.prospectId,id)));
    }
    const [row]=await tx.update(prospects).set({...patch,...(changed?{researchState:'unchecked',quality:null,qualityIssues:[],...resetGenerated}:{}),updatedAt:new Date()}).where(and(eq(prospects.id,id),eq(prospects.orgId,orgId))).returning();
    return toUiProspect(row);
  });
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

