import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
test('additive migration retains legacy prospect values and is repeatable', {skip: !process.env.TEST_DATABASE_URL && 'TEST_DATABASE_URL is not configured; database validation was not run'}, async () => {
  const {default:postgres}=await import('postgres');
  const sql=postgres(process.env.TEST_DATABASE_URL,{max:1});
  const schema='crm_test_'+randomUUID().replaceAll('-','');
  try {
    await sql.unsafe(`CREATE SCHEMA ${schema}`); await sql.unsafe(`SET search_path TO ${schema}, public`);
    const base=await readFile(new URL('../../drizzle/0000_melted_killraven.sql',import.meta.url),'utf8');
    await sql.unsafe(base.replaceAll('--> statement-breakpoint','').replaceAll('"public".',`"${schema}".`));
    const [u]=await sql`INSERT INTO users(clerk_id,email) VALUES('legacy','legacy@example.com') RETURNING id`;
    const [o]=await sql`INSERT INTO organizations(name,slug,owner_id) VALUES('Legacy','legacy',${u.id}) RETURNING id`;
    const [p]=await sql`INSERT INTO prospects(org_id,name,quality,status,notes) VALUES(${o.id},'Legacy business',null,'Interested','Keep this') RETURNING id`;
    const [stopped]=await sql`INSERT INTO prospects(org_id,name,status) VALUES(${o.id},'Stopped legacy business','Not Interested') RETURNING id`;
    const [seq]=await sql`INSERT INTO sequences(org_id,name,is_active) VALUES(${o.id},'Legacy sequence',true) RETURNING id`;
    const completedAt=new Date('2026-09-01T12:00:00Z');
    const [finished]=await sql`INSERT INTO sequence_enrollments(sequence_id,prospect_id,completed_at,next_action_at) VALUES(${seq.id},${p.id},${completedAt},null) RETURNING id`;
    await sql`INSERT INTO sequence_enrollments(sequence_id,prospect_id,next_action_at) VALUES(${seq.id},${stopped.id},now())`;
    const migration=await readFile(new URL('../../drizzle/0001_private_crm.sql',import.meta.url),'utf8');
    await sql.unsafe(migration.replaceAll('--> statement-breakpoint','')); await sql.unsafe(migration.replaceAll('--> statement-breakpoint',''));
    const [row]=await sql`SELECT * FROM prospects WHERE id=${p.id}`;
    assert.equal(row.notes,'Keep this'); assert.equal(row.status,'Interested'); assert.equal(row.quality,null); assert.equal(row.research_state,'unchecked');
    const [finishedRow]=await sql`SELECT * FROM sequence_enrollments WHERE id=${finished.id}`;
    assert.equal(finishedRow.completed_at.toISOString(),completedAt.toISOString());assert.equal(finishedRow.next_action_at,null);
    const [stoppedRow]=await sql`SELECT * FROM prospects WHERE id=${stopped.id}`;
    assert.equal(stoppedRow.status,'Not Interested');

  } finally {await sql.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await sql.end();}
});
