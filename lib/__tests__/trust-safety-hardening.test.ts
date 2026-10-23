import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankDiscoveryCandidates } from '../discovery/ranking';
import { evaluateCompatibility } from '../compatibility/engine';
import { personFromSeedCompatibilityFields } from '../compatibility';
import { SEED_DEMO_VIEWER } from '../compatibility/seed-viewer';
import { resolveAuthoritativeProfilePhotoUrl, orderedPublicPhotoUrls } from '../profile-photo';
import { canInjectSeedData, describeSeedAccessDecision } from '../seed/access';
import { contactErrorMessage } from '../safety/contact-errors';

const person = personFromSeedCompatibilityFields(SEED_DEMO_VIEWER);
const empty = evaluateCompatibility(person, person);
const aligned = (score: number) => ({ ...empty, alignment: { ...empty.alignment, key: 'strong_alignment' as const }, calculation: {weight: 1, weightedScore: score} });

test('ranking considers a strong candidate beyond the old first fifty', () => {
  const pool=Array.from({length:110},(_,i)=>({id:String(i),value:i,alignment:aligned(i===105 ? 1 : 0.6)}));
  const before=pool.map(c=>c.id);
  const ranked=rankDiscoveryCandidates(pool,50,'2026-10-22');
  assert.equal(ranked[0]?.value,105);
  assert.equal(ranked.length,50);
  assert.deepEqual(pool.map(c=>c.id),before);
});
test('incomplete evidence receives discovery room without outranking all known alignment',()=>{
  const pool=Array.from({length:20},(_,i)=>({id:String(i),value:i,alignment:i<10?aligned(0.9):null}));
  const ranked=rankDiscoveryCandidates(pool,10,'2026-10-22');
  assert.equal(ranked.filter(c=>!c.alignment).length,2);
  assert.ok(ranked[0]?.alignment);
  assert.deepEqual(ranked,rankDiscoveryCandidates(pool,10,'2026-10-22'));
  assert.equal(rankDiscoveryCandidates(pool.filter(c=>!c.alignment),50).length,10);
});
test('unreviewed legacy URLs never become a managed photo or gallery',()=>{
  const input={photos:[],legacyProfilePhotoUrl:'https://example.invalid/unapproved.png'};
  assert.equal(resolveAuthoritativeProfilePhotoUrl(input),null);
  assert.deepEqual(orderedPublicPhotoUrls(input),[]);
  assert.equal(resolveAuthoritativeProfilePhotoUrl({...input,photos:[{storage_path:'member/a.jpg',public_url:'signed-approved-url',is_primary:true}]}),'signed-approved-url');
});
test('production seed prohibition survives explicit flags and force-preview confusion',()=>{
  for (const env of [
    {NODE_ENV:'production',ENABLE_BETA_SEED:'true'},
    {VERCEL_ENV:'production',NODE_ENV:'development',ENABLE_INTERNAL_DEMOS:'true'},
    {VERCEL_ENV:'production',ENABLE_BETA_SEED:'true'},
  ]) {
    assert.equal(canInjectSeedData(env),false);
    assert.equal(describeSeedAccessDecision(env).allowed,false);
  }
  assert.equal(canInjectSeedData({NODE_ENV:'production',VERCEL_ENV:'preview'}),true);
});
test('only designated safe database errors are exposed to members',()=>{
  assert.match(contactErrorMessage('FORGE_MESSAGE_RATE_LIMIT')!,/wait a minute/);
  assert.match(contactErrorMessage('FORGE_INTEREST_REPEAT_LIMIT')!,/24 hours/);
  assert.equal(contactErrorMessage('duplicate key contains private field'),null);
});
