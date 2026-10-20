import test from 'node:test'; import assert from 'node:assert/strict';
const m=await import('../../src/lib/private-access.ts').catch(()=>({}));
test('only the configured owner or verified configured email can enter',()=>{
 assert.equal(typeof m.isAllowedOwner,'function');
 assert.equal(m.isAllowedOwner({clerkId:'owner',verifiedEmail:null},{ownerClerkId:'owner'}),true);
 assert.equal(m.isAllowedOwner({clerkId:'x',verifiedEmail:'NEAL@example.com'},{ownerEmail:'neal@example.com'}),true);
 assert.equal(m.isAllowedOwner({clerkId:'x',verifiedEmail:null},{ownerEmail:'neal@example.com'}),false);
 assert.equal(m.isAllowedOwner({clerkId:'owner',verifiedEmail:'neal@example.com'},{}),false);
 assert.equal(m.isAllowedOwner({clerkId:'other',verifiedEmail:'neal@example.com'},{ownerClerkId:'owner',ownerEmail:'neal@example.com'}),false);
});
