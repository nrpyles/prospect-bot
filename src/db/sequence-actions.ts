import {and, asc, eq} from 'drizzle-orm';
import {db} from './index';
import {prospects, sequences, sequenceEnrollments, sequenceSteps} from './schema';
import {canContactProspect} from '@/lib/crm-guards';
import {nextEnrollmentState} from '@/lib/outreach/sequence-progress';

export type CrmTransaction = Parameters<Parameters<NonNullable<typeof db>['transaction']>[0]>[0];

// Lock order for send, stop and completion is prospect, enrollment, then intent.
export async function lockSequenceAction(tx: CrmTransaction, orgId: string, prospectId: string, enrollmentId: string, expectedPosition: number) {
  const [enrollment] = await tx.select().from(sequenceEnrollments).where(and(eq(sequenceEnrollments.id,enrollmentId),eq(sequenceEnrollments.prospectId,prospectId))).for('update');
  if (!enrollment) throw new Error('Enrollment not found');
  const [sequence] = await tx.select().from(sequences).where(and(eq(sequences.id,enrollment.sequenceId),eq(sequences.orgId,orgId))).limit(1);
  if (!sequence || !sequence.isActive || enrollment.pausedAt || enrollment.completedAt || enrollment.currentStepPosition !== expectedPosition) throw new Error('This sequence action is no longer active');
  const [step] = await tx.select().from(sequenceSteps).where(and(eq(sequenceSteps.sequenceId,sequence.id),eq(sequenceSteps.position,expectedPosition))).limit(1);
  if (!step || step.kind !== 'email') throw new Error('This is not an email step');
  return {enrollment,step};
}

export async function advanceSequenceInTransaction(tx: CrmTransaction, orgId: string, enrollmentId: string, expectedPosition: number) {
  const [reference] = await tx.select({prospectId:sequenceEnrollments.prospectId,sequenceId:sequenceEnrollments.sequenceId}).from(sequenceEnrollments).innerJoin(sequences,eq(sequenceEnrollments.sequenceId,sequences.id)).where(and(eq(sequenceEnrollments.id,enrollmentId),eq(sequences.orgId,orgId))).limit(1);
  if (!reference) throw new Error('Enrollment not found');
  const [prospect] = await tx.select().from(prospects).where(and(eq(prospects.id,reference.prospectId),eq(prospects.orgId,orgId))).for('update');
  const [enrollment] = await tx.select().from(sequenceEnrollments).where(eq(sequenceEnrollments.id,enrollmentId)).for('update');
  const [sequence] = await tx.select().from(sequences).where(and(eq(sequences.id,reference.sequenceId),eq(sequences.orgId,orgId))).limit(1);
  if (!prospect || !enrollment || !sequence || !sequence.isActive || !canContactProspect(prospect)) return {advanced:false};
  const steps = await tx.select().from(sequenceSteps).where(eq(sequenceSteps.sequenceId,enrollment.sequenceId)).orderBy(asc(sequenceSteps.position));
  const patch = nextEnrollmentState(enrollment,steps,expectedPosition);
  if (!patch) return {advanced:false};
  await tx.update(sequenceEnrollments).set(patch).where(and(eq(sequenceEnrollments.id,enrollmentId),eq(sequenceEnrollments.currentStepPosition,expectedPosition)));
  return {advanced:true,completed:Boolean(patch.completedAt)};
}
