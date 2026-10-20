import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../../src/lib/discovery/job-policy.ts').catch(()=>({}));
test('search budgets reject oversized combinations before dispatch',()=>{
 assert.equal(typeof m.validateSearchConfig,'function');
 assert.throws(()=>m.validateSearchConfig({cities:Array(20).fill('Dallas'),industries:Array(20).fill('Roofing'),sources:['google','facebook'],maxUnits:30}),/budget/);
 const c=m.validateSearchConfig({cities:[' Dallas '],industries:['Roofing'],sources:['google']});
 assert.equal(c.cities[0],'Dallas');assert.equal(c.maxCandidates,50);
 assert.throws(()=>m.validateSearchConfig({cities:['Dallas'],industries:['Roofing'],sources:['private_facebook']}),/source/);
});
test('partial failures cannot look complete and cancellation stays cancelled',()=>{
 assert.equal(typeof m.deriveJobState,'function');
 assert.equal(m.deriveJobState(['complete','failed'],false),'partial');
 assert.equal(m.deriveJobState(['failed'],false),'failed');
 assert.equal(m.deriveJobState(['complete'],false),'complete');
 assert.equal(m.deriveJobState(['queued'],true),'cancelled');
});
