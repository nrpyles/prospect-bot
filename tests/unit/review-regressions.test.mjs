import test from 'node:test';
import assert from 'node:assert/strict';
const policy = await import('../../src/lib/crm-guards.ts').catch(() => ({}));
const {auditHtml} = await import('../../src/lib/research/website-audit.ts');

test('a rejected public listing does not require fabricated business fields', () => {
  assert.equal(typeof policy.candidateReviewInput, 'function');
  assert.deepEqual(policy.candidateReviewInput({accept: false, name: '', website: 'incomplete text', email: ''}), {accept: false});
  assert.deepEqual(policy.candidateReviewInput({accept: true, name: 'Verified Business'}), {accept: true, name: 'Verified Business'});
});

test('persisted uncertain delivery blocks new drafts until reconciled', () => {
  assert.equal(typeof policy.hasUnresolvedDelivery, 'function');
  for (const state of ['unknown', 'sending']) assert.equal(policy.hasUnresolvedDelivery([{state}]), true);
  assert.equal(policy.hasUnresolvedDelivery([{state: 'sent'}, {state: 'cancelled'}]), false);
  assert.equal(policy.hasUnresolvedDelivery([]), false);
});

test('changing a website invalidates findings and rejects an old in flight audit', () => {
  assert.equal(typeof policy.auditMatchesWebsite, 'function');
  const audit = auditHtml('<html></html>', 'https://old.example.com/');
  assert.equal(policy.auditMatchesWebsite(audit, 'https://old.example.com'), true);
  assert.equal(policy.auditMatchesWebsite(audit, 'https://new.example.com'), false);
  assert.equal(policy.auditMatchesWebsite({...audit, websiteUrl: undefined}, 'https://old.example.com'), false);
  assert.equal(policy.websiteChanged('https://old.example.com/', 'https://old.example.com'), false);
  assert.equal(policy.websiteChanged('https://old.example.com/', ''), true);
});

test('legacy Not Interested contacts remain stopped despite active new defaults', () => {
  assert.equal(typeof policy.canContactProspect, 'function');
  assert.equal(policy.canContactProspect({status: 'Not Interested', outreachDisposition: 'active'}), false);
  assert.equal(policy.canContactProspect({status: 'New Lead', outreachDisposition: 'replied'}), false);
  assert.equal(policy.canContactProspect({status: 'New Lead', outreachDisposition: 'active'}), true);
});

test('unknown legacy locations do not block unrelated website or draft actions', () => {
  assert.equal(typeof policy.prospectPatchInput, 'function');
  assert.deepEqual(policy.prospectPatchInput({city: '', website: 'https://example.com'}), {website: 'https://example.com'});
  assert.deepEqual(policy.prospectPatchInput({city: 'Dallas, TX'}), {city: 'Dallas, TX'});
});

test('sequence completion uses the expected step and cannot revive paused work', async () => {
  const sequence = await import('../../src/lib/outreach/sequence-progress.ts').catch(() => ({}));
  assert.equal(typeof sequence.nextEnrollmentState, 'function');
  const current = {currentStepPosition: 0, completedAt: null, pausedAt: null};
  const steps = [{kind: 'email'}, {kind: 'wait', waitDays: 2}, {kind: 'email'}];
  const now = new Date('2026-10-20T12:00:00Z');
  const next = sequence.nextEnrollmentState(current, steps, 0, now);
  assert.equal(next.currentStepPosition, 2);
  assert.equal(next.nextActionAt.toISOString(), '2026-10-22T12:00:00.000Z');
  assert.equal(sequence.nextEnrollmentState({...current, ...next}, steps, 0, now), null);
  assert.equal(sequence.nextEnrollmentState({...current, pausedAt: now}, steps, 0, now), null);
  assert.equal(sequence.nextEnrollmentState({...current, completedAt: now}, steps, 0, now), null);
});
