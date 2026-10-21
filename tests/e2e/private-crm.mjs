import { test } from 'node:test';
import assert from 'node:assert/strict';

// This runs against a configured app and an owner browser session. It never
// calls search, Gmail, or any paid provider. Fixture reads stay in this browser.
test('private CRM responsive views, research drawer, and partial search states', async () => {
  const baseURL = process.env.CRM_E2E_BASE_URL;
  const storageState = process.env.CRM_E2E_STORAGE_STATE;
  assert.ok(baseURL && storageState, 'Set CRM_E2E_BASE_URL and CRM_E2E_STORAGE_STATE for an owner test session');
  const { chromium } = await import(process.env.CRM_PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    const legacy = { id: 'fixture-legacy', name: 'Legacy Test Business', city: 'Dallas, TX', industry: 'Roofing', status: 'New Lead', source: 'Other', quality: null, valueCents: 0 };
    const good = { ...legacy, id: 'fixture-good', name: 'Seasonal Test Business', website: 'https://example.com', researchState: 'inspected', quality: 'Good', offerType: 'seo_improvements' };
    let rows = [];
    let intents = [];
    await page.route('**/api/crm', route => route.fulfill({ json: { prospects: rows, dueSequenceCount: 0, reviews: [], sender: { connected: false, emailAddress: null }, services: { google: false, publicWeb: false, ai: false }, jobs: [{ id: 'fixture-job', state: 'partial', createdAt: new Date().toISOString(), totalUnits: 2, completedUnits: 2, foundCount: 1, addedCount: 1, reviewCount: 0, heartbeatAt: null, warnings: ['Public search provider unavailable'], sources: [{ source: 'google', state: 'complete' }, { source: 'facebook', state: 'failed', error: 'Public search provider unavailable' }] }] } }));
    await page.route('**/api/prospects/*/research', route => route.fulfill({ json: { audit: null, evidence: [] } }));
    await page.route('**/api/prospects/*/messages', route => route.fulfill({ json: { history: [], intents } }));
    await page.goto(new URL('/app/prospects', baseURL).href);
    await page.getByText('No prospects match this view.').waitFor();
    rows = [legacy, good];
    await page.getByRole('button', { name: 'Refresh CRM' }).click();
    await page.getByText('Legacy Test Business', { exact: true }).waitFor();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `No horizontal document overflow at ${width}px`);
    }
    await page.getByLabel('Search prospects').fill('Legacy');
    assert.ok(page.url().includes('search=Legacy'));
    await page.getByRole('button', { name: 'Open Legacy Test Business', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByText('unchecked', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(await page.getByLabel('Search prospects').inputValue(), 'Legacy');
    intents = [{id: 'fixture-uncertain', state: 'unknown', subject: 'Previous email', expectedSender: 'test@example.com', createdAt: new Date().toISOString()}];
    await page.getByRole('button', {name: 'Open Legacy Test Business', exact: true}).click();
    await page.getByText('A previous email has unresolved delivery.', {exact: false}).waitFor();
    await page.getByRole('button', {name: 'outreach', exact: true}).click();
    assert.equal(await page.getByRole('button', {name: 'Prepare free template'}).isDisabled(), true);
    await page.keyboard.press('Escape');
    intents = [];
    await page.getByLabel('Search prospects').fill('');
    await page.getByText('Seasonal Test Business', { exact: true }).waitFor();
    await page.goto(new URL('/app/outreach', baseURL).href);
    await page.getByText('Connect your personal Gmail in Settings.', { exact: false }).waitFor();
    await page.goto(new URL('/app/searches', baseURL).href);
    await page.getByText('partial', { exact: true }).waitFor();
    await page.getByText('1 notes to review', { exact: true }).click();
    await page.getByText('Public search provider unavailable', { exact: true }).waitFor();
    await context.close();
  } finally {
    await browser.close();
  }
});
