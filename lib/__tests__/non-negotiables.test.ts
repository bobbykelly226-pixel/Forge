import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateNonNegotiables, EMPTY_NON_NEGOTIABLES, countNonNegotiables } from '../discovery/non-negotiables';
test('off is valid and ordinary answers never activate requirements', () => {
 assert.deepEqual(validateNonNegotiables(EMPTY_NON_NEGOTIABLES), EMPTY_NON_NEGOTIABLES);
 assert.equal(countNonNegotiables(EMPTY_NON_NEGOTIABLES),0);
 assert.equal(validateNonNegotiables({smoking:'never'}),null);
});
test('valid multiple choices are preserved and duplicates removed', () => {
 assert.deepEqual(validateNonNegotiables({smokeFree:true,faith:['catholic','christian','catholic'],children:['yes','open']}),{smokeFree:true,faith:['catholic','christian'],children:['yes','open'],drinking:[],pets:[]});
});
test('reject malformed, private, and unknown options', () => {
 for(const value of [null,[],{smokeFree:'false',faith:[],children:[]},{smokeFree:false,faith:['prefer_not_to_say'],children:[]},{smokeFree:false,faith:[],children:['has_kids']},{...EMPTY_NON_NEGOTIABLES,user_id:'other'}]) assert.equal(validateNonNegotiables(value),null);
});

test('drinking and pets validate separately and reject private answers', () => {
 assert.equal(countNonNegotiables(validateNonNegotiables({...EMPTY_NON_NEGOTIABLES,drinking:['never'],pets:['no']})!),2);
 assert.equal(validateNonNegotiables({...EMPTY_NON_NEGOTIABLES,pets:['prefer_not_to_say']}),null);
});

test('new requirements reject malformed values while older saved settings still load', () => {
 for (const key of ['drinking', 'pets']) {
  for (const value of [null, false, 'never', ['prefer_not_to_say'], ['invented']]) {
   assert.equal(validateNonNegotiables({...EMPTY_NON_NEGOTIABLES, [key]:value}), null);
  }
 }
 assert.deepEqual(validateNonNegotiables({smokeFree:false,faith:[],children:[]}), EMPTY_NON_NEGOTIABLES);
});
