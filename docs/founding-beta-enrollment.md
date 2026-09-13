# Controlled Founding Beta enrollment

Status: implementation for review; not approved for production rollout.

## Approved experience

- Start with individually shared, single-use invitations for a curated 20–25 people.
- Expand using a limited-use shared invitation, subject to the global limit of 50.
- Invitations are bearer links: the first eligible signup can use any email address.
  Single-use is not identity verification and does not prevent forwarding before use.
- Email confirmation, existing Auth CAPTCHA, legal acceptance, and adult eligibility
  remain required by the existing signup/onboarding gates. No new route bypasses them.
- Invalid, expired, exhausted, revoked, paused, or full link access leads to the
  waitlist. Transient service failures stay retryable and do not claim capacity is full.
- Waitlist contact permission is explicit. Joining it does not create an account,
  send automatic emails, or guarantee admission. The legacy marketing waitlist is untouched.

## Capacity and verification

`accepted_count` counts occupied admission places, not verified members. The migration
starts from existing Auth accounts, including internal test accounts. Admission through
the Auth hook consumes one place and, where applicable, one invitation use. An account
awaiting confirmation holds its place so concurrent confirmations cannot overbook the beta.
Pending accounts do not expire or release admission places automatically in this version.
Deleting an account does not automatically restore the cumulative admission quota.

The administrator dashboard separately reads email-confirmed and unconfirmed counts
from Auth. "Email-verified" does not mean adult or identity verification, nor completed
legal acceptance. Those remain separate onboarding requirements.

Only the database hook can consume an invitation. Preflight creates a hashed,
email-bound, 30-minute proof, not a capacity hold. Failed CAPTCHA attempts cannot consume
link uses or admission places. Independent retry proofs preserve an in-flight attempt;
the first accepted signup prevents replay. Expired unused proofs are cleaned up on use.
Proof storage is bounded to five active attempts per email and 1,000 overall.

## Operator controls

Open `/internal/beta-enrollment` with an allowlisted operator account and verified MFA.
Create single-use or limited-use links, set expiration, copy a new link once, revoke it,
pause/reopen public link enrollment, change the member limit, and review the waitlist.
Raw invitation tokens are never stored in the database, logs, or account metadata.
The separate one-time proof is sent to Auth metadata solely for admission validation.

Direct email invitations remain available for internal testing when public links are
paused, but still respect global capacity. Creating a direct invitation never overwrites
an existing invitation or account's audit history. Existing-member sign-in is not paused.
Changing capacity uses the same locked settings row as admission and cannot set a limit
below occupied places. Link uses and source invitation records retain admission history.

## Deployment gate — do not skip

1. Run the full Node, TypeScript, lint, build, pgTAP and database lint checks on this PR.
2. Apply the migration to a disposable database before any live schema change. Keep the
   existing before-user-created hook enabled; its function is replaced in place.
3. Verify Preview points to the intended test database. Do not run destructive fixtures
   against production or use a production database merely because Preview can connect.
4. Confirm email confirmation and CAPTCHA are enabled in the target Auth project and
   that the specific Preview hostname is allowed by the Turnstile widget and Auth redirects.
   This change introduces no new CAPTCHA secret or external provider.
5. Verify two independent signups racing for the last global place and the last shared-link
   use. Exactly one must succeed; the other must reach the waitlist without false success.
6. Verify the desktop checks below; repeat key flows on a real phone and iPad. Simulated
   viewports are not a substitute for Bobby's device checks.
7. Obtain rollout approval, apply the production migration, deploy the application,
   verify the real counters and signup protection, and only then distribute invitations.

## Acceptance checklist

- [ ] Fresh single-use link accepts an arbitrary email without an allowlist entry.
- [ ] One link cannot create a second account; a shared link stops at its allowed uses.
- [ ] Pending signup increases occupied places, not email-verified members; confirming
      email moves the account from pending to verified without consuming another place.
- [ ] Bad/expired CAPTCHA does not consume a link or place; a fresh token permits retry.
- [ ] Expired/revoked links and proofs fail; wrong-email proof and consumed-proof replay fail.
- [ ] Pause between landing and submission is honored; existing members can still sign in.
- [ ] Full/paused/exhausted access reaches the waitlist with accurate explanation.
- [ ] Duplicate waitlist submission stores one row; no automatic email is sent.
- [ ] Nonoperators and operators without MFA cannot list private data or mutate enrollment.
- [ ] Direct internal email invitation still works without a link and respects the cap.
- [ ] Adult eligibility and all required legal agreements remain enforced before member access.
- [ ] All checks repeated against the actual deployment before the HQ item is marked complete.

This implements the approved access portion of FIX-036. It does not renumber or close
other beta fixes, and it does not replace the separate FIX-001 legal-workflow review.
