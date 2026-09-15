import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateNonNegotiables, EMPTY_NON_NEGOTIABLES, countNonNegotiables } from '../discovery/non-negotiables';
test('off is valid and ordinary answers never activate requirements', () => {
 assert.deepEqual(validateNonNegotiables(EMPTY_NON_NEGOTIABLES), EMPTY_NON_NEGOTIABLES);
 assert.equal(countNonNegotiables(EMPTY_NON_NEGOTIABLES),0);
 assert.equal(validateNonNegotiables({smoking:'never'}),null);
});
test('valid multiple choices are preserved and duplicates removed', () => {
 assert.deepEqual(validateNonNegotiables({smokeFree:true,faith:['catholic','christian','catholic'],children:['yes','open']}),{smokeFree:true,faith:['catholic','christian'],children:['yes','open']});
});
test('reject malformed, private, and unknown options', () => {
 for(const value of [null,[],{smokeFree:'false',faith:[],children:[]},{smokeFree:false,faith:['prefer_not_to_say'],children:[]},{smokeFree:false,faith:[],children:['has_kids']},{...EMPTY_NON_NEGOTIABLES,user_id:'other'}]) assert.equal(validateNonNegotiables(value),null);
});
