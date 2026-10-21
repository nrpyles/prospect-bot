import test from 'node:test';import assert from 'node:assert/strict';
import {INDUSTRIES,STATUSES} from '../../src/lib/pipeline.ts';
const m=await import('../../src/lib/seasonal-trades.ts').catch(()=>({}));
test('seasonal searches support synonyms and retain original business categories',()=>{
 assert.equal(typeof m.getIndustryQueries,'function');
 assert.ok(m.getIndustryQueries('Christmas Light Installation').includes('holiday light installation'));
 for(const x of ['Roofing','HVAC','Dentist','Restaurant','Christmas Light Installation','Snow and Ice Removal'])assert.ok(INDUSTRIES.includes(x));
 assert.ok(STATUSES.includes('Interested'));
 assert.ok(m.SEARCH_PRESETS.holiday.industries.includes('Gutter Cleaning'));
});
