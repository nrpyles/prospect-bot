import test from 'node:test';import assert from 'node:assert/strict';
const audit=await import('../../src/lib/research/website-audit.ts').catch(()=>({}));
const safe=await import('../../src/lib/research/safe-fetch.ts').catch(()=>({}));
test('rejects private and mapped network targets',()=>{
 assert.equal(typeof safe.isPublicAddress,'function');
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.1.1','::1','fc00::1','fe80::1','::ffff:127.0.0.1','::ffff:7f00:1','0.0.0.0','100.64.1.1'])assert.equal(safe.isPublicAddress(ip),false,ip);
 assert.equal(safe.isPublicAddress('8.8.8.8'),true);
});
test('audit reports observed metadata gaps without inventing ranking claims',()=>{
 assert.equal(typeof audit.auditHtml,'function');
 const r=audit.auditHtml('<html><head><title>Acme</title></head><body><h1>Acme</h1><a href="tel:2145551234">Call</a></body></html>','https://example.com');
 assert.equal(r.state,'inspected');assert.ok(r.findings.some(f=>f.code==='missing_description'));
 assert.ok(!r.findings.some(f=>f.code==='missing_title'));assert.ok(r.checksNotRun.includes('Search rankings and traffic'));
});
test('blocked sites stay unavailable, not missing or poor',async()=>{
 assert.equal(typeof audit.inspectWebsite,'function');
 const r=await audit.inspectWebsite('http://127.0.0.1');assert.equal(r.state,'unavailable');assert.equal(r.findings.length,0);
 assert.equal((await audit.inspectWebsite(null)).state,'missing');
});
test('redirects to private networks never reach the next request',async()=>{
 let calls=0;
 await assert.rejects(safe.safeFetchPage('https://example.com',{policy:{resolve:async()=>[{address:'8.8.8.8',family:4}],request:async()=>{calls++;return {status:302,location:'http://169.254.169.254/latest/meta-data',html:''};}}}),/Private/);
 assert.equal(calls,1);
});
test('mixed DNS results fail closed and oversized content is rejected',async()=>{
 await assert.rejects(safe.safeFetchPage('https://example.com',{policy:{resolve:async()=>[{address:'8.8.8.8',family:4},{address:'10.0.0.1',family:4}],request:async()=>{throw new Error('should not fetch');}}}),/Private/);
 await assert.rejects(safe.safeFetchPage('https://example.com',{policy:{resolve:async()=>[{address:'8.8.8.8',family:4}],request:async()=>({status:200,html:'x'.repeat(1048577)})}}),/limit/);
});

test('a supplied researched homepage retains static SEO and internal-link check reporting',async()=>{
 const r=await audit.inspectWebsite('https://example.com',{page:{url:'https://www.example.com/',html:'<title>Example</title><h1>Lighting</h1>'}});
 assert.equal(r.websiteUrl,'https://example.com');assert.equal(r.state,'inspected');
 assert.ok(r.checksRun.includes('Internal links checked: 0'));
 assert.ok(r.findings.some(f=>f.code==='missing_description'));
});
