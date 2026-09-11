# FIX-001 Preview verification

The legal acceptance change is on `codex/beta-fix-001` in PR #85. Other feature
Previews do not include it until they incorporate this branch or its merged
changes. A successful Vercel build does not apply Supabase migrations.

## Readiness before asking the founder to test

1. Confirm the Preview contains PR #85 and all required checks pass.
2. Confirm Turnstile authorizes the exact Preview hostname:
   `forge-git-codex-beta-fix-001-forgedbydesign.vercel.app`.
3. Check the database used by that Preview:

   ```sql
   select to_regprocedure('public.accept_current_legal_document(text)')::text;
   ```

   A null result means the acceptance-saving test is blocked. The required
   migration is `20260911194006_streamline_legal_document_acceptance.sql`.
   It adds authenticated per-document acceptance and preserves the existing
   batch function and acceptance history. Apply it to an isolated test database,
   or obtain explicit approval before applying it to the shared live database.
   Do not create a paid resource to resolve this prerequisite without approval.
4. Forge confirmation emails use the canonical Production auth origin. After
   confirming a new test account, open the FIX-001 Preview directly and sign in
   there. The Production session does not establish a Preview session. Keep the
   server-owned authentication origin allowlist intact.

## Founder walkthrough

Open the FIX-001 Preview at `/legal/acceptance?redirectTo=%2Fonboarding`.
Check the address bar still shows the FIX-001 hostname after signing in.

- The heading is **Review your agreements**, followed by one instruction.
- Four documents show **Not reviewed** or the persisted **Accepted** status.
- Open each document and use its exact affirmative bottom action.
- Successful acceptance returns to the list and marks only that document
  **Accepted**, without a separate checkbox step.
- Refresh after accepting one document. Its saved status remains, and
  **Continue to Forge** stays unavailable until all four are accepted.
- Accept the remaining documents, continue to onboarding, then sign out and
  back in to verify persistence. The founder performs these acceptance actions;
  do not create acceptance records on their behalf to bypass this test.
- Verify keyboard, screen reader, phone, and iPad behavior separately.

The old checkbox/unlock screen means the wrong version is being tested. Stop
and resolve the deployment or navigation mismatch instead of asking the founder
to repeat the old flow. Record visual approval separately from a successful
authenticated persistence test and from Production completion.
