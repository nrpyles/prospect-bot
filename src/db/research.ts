import {auditMatchesWebsite} from '@/lib/crm-guards';
import {and,eq} from 'drizzle-orm';
import {db} from './index';
import {prospects,prospectResearch,prospectEvidence} from './schema';
import type {AuditResult,Evidence,Finding} from '@/lib/crm-types';
export async function saveFindings(orgId:string,prospectId:string,audit:AuditResult):Promise<void>{
 if(!db) throw new Error('Database is not configured');
 await db.transaction(async tx=>{
  const [owned]=await tx.select({id:prospects.id,website:prospects.website}).from(prospects).where(and(eq(prospects.id,prospectId),eq(prospects.orgId,orgId))).for('update');
  if(!owned) throw new Error('Prospect not found');
  if(!auditMatchesWebsite(audit,owned.website))throw new Error('The website changed during research. Check the current website again.');
  await tx.insert(prospectResearch).values({orgId,prospectId,audit}).onConflictDoUpdate({target:[prospectResearch.orgId,prospectResearch.prospectId],set:{audit,checkedAt:new Date()}});
  await tx.update(prospects).set({researchState:audit.state,updatedAt:new Date()}).where(and(eq(prospects.id,prospectId),eq(prospects.orgId,orgId)));
 });
}
export async function listFindings(orgId:string,prospectId:string):Promise<Finding[]>{return (await getResearch(orgId,prospectId))?.findings??[];}
export async function getResearch(orgId:string,prospectId:string):Promise<AuditResult|null>{
 if(!db) throw new Error('Database is not configured');
 const [r]=await db.select().from(prospectResearch).where(and(eq(prospectResearch.orgId,orgId),eq(prospectResearch.prospectId,prospectId))).limit(1);if(!r)return null;const [p]=await db.select({website:prospects.website}).from(prospects).where(and(eq(prospects.orgId,orgId),eq(prospects.id,prospectId))).limit(1);return p&&auditMatchesWebsite(r.audit,p.website)?r.audit:null;
}
export async function listEvidence(orgId:string,prospectId:string):Promise<Evidence[]>{
 if(!db) throw new Error('Database is not configured');
 const rows=await db.select().from(prospectEvidence).where(and(eq(prospectEvidence.orgId,orgId),eq(prospectEvidence.prospectId,prospectId)));return rows.map(r=>r.evidence);
}
