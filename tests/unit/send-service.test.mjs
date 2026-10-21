import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../../src/lib/outreach/send-service.ts').catch(()=>({}));
function store(options={}){const intent={id:'i',orgId:'org',userId:'u',prospectId:'p',expectedSender:'neal@example.com',recipient:'business@example.com',subject:'Website idea',body:'Hello',state:'prepared',outreachDisposition:'active',...options};let calls=0;
return {intent,get calls(){return calls;},deps:{load:async()=>({...intent}),sender:async()=>({emailAddress:'neal@example.com',accessToken:'token'}),claim:async()=>{if(intent.state!=='prepared')return false;intent.state='sending';return true;},provider:async()=>{calls++;return{id:'message',threadId:'thread'};},record:async()=>{intent.state='sent';},uncertain:async()=>{intent.state='unknown';}}};}
const input={intentId:'i',orgId:'org',userId:'u',prospectId:'p',expectedSender:'neal@example.com'};
test('repeated clicks on one intent cause only one provider send',async()=>{
 assert.equal(typeof m.sendApprovedIntent,'function');const s=store();const r=await Promise.all([m.sendApprovedIntent(input,s.deps),m.sendApprovedIntent(input,s.deps)]);
 assert.equal(s.calls,1);assert.equal(s.intent.state,'sent');assert.ok(r.some(x=>x.state==='sent'));
});
test('changed sender, wrong ownership, or stopped prospect sends nothing',async()=>{
 assert.equal(typeof m.sendApprovedIntent,'function');
 for(const patch of [{orgId:'other'},{outreachDisposition:'replied'},{outreachDisposition:'do_not_contact'},{expectedSender:'other@example.com'}]){const s=store(patch);await assert.rejects(m.sendApprovedIntent(input,s.deps));assert.equal(s.calls,0);}
 const s=store();s.deps.sender=async()=>null;await assert.rejects(m.sendApprovedIntent(input,s.deps));assert.equal(s.calls,0);
});
test('acceptance with logging failure blocks automatic resend',async()=>{
 assert.equal(typeof m.sendApprovedIntent,'function');const s=store();s.deps.record=async()=>{throw new Error('Database failed');};
 assert.equal((await m.sendApprovedIntent(input,s.deps)).state,'unknown');assert.equal((await m.sendApprovedIntent(input,s.deps)).state,'unknown');assert.equal(s.calls,1);
});
