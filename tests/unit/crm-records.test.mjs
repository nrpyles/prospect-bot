import test from 'node:test';
import assert from 'node:assert/strict';
const module = await import('../../src/lib/crm-types.ts').catch(() => ({}));
test('legacy missing research stays unchecked rather than a missing website claim', () => {
  assert.equal(typeof module.normalizeResearch, 'function');
  const row = module.normalizeResearch({ quality: null, notes: 'Keep this', status: 'Interested' });
  assert.equal(row.researchState, 'unchecked');
  assert.equal(row.notes, 'Keep this');
  assert.equal(row.status, 'Interested');
  assert.equal(row.offerType, null);
});
test('an explicit unavailable result survives normalization', () => {
  assert.equal(typeof module.normalizeResearch, 'function');
  assert.equal(module.normalizeResearch({researchState: 'unavailable', quality: 'Good'}).researchState, 'unavailable');
});
