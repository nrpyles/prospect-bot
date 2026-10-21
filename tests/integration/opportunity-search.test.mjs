import test from 'node:test';import assert from 'node:assert/strict';
import {isolatedDatabase,owner} from '../helpers/database.mjs';
test('focused discovery persists matching offers and excludes healthy or unverified sites',{skip:!process.env.TEST_DATABASE_URL&&'TEST_DATABASE_URL is not configured; database validation was not run'},async()=>isolatedDatabase(async(sql)=>{
 const {enqueueSearch,claimSearchUnit,completeSearchUnit}=await import('../../src/db/discovery.ts');
 const {listProspects}=await import('../../src/db/prospects.ts');
 const {orgId}=await owner(sql);
 const {jobId}=await enqueueSearch(orgId,{cities:['Dallas'],industries:['Roofing'],sources:['google'],opportunityFocus:'website_and_seo',qualityFilter:null,maxResultsPerQuery:20,maxCandidates:10,maxUnits:30});
 const claim=await claimSearchUnit('opportunity-worker',{orgId,jobId});assert.ok(claim);
 const item=(id,codes,state='inspected',errorCode)=>{
  const website=state==='missing'?null:`https://${id}.example.com/`;
  return {candidate:{id,businessName:id,displayTitle:id,city:'Dallas',industry:'Roofing',website,phone:null,email:null,placeId:id,providerStatus:'provider',reviewRequired:false,evidence:[{id,source:'google',url:`https://www.google.com/maps/search/?query_place_id=${id}`,query:'roofing Dallas',observedAt:new Date().toISOString(),publishedAt:null,verifiedAt:null,freshness:'current',snippet:id,verifiedFields:['businessName']}]},audit:{websiteUrl:website,state,errorCode,checksRun:[],checksNotRun:[],findings:codes.map(code=>({id:code,category:'on_page_seo',code,title:code,evidence:code,url:website,checkedAt:new Date().toISOString(),confidence:'observed',suggestion:'Review the page.'}))}};
 };
 await completeSearchUnit(claim.unit.id,'opportunity-worker',[
  item('healthy',['missing_description','canonical_review']),item('blocked',[],'unavailable','Website returned HTTP 403'),
  item('build',[],'missing'),item('refresh',['contact_path']),item('seo',['page_noindex']),
 ],[]);
 const saved=await listProspects(orgId);assert.equal(saved.length,3);
 assert.equal(saved.find(p=>p.name==='build').offerType,'website_build');
 assert.equal(saved.find(p=>p.name==='refresh').offerType,'website_refresh');
 assert.equal(saved.find(p=>p.name==='seo').offerType,'seo_improvements');
 assert.ok(saved.every(p=>p.opportunity.score>0&&p.nextAction));
 const [filtered]=await sql`SELECT count(*)::int AS n FROM discovery_candidates WHERE job_id=${jobId} AND state='filtered'`;assert.equal(filtered.n,2);
 // A fresh search must replace an old assessment, including when healthy now.
 const second=await enqueueSearch(orgId,{cities:['Dallas'],industries:['Roofing'],sources:['google'],opportunityFocus:'website_and_seo',qualityFilter:null,maxResultsPerQuery:20,maxCandidates:10,maxUnits:30});
 const again=await claimSearchUnit('refresh-worker',{orgId,jobId:second.jobId});assert.ok(again);
 await completeSearchUnit(again.unit.id,'refresh-worker',[item('seo',[])],[]);
 const updated=(await listProspects(orgId)).find(p=>p.name==='seo');
 assert.equal(updated.opportunity.kind,'none');assert.equal(updated.offerType,null);
 // Website changes clear generated defaults while preserving a user's custom action.
 const {updateProspect}=await import('../../src/db/prospects.ts');
 const build=saved.find(p=>p.name==='build');
 const changed=await updateProspect(orgId,build.id,{website:'https://new.example.com/',nextAction:'Call the owner tomorrow'});
 assert.equal(changed.offerType,null);assert.equal(changed.nextAction,'Call the owner tomorrow');
}));
