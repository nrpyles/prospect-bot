import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {isolatedDatabase,owner} from '../helpers/database.mjs';
test('prepared send keys are unique and stopped prospects cancel queued mail',{skip:!process.env.TEST_DATABASE_URL&&'TEST_DATABASE_URL is not configured; database validation was not run'},async()=>isolatedDatabase(async(sql)=>{
 const {prepareSend,executeSend,stopProspectOutreach}=await import('../../src/db/send-intents.ts');const {saveGmailConnection}=await import('../../src/db/connections.ts');const ctx=await owner(sql);
 await saveGmailConnection(ctx.userId,{accessToken:'test-token',expiresAt:new Date(Date.now()+3600000),scope:'gmail.send'},'test@example.com','test@example.com');
 const [p]=await sql`INSERT INTO prospects(org_id,name) VALUES(${ctx.orgId},'Test business') RETURNING id`;const input={...ctx,prospectId:p.id,clientKey:randomUUID(),recipient:'business@example.com',subject:'A website idea',body:'Test fixture. Never send.'};
 const [a,b]=await Promise.all([prepareSend(input),prepareSend(input)]);assert.equal(a.intentId,b.intentId);
 await stopProspectOutreach(ctx.orgId,p.id,'replied');const result=await executeSend({...ctx,prospectId:p.id,intentId:a.intentId,expectedSender:'test@example.com'},async()=>{throw new Error('Test transport: live Gmail is prohibited');});assert.equal(result.state,'cancelled');
 const [count]=await sql`SELECT count(*)::int AS total FROM messages`;assert.equal(count.total,0);
}));
