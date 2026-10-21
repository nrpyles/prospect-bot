import {assessOpportunity,refreshSuggestedFields} from '@/lib/discovery/opportunities';
import {auditMatchesWebsite,mergeWebsiteResearch} from '@/lib/crm-guards';
import {and,eq} from 'drizzle-orm';
import {db} from './index';
import {prospects,prospectResearch,prospectEvidence} from './schema';
import type {AuditResult,Evidence,Finding} from '@/lib/crm-types';
import {validatePersonalizedDraft} from '@/lib/outreach/agency-draft';
export async function saveFindings(orgId:string,prospectId:string,audit:AuditResult):Promise<void>{
 if(!db) throw new Error('Database is not configured');
 await db.transaction(async tx=>{
  const [owned]=await tx.select({id:prospects.id,website:prospects.website,googlePlaceId:prospects.googlePlaceId,offerType:prospects.offerType,nextAction:prospects.nextAction}).from(prospects).where(and(eq(prospects.id,prospectId),eq(prospects.orgId,orgId))).for('update');
  if(!owned) throw new Error('Prospect not found');
  if(!auditMatchesWebsite(audit,owned.website))throw new Error('The website changed during research. Check the current website again.');
  const [previous]=await tx.select({audit:prospectResearch.audit}).from(prospectResearch).where(and(eq(prospectResearch.orgId,orgId),eq(prospectResearch.prospectId,prospectId))).for('update');
  audit=mergeWebsiteResearch(audit,previous?.audit??null);
  await tx.insert(prospectResearch).values({orgId,prospectId,audit}).onConflictDoUpdate({target:[prospectResearch.orgId,prospectResearch.prospectId],set:{audit,checkedAt:new Date()}});
  const opportunity=assessOpportunity(audit,owned);
  const previousOpportunity=previous?.audit&&auditMatchesWebsite(previous.audit,owned.website)?assessOpportunity(previous.audit,owned):null;
  await tx.update(prospects).set({researchState:audit.state,quality:opportunity.quality,qualityIssues:opportunity.reasons,...refreshSuggestedFields(owned,previousOpportunity,opportunity),updatedAt:new Date()}).where(and(eq(prospects.id,prospectId),eq(prospects.orgId,orgId)));
 });
}
export async function listFindings(orgId:string,prospectId:string):Promise<Finding[]>{return (await getResearch(orgId,prospectId))?.findings??[];}
export async function savePersonalizedDraft(orgId:string,prospectId:string,website:string|null,draft:{subject:string;body:string;sourceUrl?:string;sourceQuote?:string}):Promise<void>{
 if(!db)throw new Error('Database is not configured');
 await db.transaction(async tx=>{
  const [owned]=await tx.select({website:prospects.website}).from(prospects).where(and(eq(prospects.orgId,orgId),eq(prospects.id,prospectId))).for('update');
  if(!owned||!auditMatchesWebsite({websiteUrl:website,state:'unchecked',findings:[],checksRun:[],checksNotRun:[]},owned.website))throw new Error('The website changed while this draft was being prepared. Research it again.');
  const [record]=await tx.select().from(prospectResearch).where(and(eq(prospectResearch.orgId,orgId),eq(prospectResearch.prospectId,prospectId))).for('update');
  if(!record?.audit.siteResearch)throw new Error('The website research is no longer available. Research it again.');
  if(!auditMatchesWebsite(record.audit,owned.website))throw new Error('The website research is out of date. Research it again.');
  const recent=record.audit.siteResearch.recentDrafts??[];
  validatePersonalizedDraft(draft,record.audit.siteResearch,recent);
  await tx.update(prospectResearch).set({audit:{...record.audit,siteResearch:{...record.audit.siteResearch,recentDrafts:[...recent,{subject:draft.subject,body:draft.body}].slice(-6)}}}).where(eq(prospectResearch.id,record.id));
 });
}
export async function getResearch(orgId:string,prospectId:string):Promise<AuditResult|null>{
 if(!db) throw new Error('Database is not configured');
 const [r]=await db.select().from(prospectResearch).where(and(eq(prospectResearch.orgId,orgId),eq(prospectResearch.prospectId,prospectId))).limit(1);if(!r)return null;const [p]=await db.select({website:prospects.website}).from(prospects).where(and(eq(prospects.orgId,orgId),eq(prospects.id,prospectId))).limit(1);return p&&auditMatchesWebsite(r.audit,p.website)?r.audit:null;
}
export async function listEvidence(orgId:string,prospectId:string):Promise<Evidence[]>{
 if(!db) throw new Error('Database is not configured');
 const rows=await db.select().from(prospectEvidence).where(and(eq(prospectEvidence.orgId,orgId),eq(prospectEvidence.prospectId,prospectId)));return rows.map(r=>r.evidence);
}
