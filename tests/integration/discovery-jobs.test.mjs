import test from 'node:test';import assert from 'node:assert/strict';import {isolatedDatabase,owner} from '../helpers/database.mjs';
test('database leases serialize claims and cancellation prevents recovery',{skip:!process.env.TEST_DATABASE_URL&&'TEST_DATABASE_URL is not configured; database validation was not run'},async()=>isolatedDatabase(async(sql)=>{
 const {enqueueSearch,claimSearchUnit,cancelSearch,getSearchJob}=await import('../../src/db/discovery.ts');const {orgId}=await owner(sql);const config={cities:['Dallas'],industries:['Roofing'],sources:['google'],qualityFilter:null,maxResultsPerQuery:10,maxCandidates:50,maxUnits:30};
 const {jobId}=await enqueueSearch(orgId,config);const results=await Promise.all([claimSearchUnit('worker-a'),claimSearchUnit('worker-b')]);assert.equal(results.filter(Boolean).length,1);const active=results.find(Boolean);
 await sql`UPDATE discovery_units SET lease_until=now()-interval '1 second' WHERE id=${active.unit.id}`;
 const resumed=await claimSearchUnit('worker-c');assert.equal(resumed.unit.id,active.unit.id);
 await assert.rejects(cancelSearch('00000000-0000-0000-0000-000000000000',jobId));
 await cancelSearch(orgId,jobId);assert.equal((await getSearchJob(orgId,jobId)).state,'cancelled');assert.equal(await claimSearchUnit('worker-d'),null);
}));
