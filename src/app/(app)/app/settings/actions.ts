"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getUserContext } from "@/lib/server-context";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import type { WorkspaceMode } from "@/lib/pipeline";

export async function updateOrgApiKeysAction(input: {
  googleMapsApiKey?: string | null;
  defaultCities?: string[];
  defaultIndustries?: string[];
  workspaceMode?: WorkspaceMode;
  senderName?: string | null;
  senderCompany?: string | null;
}) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  if (!db) throw new Error("Database unavailable");

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.googleMapsApiKey !== undefined) {
    patch.googleMapsApiKey = input.googleMapsApiKey || null;
  }
  if (input.defaultCities !== undefined) patch.defaultCities = input.defaultCities;
  if (input.defaultIndustries !== undefined) patch.defaultIndustries = input.defaultIndustries;
  if (input.workspaceMode !== undefined) patch.workspaceMode = input.workspaceMode;
  if (input.senderName !== undefined) patch.senderName = input.senderName || null;
  if (input.senderCompany !== undefined) patch.senderCompany = input.senderCompany || null;

  await db.update(organizations).set(patch).where(eq(organizations.id, ctx.orgId));
  revalidatePath("/app/settings");
  revalidatePath("/app");
  return { ok: true };
}
