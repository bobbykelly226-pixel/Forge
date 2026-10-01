# Direct Founding Beta enrollment

Implemented October 1, 2026. Public enrollment is account creation, email confirmation, then existing onboarding. Requests, approval emails, and seven-day invitations are retired; their records remain for history.

The configured before-user-created hook retains its old name to avoid changing Auth configuration. It validates email signups without an invitation. A BEFORE INSERT trigger on auth.users serializes account creation with a row lock and enforces the configurable limit (initially 50 total accounts, including test and unconfirmed accounts). Existing accounts may sign in at capacity. Auth CAPTCHA, rate limits, legal and age gating, and photo review remain in their existing flows.

The MFA-protected Founding Beta admin page shows confirmed/unconfirmed accounts, creation and last sign-in dates, historical requester account status, copyable signup links, and the waitlist. Last sign-in is authentication activity, not evidence of feature testing. Capacity changes require operator authorization and MFA inside the server action. Enrollment RPCs are restricted to service_role; account data is not returned to public pages.

The capacity waitlist has an email-only form, honeypot, and persistent limit of three submissions per client IP hash per hour. It does not send emails automatically. Waitlist follow-up is manual; do not send messages without explicit authorization. Existing accounts are omitted from the active waitlist.

## Verification

28 focused tests passed; TypeScript check passed; focused lint had no errors (one existing img warning). Database transaction tests confirmed uninvited email acceptance, invalid email rejection, successful under-capacity insertion, over-capacity rejection, waitlist deduplication/throttling, and denied ordinary-role access to admin RPCs. All database test inserts were rolled back; 18 accounts remain at deployment.

## Email delivery follow-up

Resend reports SPF/DKIM verified and recent invitations accepted as delivered. Delivered does not establish inbox placement. A public DNS query returned no DMARC record. DNS access was not available to make this change. Add a TXT record at `_dmarc.forgedinlife.com` with value `v=DMARC1; p=none` (monitoring mode), then verify it publicly. This does not guarantee inbox placement. Test actual signup confirmation delivery with a consenting tester; no test email was sent by this change.

## Rollback

Preserve enrollment tables and legacy history. Restore the previous hook definition from the invitation-only migration if invitation gating is deliberately reinstated, and restore the matching website commit together. The capacity trigger can remain in place. Do not delete accounts or waitlist records as part of rollback.
