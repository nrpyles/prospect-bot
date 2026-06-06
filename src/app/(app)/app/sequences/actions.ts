"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext } from "@/lib/server-context";
import {
  createSequence as dbCreate,
  updateSequence as dbUpdate,
  deleteSequence as dbDelete,
  replaceSequenceSteps,
  enrollProspects as dbEnroll,
  advanceEnrollment as dbAdvance,
  removeEnrollment as dbRemoveEnrollment,
} from "@/db/sequences";
import { getTemplate } from "@/lib/sequence-templates";

const stepSchema = z.object({
  kind: z.enum(["email", "wait"]),
  subject: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  useAiDraft: z.boolean().optional(),
  waitDays: z.number().int().min(0).max(180).nullable().optional(),
});

export async function createSequenceAction(input: { name: string; description?: string }) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const result = await dbCreate(ctx.orgId, input.name.trim() || "Untitled sequence", input.description);
  revalidatePath("/app/sequences");
  return result;
}

export async function createFromTemplateAction(templateId: string) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");

  const template = getTemplate(templateId);
  if (!template) throw new Error("Template not found");

  const seq = await dbCreate(ctx.orgId, template.name, template.description);

  await replaceSequenceSteps(
    ctx.orgId,
    seq.id,
    template.steps.map((s, i) => ({
      position: i,
      kind: s.kind,
      subject: s.kind === "email" ? s.subject : null,
      body: s.kind === "email" ? s.body : null,
      useAiDraft: s.kind === "email" ? s.useAiDraft : false,
      waitDays: s.kind === "wait" ? s.waitDays : null,
    })),
  );

  revalidatePath("/app/sequences");
  return seq;
}

export async function updateSequenceAction(
  id: string,
  patch: { name?: string; description?: string | null; isActive?: boolean },
) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  await dbUpdate(ctx.orgId, id, patch);
  revalidatePath("/app/sequences");
  revalidatePath(`/app/sequences/${id}`);
}

export async function deleteSequenceAction(id: string) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  await dbDelete(ctx.orgId, id);
  revalidatePath("/app/sequences");
}

export async function saveStepsAction(sequenceId: string, steps: z.infer<typeof stepSchema>[]) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const parsed = z.array(stepSchema).parse(steps);
  const result = await replaceSequenceSteps(
    ctx.orgId,
    sequenceId,
    parsed.map((s, i) => ({
      position: i,
      kind: s.kind,
      subject: s.subject ?? null,
      body: s.body ?? null,
      useAiDraft: s.useAiDraft ?? false,
      waitDays: s.kind === "wait" ? s.waitDays ?? 0 : null,
    })),
  );
  revalidatePath(`/app/sequences/${sequenceId}`);
  return result;
}

export async function enrollProspectsAction(sequenceId: string, prospectIds: string[]) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const enrolled = await dbEnroll(ctx.orgId, sequenceId, prospectIds);
  revalidatePath("/app/sequences");
  revalidatePath("/app");
  return enrolled;
}

export async function advanceEnrollmentAction(enrollmentId: string) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  const result = await dbAdvance(ctx.orgId, enrollmentId);
  revalidatePath("/app");
  revalidatePath("/app/sequences");
  return result;
}

export async function unenrollAction(enrollmentId: string) {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("Unauthorized");
  await dbRemoveEnrollment(ctx.orgId, enrollmentId);
  revalidatePath("/app/sequences");
  revalidatePath("/app");
}
