import {advanceSequenceInTransaction} from './sequence-actions';
import {canContactProspect} from '@/lib/crm-guards';
/**
 * Sequence + enrollment queries scoped to an org.
 */
import { and, eq, asc, isNotNull, lte, isNull, desc, inArray, ne } from "drizzle-orm";
import { db } from "./index";
import {
  sequences,
  sequenceSteps,
  sequenceEnrollments,
  prospects,
} from "./schema";

export type SequenceStepInput = {
  position: number;
  kind: "email" | "wait" | "task";
  subject?: string | null;
  body?: string | null;
  useAiDraft?: boolean;
  waitDays?: number | null;
};

function ensureDb() {
  if (!db) throw new Error("DATABASE_URL is not set");
  return db;
}

export async function listSequences(orgId: string) {
  const conn = ensureDb();
  const seqs = await conn
    .select()
    .from(sequences)
    .where(eq(sequences.orgId, orgId))
    .orderBy(desc(sequences.createdAt));

  if (seqs.length === 0) return [];

  const ids = seqs.map((s) => s.id);
  const steps = await conn
    .select()
    .from(sequenceSteps)
    .where(inArray(sequenceSteps.sequenceId, ids))
    .orderBy(asc(sequenceSteps.position));

  const enrollments = await conn
    .select({ sequenceId: sequenceEnrollments.sequenceId, id: sequenceEnrollments.id, completedAt: sequenceEnrollments.completedAt })
    .from(sequenceEnrollments)
    .where(inArray(sequenceEnrollments.sequenceId, ids));

  return seqs.map((s) => ({
    ...s,
    steps: steps.filter((st) => st.sequenceId === s.id),
    enrollmentCount: enrollments.filter((e) => e.sequenceId === s.id && !e.completedAt).length,
    completedCount: enrollments.filter((e) => e.sequenceId === s.id && e.completedAt).length,
  }));
}

export async function getSequence(orgId: string, id: string) {
  const conn = ensureDb();
  const [seq] = await conn
    .select()
    .from(sequences)
    .where(and(eq(sequences.id, id), eq(sequences.orgId, orgId)))
    .limit(1);
  if (!seq) return null;
  const steps = await conn
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, id))
    .orderBy(asc(sequenceSteps.position));
  return { ...seq, steps };
}

export async function createSequence(orgId: string, name: string, description?: string) {
  const conn = ensureDb();
  const [created] = await conn
    .insert(sequences)
    .values({ orgId, name, description: description ?? null })
    .returning();
  return created;
}

export async function updateSequence(
  orgId: string,
  id: string,
  patch: Partial<{ name: string; description: string | null; isActive: boolean }>,
) {
  const conn = ensureDb();
  await conn
    .update(sequences)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(sequences.id, id), eq(sequences.orgId, orgId)));
}

export async function deleteSequence(orgId: string, id: string) {
  const conn = ensureDb();
  await conn.delete(sequences).where(and(eq(sequences.id, id), eq(sequences.orgId, orgId)));
}

export async function replaceSequenceSteps(
  orgId: string,
  sequenceId: string,
  steps: SequenceStepInput[],
) {
  const conn = ensureDb();
  const owned = await conn
    .select({ id: sequences.id })
    .from(sequences)
    .where(and(eq(sequences.id, sequenceId), eq(sequences.orgId, orgId)))
    .limit(1);
  if (owned.length === 0) throw new Error("Sequence not found");

  await conn.delete(sequenceSteps).where(eq(sequenceSteps.sequenceId, sequenceId));

  if (steps.length === 0) return [];

  return conn
    .insert(sequenceSteps)
    .values(
      steps.map((s, i) => ({
        sequenceId,
        position: i,
        kind: s.kind,
        subject: s.subject ?? null,
        body: s.body ?? null,
        useAiDraft: s.useAiDraft ?? false,
        waitDays: s.waitDays ?? null,
      })),
    )
    .returning();
}

/* ─────────────────────────────────────────────────────────────
   ENROLLMENTS
   ───────────────────────────────────────────────────────────── */

