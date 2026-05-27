"use server";

import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/server-context";
import {
  updateProspect as dbUpdateProspect,
  deleteProspect as dbDeleteProspect,
} from "@/db/prospects";
import type { Prospect as UiProspect } from "@/lib/mock-prospects";
import type { Status } from "@/lib/pipeline";

function uiToDbPatch(patch: Partial<UiProspect>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.ownerName !== undefined) out.ownerName = patch.ownerName || null;
  if (patch.industry !== undefined) out.industry = patch.industry;
  if (patch.city !== undefined) out.city = patch.city || null;
  if (patch.phone !== undefined) out.phone = patch.phone || null;
  if (patch.email !== undefined) out.email = patch.email || null;
  if (patch.website !== undefined) out.website = patch.website || null;
  if (patch.quality !== undefined) out.quality = patch.quality;
  if (patch.qualityIssues !== undefined) out.qualityIssues = patch.qualityIssues;
  if (patch.rating !== undefined) out.rating = patch.rating || null;
  if (patch.reviewCount !== undefined) out.reviewCount = patch.reviewCount ?? null;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.source !== undefined) out.source = patch.source;
  if (patch.channel !== undefined) out.channel = patch.channel || null;
  if (patch.packageName !== undefined) out.packageName = patch.packageName || null;
  if (patch.valueCents !== undefined) out.valueCents = patch.valueCents ?? null;
  if (patch.notes !== undefined) out.notes = patch.notes || null;
  if (patch.lastContactedAt !== undefined) {
    out.lastContactedAt = patch.lastContactedAt ? new Date(patch.lastContactedAt) : null;
  }
  if (patch.nextFollowUpAt !== undefined) {
    out.nextFollowUpAt = patch.nextFollowUpAt ? new Date(patch.nextFollowUpAt) : null;
  }
  return out;
}

export async function saveProspectAction(id: string, patch: Partial<UiProspect>) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const result = await dbUpdateProspect(ctx.orgId, id, uiToDbPatch(patch));
  revalidatePath("/app");
  return result;
}

export async function deleteProspectAction(id: string) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const ok = await dbDeleteProspect(ctx.orgId, id);
  revalidatePath("/app");
  return ok;
}

export async function updateStatusAction(id: string, status: Status) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const result = await dbUpdateProspect(ctx.orgId, id, { status });
  revalidatePath("/app");
  return result;
}
