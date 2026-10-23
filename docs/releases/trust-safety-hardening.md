# Trust and Discovery hardening — October 22, 2026

Status: production database migration applied and verified; matching application release in progress. The connection blocker was resolved through the Supabase plugin after Bobby selected it again. No dashboard login was needed for the successful release.

## Verified production database release

- Applied migration `20261023021832_trust_safety_contact_and_photos` in project `uwgjdqzwcgbaaudbrvgx`.
- Trust integration assertions passed inside the migration transaction; all fixtures rolled back before commit. Corrected fixtures to supply photo review metadata, expect existing RPC error responses, and model replaced storage identities without deleting storage objects.
- Existing `forge_users_blocked` already denied suspended/removed accounts in some RPCs. This release adds lower-level guards, stronger restriction coverage and atomic spam limits; the original audit overstated the suspension gap.
- Separate five-minute voice, unauthorized access, block and ended-connection integration assertions passed and rolled back.
- Four discoverable profiles remain; zero unbound approved photos; zero disposable trust accounts.
- 50 focused application tests passed on the release tree. Earlier production build and scoped lint passed; full suite has seven documented pre-existing failures.
- Leaked-password protection remains disabled according to Supabase advisors. Identity verification is not implemented. Provider CAPTCHA/rate settings and moderation notification monitoring remain separate follow-up items, not completed claims.

Bobby authorized implementing all findings after the trust/relationship-alignment audit. Direct Production/main remains the requested release path. Do not publish this application build before its database migration succeeds.

## Implemented locally

- Database contact guards for messages, Interest, Open to Chat, accepted connections and conversation creation. Checks cover both participants, confirmed email, account restrictions, blocks and ended connections. Operator enforcement shares transaction locks with contact writes. Voluntary pausing remains separate from administrative suspension.
- Revoke direct member Interest writes; enforce reciprocal eligibility for new introductions.
- Atomic Interest allowance: 10/minute, 100/rolling 24 hours, same recipient once/24 hours. Message allowance: 30/minute across both send RPCs. Repeated messages of at least 20 characters to five other conversations within ten minutes are stopped. Ordinary retries do not consume additional allowance. No daily conversation quota; five-minute voice remains unchanged.
- Reject legacy profile photo URLs at the database and remove application fallbacks. Block stored-photo overwrites. Bind a photo's pending source and approval to the exact storage object, so delete/recreate at the same path cannot inherit approval.
- Discovery requires an approved bound photo, a relationship intention and an About section, in addition to adult eligibility and reciprocal location/preferences. All four currently discoverable profiles already have these prerequisites. Owner correction actions added.
- Page through the eligible candidate pool before ranking, calculate existing alignment for all candidates in bounded comparison batches, then select the displayed 50. Reserve one in five positions for incomplete comparisons when available; rotate ties daily. Display relationship intentions and two existing alignment explanations. A 5,000-candidate guard fails visibly instead of silently ranking a truncated pool.
- Production demo/seed overrides fail closed even if an environment flag is accidentally enabled.

## Verification completed

- TypeScript passed.
- Optimized Next.js production build passed.
- 37 focused tests passed, including five new behavior tests and existing photo/profile/seed checks.
- Full application suite: 722 tests, 715 passed, seven failures in the same previously recorded administrator-entry, beta-feedback, notifications-polish and auth-confirmation tests. Do not describe the full suite as green.
- Scoped ESLint passed after removing the obsolete gallery dependency.
- Database integration tests in `supabase/tests/trust_safety_hardening.test.sql` passed in a savepoint after the migration; fixtures rolled back before commit.

## Historical release blocker (resolved)

Three calls to `supabase_apply_migration` returned `McpServerError: Invalid or expired requestState`. The first two contained the migration plus transactional verification, and the third contained only the migration. Read-only SQL after failures confirmed `private.contact_rate_events` absent, the photo-binding column absent, zero `trust-%@example.invalid` fixture users, and four discoverable profiles. No migration or member-data change was committed.

Migration source: `supabase/migrations/20261023021832_trust_safety_contact_and_photos.sql` (renamed to match the production-assigned version).

Do not retry the same failed connector indefinitely. Its read operations work; no completed database write has been verified. No CLI Supabase access token, PostgreSQL executable or Docker is available. Bobby explicitly authorized browser fallback and completion ("yes please use anything you need to finish"). Do not ask for that permission again. No security/permission settings have been weakened to work around the error.

### Latest recovery attempt

- Supabase dashboard redirected to its sign-in page. Secure browser authentication timed out, and the next browser state check also timed out. Authentication success is unknown; do not infer success or retry credentials without fresh visible state.
- After Bobby selected the Supabase plugin again, a new migration call still returned `McpServerError: Invalid or expired requestState`.
- Review found and corrected three missing statement terminators after `$function$` in the prepared migration. These corrections have not been exercised against PostgreSQL.
- A direct SQL fallback containing the migration, savepoint verification, fixture rollback and migration-history insertion was interrupted without a result. Do not assume that tool interruption itself rolled anything back.
- A subsequent live read confirmed the rate table absent, photo-binding column absent, migration history entry absent, zero `trust-%@example.invalid` fixture users, and four discoverable profiles. Thus the latest observed production state has none of this release applied. No application code was pushed or deployed.
- Resume by rechecking live migration/schema state, then use a functioning write connection. The SQL integration tests remain unexecuted/unverified. Preserve the all-or-nothing migration plus verification transaction and do not publish the dependent application first.

## Remaining work before completion

### Explicit production approval and latest connection attempt

Bobby explicitly approved applying the production migration for suspension enforcement, spam limits, photo protection, and Discovery eligibility, then deploying the matching application changes to main. Do not request this production authorization again for this release.

After that approval, both apply_migration and the direct SQL transaction returned `Invalid or expired requestState`. The browser fallback reached the Supabase sign-in page; the secure authentication request returned `declined`. Respect that response and do not restart sign-in without a new user request. The application has not been published because it depends on the database migration.

1. Apply and verify the database migration through a functioning authorized path. Run the new integration checks and existing voice/block/end checks using disposable fixtures. Check database advisors and verify existing profiles/photos remain visible.
2. Review database regression fixtures affected by the stronger photo/readiness requirements. Old tests may insert approved photos without stored objects; update fixtures rather than weakening production checks.
3. Confirm Supabase-side CAPTCHA and rate-limit settings; enable supported leaked-password protection without silently changing the plan. The production application CAPTCHA flag was already confirmed true, but the private provider settings were not retrieved.
4. Triage existing pending photo/report records without assuming historical beta reports are real incidents or dismissing them automatically. Review alert retry/monitoring.
5. A separate robust identity-verification process is not implemented. Do not label photo approval, voice messages or CAPTCHA as identity verification. Do not collect identity documents or activate a paid vendor without a concrete reviewed design.
6. Finish review/lint, publish the verified code to main, confirm the exact Vercel Production commit and live domain, then update the Forge register/HQ. Do not repeat Bobby's already-completed basic sender/recipient voice acceptance unless a regression is found.

No claim of zero security gaps is justified by this work; report the verified changes and remaining limitations precisely.
