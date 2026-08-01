# Forge Launch Analytics

## What this answers

Forge Launch Analytics is the smallest useful measurement system for the founding beta. It helps the team answer:

- Are people reaching Forge, and which pages bring them in?
- Can they create an account, sign in, finish onboarding, and become discoverable?
- Do they use Forge's intentional Discovery actions?
- Do introductions turn into connections, conversations, and messages?
- Which routes feel slow or unstable on real devices?
- Are beta users able to send feedback when they need help?

It is not a member surveillance system and is not an authoritative business or safety record.

## Where to view it

- **Vercel → Forge → Web Analytics**: visitors, page views, routes, referrers, devices, and custom launch events.
- **Vercel → Forge → Speed Insights**: Core Web Vitals and route-level performance.
- **Vercel → Forge → Logs**: runtime errors and failed requests. Logs remain the debugging source; analytics events do not replace them.

Web Analytics and Speed Insights must be enabled for the Forge Vercel project. Production data begins after the first production deployment containing this instrumentation. Preview traffic is intentionally discarded.

## Launch event catalog

| Event | Meaning | Allowed breakdown |
| --- | --- | --- |
| Account Signup Accepted | Forge accepted a new account flow | Instant session or email confirmation |
| Sign In Completed | An existing member signed in successfully | None |
| Onboarding Completed | The member completed the onboarding flow | None |
| Compatibility Category Completed | A Compatibility Profile category was completed | Category number only |
| Compatibility Profile Completed | All eligible Compatibility Profile categories were complete | None |
| Discovery Visibility Enabled | A member successfully became visible in Discovery | None |
| Discovery Action Completed | A real Discovery decision succeeded | Interested, Open to Chat, Save for Later, or Not for Me |
| Open To Chat Response Completed | An incoming Open to Chat request was handled | Accepted, saved for later, or declined |
| Connection Created | A mutual connection was created | Mutual interest or accepted Open to Chat |
| Conversation Started | A connection created its first conversation thread | None |
| Message Sent | A real message was saved successfully | No attachment, photo, or file |
| Beta Feedback Submitted | A private beta-feedback record was saved successfully | None |

Events are emitted only after the underlying member action succeeds. Failed clicks and optimistic UI changes are not counted as completions.

## Privacy contract

Analytics must never receive:

- names, emails, user IDs, profile IDs, or conversation IDs;
- Compatibility Profile questions, answers, priorities, or private matching inputs;
- profile text, exact location, photos, or file names;
- message text, attachments, feedback text, report reasons, report details, or evidence;
- authentication codes, query strings, URL fragments, or password-reset tokens.

All query strings and hashes are removed before an event is sent. Dynamic Discovery and conversation URLs are converted to route templates. Unexpected UUID path segments are redacted as a final boundary. Only the current `forgedinlife.com` production hosts are accepted; Vercel Preview and legacy-domain traffic are dropped.

Every new event property must be added to the central allowlist and covered by the privacy regression tests before release.

## Founding-beta review

Review these numbers daily during the first week and then at least weekly:

1. **Entry:** visitors, landing pages, referrers, and signup-page visits.
2. **Activation:** signup accepted → onboarding completed → Discovery visibility enabled.
3. **Compatibility:** category completions and full Compatibility Profile completions.
4. **Intentional discovery:** the mix of Interested, Open to Chat, Save for Later, and Not for Me.
5. **Connection health:** connections created → conversations started → messages sent.
6. **Product friction:** beta feedback, 4xx/5xx requests, runtime errors, and slow routes.

Interpret small founding-beta numbers qualitatively. A single user can complete an event more than once, while Vercel's visitor counts provide the unique-visitor view where available.