export async function enrollProspects(orgId: string, sequenceId: string, prospectIds: string[]) {
  const conn = ensureDb();

  // Verify ownership
  const owned = await conn
    .select({ id: sequences.id })
    .from(sequences)
    .where(and(eq(sequences.id, sequenceId), eq(sequences.orgId, orgId)))
    .limit(1);
  if (owned.length === 0) throw new Error("Sequence not found");

  const ownedProspects = await conn
    .select({ id: prospects.id,status:prospects.status,outreachDisposition:prospects.outreachDisposition })
    .from(prospects)
    .where(and(eq(prospects.orgId, orgId), eq(prospects.outreachDisposition, "active"),ne(prospects.status,"Not Interested"), inArray(prospects.id, prospectIds)));
  const validIds = ownedProspects.filter(canContactProspect).map((p) => p.id);
  if (validIds.length === 0) return [];

  const now = new Date();
  return conn
    .insert(sequenceEnrollments)
    .values(
      validIds.map((pid) => ({
        sequenceId,
        prospectId: pid,
        currentStepPosition: 0,
        nextActionAt: now, // first step is due immediately
        enrolledAt: now,
      })),
    )
    .onConflictDoNothing({
      target: [sequenceEnrollments.sequenceId, sequenceEnrollments.prospectId],
    })
    .returning();
}

export async function listDueEnrollments(orgId: string) {
  const conn = ensureDb();
  const now = new Date();
  // Get enrollments where nextActionAt <= now AND not completed AND not paused
  const rows = await conn
    .select({
      enrollment: sequenceEnrollments,
      sequence: sequences,
      prospect: prospects,
    })
    .from(sequenceEnrollments)
    .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
    .innerJoin(prospects, eq(sequenceEnrollments.prospectId, prospects.id))
    .where(
      and(
        eq(sequences.orgId, orgId),
        eq(sequences.isActive,true),
        eq(prospects.outreachDisposition,"active"),
        ne(prospects.status,"Not Interested"),
        eq(prospects.orgId, orgId),
        isNotNull(sequenceEnrollments.nextActionAt),
        lte(sequenceEnrollments.nextActionAt, now),
        isNull(sequenceEnrollments.completedAt),
        isNull(sequenceEnrollments.pausedAt),
      ),
    )
    .orderBy(asc(sequenceEnrollments.nextActionAt));

  return rows.filter(row=>canContactProspect(row.prospect));
}

export async function listEnrollmentsForProspect(orgId: string, prospectId: string) {
  const conn = ensureDb();
  const rows = await conn
    .select({
      enrollment: sequenceEnrollments,
      sequence: sequences,
    })
    .from(sequenceEnrollments)
    .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
    .where(
      and(
        eq(sequenceEnrollments.prospectId, prospectId),
        eq(sequences.orgId, orgId),
      ),
    );
  return rows;
}

/** Advance an enrollment to the next step. Computes nextActionAt from waitDays. */
export async function advanceEnrollment(orgId: string, enrollmentId: string, expectedPosition: number) {
  return ensureDb().transaction(tx=>advanceSequenceInTransaction(tx,orgId,enrollmentId,expectedPosition));
}

export async function pauseEnrollment(orgId:string,enrollmentId:string){
 const conn=ensureDb();const owned=conn.select({id:sequences.id}).from(sequences).where(eq(sequences.orgId,orgId));
 await conn.update(sequenceEnrollments).set({pausedAt:new Date(),nextActionAt:null}).where(and(eq(sequenceEnrollments.id,enrollmentId),inArray(sequenceEnrollments.sequenceId,owned),isNull(sequenceEnrollments.completedAt)));
}
export async function removeEnrollment(orgId:string,enrollmentId:string){
 const conn=ensureDb();const owned=conn.select({id:sequences.id}).from(sequences).where(eq(sequences.orgId,orgId));
 await conn.delete(sequenceEnrollments).where(and(eq(sequenceEnrollments.id,enrollmentId),inArray(sequenceEnrollments.sequenceId,owned)));
}

/** Aggregate counts of due actions for the dashboard's Today's Playbook. */
export async function dueActionsSummary(orgId:string){return {dueCount:(await listDueEnrollments(orgId)).length};}
