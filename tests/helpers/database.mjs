import {randomUUID} from 'node:crypto';import {readFile} from 'node:fs/promises';
export async function isolatedDatabase(run){
 const {default:postgres}=await import('postgres');const url=process.env.TEST_DATABASE_URL;if(!url)throw new Error('TEST_DATABASE_URL is required');
 const admin=postgres(url,{max:1});const name='crm_test_'+randomUUID().replaceAll('-','');let app;
 try{await admin.unsafe(`CREATE SCHEMA ${name}`);await admin.unsafe(`SET search_path TO ${name}, public`);const original=await readFile(new URL('../../drizzle/0000_melted_killraven.sql',import.meta.url),'utf8');await admin.unsafe(original.replaceAll('--> statement-breakpoint','').replaceAll('"public".',`"${name}".`));const migration=await readFile(new URL('../../drizzle/0001_private_crm.sql',import.meta.url),'utf8');await admin.unsafe(migration);
 const connection=new URL(url);connection.searchParams.set('search_path',name+',public');process.env.DATABASE_URL=connection.href;process.env.NODE_ENV='test';app=await import('../../src/db/index.ts');await run(admin,app);
 }finally{if(app?.client)await app.client.end();await admin.unsafe(`DROP SCHEMA IF EXISTS ${name} CASCADE`);await admin.end();}
}
export async function owner(sql){const [u]=await sql`INSERT INTO users(clerk_id,email) VALUES(${randomUUID()},'test@example.com') RETURNING id`;const [o]=await sql`INSERT INTO organizations(name,slug,owner_id) VALUES('Test',${randomUUID()},${u.id}) RETURNING id`;return {orgId:o.id,userId:u.id};}
