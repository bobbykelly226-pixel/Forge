import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEducationOther } from '../profile/education';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';

test('education Other requires a bounded description and clears stale text for other choices', () => {
 assert.equal(parseEducationOther('other', '   ').ok, false);
 assert.equal(parseEducationOther('other', 'x'.repeat(201)).ok, false);
 assert.deepEqual(parseEducationOther('other', '  Nursing certification  '), {ok:true,value:'Nursing certification'});
 assert.deepEqual(parseEducationOther('prefer_not_to_say', 'Private text'), {ok:true,value:null});
 assert.deepEqual(parseEducationOther('trade_vocational', 'Old text'), {ok:true,value:null});
});
test('public education respects the current choice', () => {
 const description = 'Apprenticeship';
 assert.equal(collectStructuredPublicProfileDetails({education:'other',education_other:description}).find(x=>x.label==='Education')?.value, description);
 assert.equal(collectStructuredPublicProfileDetails({education:'prefer_not_to_say',education_other:description}).some(x=>x.label==='Education'), false);
});
