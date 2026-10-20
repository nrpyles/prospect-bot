import {auditMatchesWebsite} from '@/lib/crm-guards';
import {and,eq,desc,inArray,sql} from 'drizzle-orm';
import {db} from './index';
import {discoveryJobs as jobs,discoveryUnits as units,discoveryCandidates as candidates,prospects,prospectEvidence,prospectResearch} from './schema';
import type {AuditResult,Candidate,JobSummary,SearchJobConfig} from '@/lib/crm-types';
import {deriveJobState} from '@/lib/discovery/job-policy';
import {matchCandidate} from '@/lib/discovery/normalize';
function conn(){if(!db)throw new Error('Database is not configured');return db;}
export async function enqueueSearch(orgId:string,config:SearchJobConfig):Promise<{jobId:string}>{
 return conn().transaction(async tx=>{
 const [job]=await tx.insert(jobs).values({orgId,config}).returning();
 await tx.insert(units).values(config.sources.flatMap(source=>config.cities.flatMap(city=>config.industries.map(industry=>({jobId:job.id,source,city,industry})))));
 return {jobId:job.id};
 });
}
export async function getSearchJob(orgId:string,id:string):Promise<JobSummary|null>{
 const [job]=await conn().select().from(jobs).where(and(eq(jobs.orgId,orgId),eq(jobs.id,id))).limit(1);if(!job)return null;
 const raw=await conn().select().from(units).where(eq(units.jobId,id));
 const children=raw.map(u=>({...u,state:!['queued','running'].includes(job.state)&&['queued','running'].includes(u.state)?'cancelled':u.state}));
 return {id:job.id,state:job.state as JobSummary['state'],createdAt:job.createdAt.toISOString(),heartbeatAt:job.heartbeatAt?.toISOString()??null,foundCount:job.foundCount,addedCount:job.addedCount,reviewCount:job.reviewCount,totalUnits:children.length,completedUnits:children.filter(u=>['complete','failed','cancelled'].includes(u.state)).length,warnings:job.warnings,sources:children.map(u=>({source:u.source as JobSummary['sources'][number]['source'],state:u.state,error:u.error??undefined}))};
}
export async function listSearchJobs(orgId:string){const rows=await conn().select({id:jobs.id}).from(jobs).where(eq(jobs.orgId,orgId)).orderBy(desc(jobs.createdAt)).limit(30);return (await Promise.all(rows.map(r=>getSearchJob(orgId,r.id)))).filter((x):x is JobSummary=>x!==null);}
export async function cancelSearch(orgId:string,id:string){
 const rows=await conn().update(jobs).set({state:'cancelled'}).where(and(eq(jobs.id,id),eq(jobs.orgId,orgId))).returning({id:jobs.id});if(!rows.length)throw new Error('Search not found');
}
export async function claimSearchUnit(workerId:string){
 return conn().transaction(async tx=>{
 const rows=await tx.execute<{id:string;job_id:string;source:string;city:string;industry:string}>(sql`WITH candidate AS (
 SELECT u.id FROM discovery_units u JOIN discovery_jobs j ON j.id=u.job_id
 WHERE j.state IN ('queued','running') AND (u.state='queued' OR (u.state='running' AND u.lease_until < now()))
 ORDER BY j.created_at,u.id FOR UPDATE OF u SKIP LOCKED LIMIT 1)
 UPDATE discovery_units u SET state='running',worker_id=${workerId},lease_until=now()+interval '60 seconds' FROM candidate c WHERE u.id=c.id RETURNING u.*`);
 const unit=rows[0];if(!unit)return null;
 const [job]=await tx.update(jobs).set({state:'running',heartbeatAt:new Date()}).where(and(eq(jobs.id,unit.job_id),inArray(jobs.state,['queued','running']))).returning();
 if(!job)return null;return {unit,job};
 });
}
export async function renewSearchLease(unitId:string,jobId:string,workerId:string){
 return conn().transaction(async tx=>{const [job]=await tx.select({state:jobs.state}).from(jobs).where(eq(jobs.id,jobId)).limit(1);if(!job||!['queued','running'].includes(job.state))return false;
 const r=await tx.update(units).set({leaseUntil:new Date(Date.now()+60000)}).where(and(eq(units.id,unitId),eq(units.workerId,workerId),eq(units.state,'running'))).returning({id:units.id});
 if(r.length)await tx.update(jobs).set({heartbeatAt:new Date()}).where(eq(jobs.id,jobId));return r.length>0;});
}
export async function completeSearchUnit(unitId:string,workerId:string,items:{candidate:Candidate;audit:AuditResult|null}[],warnings:string[],error?:string){
 return conn().transaction(async tx=>{
  const [unit]=await tx.select().from(units).where(and(eq(units.id,unitId),eq(units.workerId,workerId),eq(units.state,'running'))).for('update');if(!unit)return;
  const [job]=await tx.select().from(jobs).where(eq(jobs.id,unit.jobId)).for('update');if(!job||!['queued','running'].includes(job.state))return;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${job.orgId}))`);
  const existing=await tx.select().from(prospects).where(eq(prospects.orgId,job.orgId));
  const identities=existing.map(p=>({id:p.id,businessName:p.name,city:p.city??'',website:p.website,phone:p.phone,placeId:p.googlePlaceId}) as Candidate);
  let added=0,reviewed=0;
  for(const {candidate:c,audit} of items){
   if(job.addedCount+job.reviewCount+added+reviewed>=job.config.maxCandidates)break;
   const url=c.evidence[0]?.url;if(!url)continue;
   const [record]=await tx.insert(candidates).values({orgId:job.orgId,jobId:job.id,sourceUrl:url,candidate:c,state:c.reviewRequired?'review':'accepted'}).onConflictDoNothing().returning();if(!record)continue;
   if(c.providerStatus==='homeowner_request'){await tx.update(candidates).set({state:'rejected'}).where(eq(candidates.id,record.id));continue;}
   if(c.reviewRequired||!c.businessName){reviewed++;continue;}
   const issues=audit?.findings.filter(f=>f.code!=='canonical_review').map(f=>f.title)??[];
   const quality=audit?.state==='missing'?'No Website':audit?.state==='inspected'?(issues.length>=5?'Terrible':issues.length>=3?'Outdated':issues.length>=2?'Decent':'Good'):null;
   if(quality&&job.config.qualityFilter&&!job.config.qualityFilter.includes(quality)){await tx.update(candidates).set({state:'filtered'}).where(eq(candidates.id,record.id));continue;}
   let id=matchCandidate(c,identities);
   if(!id){const [created]=await tx.insert(prospects).values({orgId:job.orgId,name:c.businessName,city:c.city,industry:c.industry,website:c.website,phone:c.phone,email:c.email,googlePlaceId:c.placeId,rating:c.rating,reviewCount:c.reviewCount,address:c.address,researchState:audit?.state??'unchecked',quality,qualityIssues:issues,source:c.evidence[0].source==='google'?'Google Maps Bot':c.evidence[0].source==='facebook'?'Public Facebook':'Craigslist'}).returning();id=created.id;identities.push({...c,id});added++;}
   for(const e of c.evidence)await tx.insert(prospectEvidence).values({orgId:job.orgId,prospectId:id,sourceUrl:e.url,evidence:e}).onConflictDoNothing();
   if(audit&&auditMatchesWebsite(audit,existing.some(p=>p.id===id)?existing.find(p=>p.id===id)!.website:c.website))await tx.insert(prospectResearch).values({orgId:job.orgId,prospectId:id,audit}).onConflictDoNothing();
  }
  await tx.update(units).set({state:error?'failed':'complete',error:error??null,leaseUntil:null}).where(eq(units.id,unitId));
  const children=await tx.select({state:units.state}).from(units).where(eq(units.jobId,job.id));
  const count=job.addedCount+job.reviewCount+added+reviewed;
  const state=count>=job.config.maxCandidates?deriveJobState(children.map(c=>['running','queued'].includes(c.state)?'cancelled':c.state),false):deriveJobState(children.map(c=>c.state),false);
  await tx.update(jobs).set({state,foundCount:job.foundCount+items.length,addedCount:job.addedCount+added,reviewCount:job.reviewCount+reviewed,heartbeatAt:new Date(),warnings:[...new Set([...job.warnings,...warnings,...(error?[error]:[]),...(count>=job.config.maxCandidates?['Candidate budget reached. Remaining units were cancelled.']:[])])]}).where(eq(jobs.id,job.id));
 });
}
export async function listReviewCandidates(orgId:string){return conn().select().from(candidates).where(and(eq(candidates.orgId,orgId),eq(candidates.state,'review'))).orderBy(desc(candidates.createdAt)).limit(100);}
export async function reviewCandidate(orgId:string,id:string,input:{accept:boolean;name?:string;website?:string;email?:string;phone?:string}){
 return conn().transaction(async tx=>{
  const [row]=await tx.select().from(candidates).where(and(eq(candidates.id,id),eq(candidates.orgId,orgId),eq(candidates.state,'review'))).for('update');if(!row)throw new Error('Candidate not found');
  if(!input.accept){await tx.update(candidates).set({state:'rejected'}).where(eq(candidates.id,id));return null;}
  if(!input.name?.trim())throw new Error('Confirm the business name before adding this prospect');
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${orgId}))`);
  const c=row.candidate;const verified={...c,businessName:input.name.trim(),website:input.website||null,email:input.email||null,phone:input.phone||null};
  const all=await tx.select().from(prospects).where(eq(prospects.orgId,orgId));
  let pid=matchCandidate(verified,all.map(p=>({id:p.id,businessName:p.name,city:p.city??'',website:p.website,phone:p.phone,placeId:p.googlePlaceId}) as Candidate));
  if(!pid){const [p]=await tx.insert(prospects).values({orgId,name:verified.businessName,industry:c.industry,city:c.city,website:verified.website,email:verified.email,phone:verified.phone,researchState:'unchecked',source:c.evidence[0]?.source==='facebook'?'Public Facebook':'Craigslist'}).returning();pid=p.id;}
  for(const e of c.evidence)await tx.insert(prospectEvidence).values({orgId,prospectId:pid,sourceUrl:e.url,evidence:{...e,verifiedAt:new Date().toISOString(),verifiedFields:['businessName',...(input.website?['website']:[]),...(input.email?['email']:[]),...(input.phone?['phone']:[])]}}).onConflictDoNothing();
  await tx.update(candidates).set({state:'accepted',candidate:verified}).where(eq(candidates.id,id));return {prospectId:pid};
 });
}
