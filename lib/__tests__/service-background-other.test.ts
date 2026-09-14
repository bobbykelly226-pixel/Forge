import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseServiceBackgroundOther } from '../profile/service-background';
import { serviceBackgroundDisplayLabel } from '../profile/structured-options';
import { collectStructuredPublicProfileDetails } from '../profile/public-labels';

test('service Other requires a bounded description and clears it when deselected', () => {
 assert.equal(parseServiceBackgroundOther(['other'], ' ').ok, false);
 assert.equal(parseServiceBackgroundOther(['other'], 'x'.repeat(201)).ok, false);
 assert.deepEqual(parseServiceBackgroundOther(['healthcare','other'], ' HVAC technician '), {ok:true,value:'HVAC technician'});
 assert.deepEqual(parseServiceBackgroundOther(['healthcare'], 'Old text'), {ok:true,value:null});
 assert.deepEqual(parseServiceBackgroundOther(['prefer_not_to_say','other'], 'Private'), {ok:true,value:null});
});
test('service summary preserves multiple selections and private choices hide stale text', () => {
 assert.equal(serviceBackgroundDisplayLabel(['healthcare','other'], 'HVAC technician'), 'Healthcare and HVAC technician background');
 for (const value of ['none','prefer_not_to_say']) {
  assert.equal(collectStructuredPublicProfileDetails({service_backgrounds:[value],service_background:'Old summary',service_background_other:'Private'}).some(x=>x.label==='Service'), false);
 }
});
