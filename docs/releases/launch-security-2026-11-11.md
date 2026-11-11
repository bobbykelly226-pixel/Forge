# November 11 launch security review

## Confirmed baseline

GitHub main and Vercel Production both point to 90884b1428d73b41c72ce9bbc9e774c54412e159 before this release. The October trust release remains live.

## Recovery correction prepared for release

- Recovery intent in query/hash type or next path consistently routes to /auth/update-password.
- Invalid, expired, replayed, missing and failed-exchange recovery links use reset-specific guidance, including the token-hash server route. Signup confirmation keeps its separate behavior.
- Password update explicitly requests global sign-out, then returns to login. A failed sign-out shows an honest partial-success error and can retry without updating the password again.
- This revokes refresh sessions; existing access JWTs may remain valid until expiry. Strict immediate database token invalidation and a live two-device reset rehearsal remain unverified.
- No database migration or changes to real member credentials/data.

Validation: 32 focused auth/account tests including six actual-callback scenarios with mocked provider/browser boundaries; TypeScript; scoped lint; optimized Next webpack build. The earlier whole-suite result was 715/722; no new fully green whole-suite claim.

## Fresh operational findings

- Supabase advisor: leaked password protection is disabled. Paid plan/setting decision remains open.
- Provider CAPTCHA/rate settings are not exposed by the current connector. Dashboard inspection reached sign-in; no authentication bypass attempted. Earlier verified settings are historical evidence only.
- Resend forgedinlife.com domain verified, sending enabled, click/open tracking disabled.
- Public DNS returned no _dmarc.forgedinlife.com TXT answer. Root TXT contained Google site verification. Do not conclude SPF is broken: sending subdomain/DKIM require their own review. DNS publishing capability is not available in the connected Namecheap tools.
- Queue aggregate: 4 pending photos (oldest October 6), 33 approved; 5 pending operator cases (oldest August 22), 1 resolved. Historical test classification is pending; counts are not a count of genuine incidents.
- Report notifications: 1 pending (oldest July 31), 3 provider-accepted. Acceptance is not proof of inbox delivery.
- Security-definer discoverable_profiles view is advisor-flagged and authenticated users retain grants. Its definition filters active/discoverable/eligible profiles but requires separate adversarial authorization review; do not blindly change it to invoker and break Discovery. This finding is open, not yet proven exploitable.
- The 25 no-policy tables and 68 authenticated definer RPC advisory findings are not 93 confirmed vulnerabilities. Review grants/intent and authorization individually.

## Outstanding checks

Current provider Auth configuration and password protection; real-user reset/account-control rehearsal with disposable fixtures; strict post-reset session validity; discoverable_profiles authorization; DMARC plus actual delivery test; moderation test-vs-real triage and retry/alerts; older bilateral-pass, attachment/report workflow acceptance; legal/trust review; operating metrics and uptime alerts.

Next checks must not silently weaken CAPTCHA, MFA, RLS, or photo approval. Do not delete real users or dismiss reports to make counts look clean.
