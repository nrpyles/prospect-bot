import test from 'node:test';
import assert from 'node:assert/strict';
import * as guards from '../../src/lib/crm-guards.ts';

test('a blank optional demo URL cannot block saving a valid business website', () => {
  assert.equal(typeof guards.isOptionalHttpUrl, 'function');
  const fields = {website: 'https://example.com/', externalProjectUrl: ''};
  assert.equal(guards.isOptionalHttpUrl(fields.website), true);
  assert.equal(guards.isOptionalHttpUrl(fields.externalProjectUrl), true);
});

test('a prospect without either optional URL can still be saved', () => {
  assert.equal(typeof guards.isOptionalHttpUrl, 'function');
  const fields = {website: '', externalProjectUrl: ''};
  assert.equal(Object.values(fields).every(guards.isOptionalHttpUrl), true);
});

test('malformed and unsupported URLs fail validation without throwing', () => {
  assert.equal(typeof guards.isOptionalHttpUrl, 'function');
  for (const value of ['not a URL', 'https://', 'https://exa mple.com', 'javascript:alert(1)', 'ftp://example.com/']) {
    assert.equal(guards.isOptionalHttpUrl(value), false, value);
  }
  assert.equal(guards.isOptionalHttpUrl('http://example.com/contact?from=crm'), true);
});
