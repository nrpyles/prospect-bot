import test from 'node:test';
import assert from 'node:assert/strict';
const {driveSearchJob} = await import('../../src/lib/discovery/execution.ts').catch(() => ({}));

test('an open search processes saved batches sequentially until the job finishes', async () => {
  assert.equal(typeof driveSearchJob, 'function');
  let inFlight = 0, peak = 0, saved = 0, updates = 0;
  await driveSearchJob(async () => {
    peak = Math.max(peak, ++inFlight);
    await Promise.resolve();
    saved++;
    inFlight--;
    return saved === 3 ? 'complete' : 'running';
  }, () => { updates++; }, new AbortController().signal, 0);
  assert.equal(saved, 3);
  assert.equal(updates, 3);
  assert.equal(peak, 1);
});

test('leaving the page lets the current batch finish without starting another', async () => {
  assert.equal(typeof driveSearchJob, 'function');
  const controller = new AbortController();
  let saved = 0, updates = 0;
  await driveSearchJob(async () => {
    controller.abort();
    saved++;
    return 'running';
  }, () => { updates++; }, controller.signal, 0);
  assert.equal(saved, 1);
  assert.equal(updates, 0);
});

test('a cancelled page never starts a provider request', async () => {
  assert.equal(typeof driveSearchJob, 'function');
  const controller = new AbortController();
  controller.abort();
  let started = false;
  await driveSearchJob(async () => { started = true; return 'complete'; }, () => {}, controller.signal, 0);
  assert.equal(started, false);
});

test('a failed processing request stops automatic retries', async () => {
  assert.equal(typeof driveSearchJob, 'function');
  let attempts = 0;
  await assert.rejects(driveSearchJob(async () => {
    attempts++;
    throw new Error('Provider unavailable');
  }, () => {}, new AbortController().signal, 0), /Provider unavailable/);
  assert.equal(attempts, 1);
});
