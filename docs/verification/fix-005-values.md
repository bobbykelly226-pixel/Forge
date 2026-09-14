# FIX-005: relationship values

## Scope and preservation

Founder authorizes progressing to FIX-005 after approving FIX-004 Production release.
Use the existing twelve-value source contract in Forge HQ. New onboarding completion and explicit values saves require 3–5 unique recognized selections. Shared catalog and checkbox fields serve onboarding and Profile; summaries normalize historical capitalization. The compatibility question catalog, scoring, and public/private answer visibility are unchanged.

Read-only live inventory on September 13, 2026: 11 core_values rows. Eight have 3–5 values; one has 1; two have 8. All labels normalize to the approved catalog. No member rows are rewritten. Existing completed accounts remain completed and eligible under existing rules. Unfinished accounts with invalid counts resume at Values. Existing out-of-range choices stay stored and visible in the editor until the member intentionally chooses 3–5 and saves. Never truncate eight choices or invent missing ones. Capitalization normalization is presentation-only until an explicit save.

No database schema, column types, generated types, or stored JSON shape changes. Existing RLS and private profile_answers persistence remain in use. Server application save paths reject invalid counts and unknown values before writing or clearing; generic database policies are unchanged. This is application validation, not a new database-level constraint.

## Interaction

Twelve always-visible labeled checkboxes; 1/2/3-column responsive layout. Live selected count and remaining allowance. A sixth selection leaves all choices untouched and announces how to replace a choice. The Profile form uses native constraint validation plus server validation. Onboarding keeps edits locally until Continue awaits a successful save; errors keep the member on the step with their choices intact. A refresh before Continue restores the previous saved set, as the helper explicitly states. Other onboarding answers remain saved.

## Verification

Boundary coverage enumerates all 4,096 subsets, accepts exactly 3–5, and rejects unknown values and duplicate-only minimums. Regression checks preserve legacy eight-choice sets, deselect/reselect, the sixth-choice limit, completed-account routing, and rendered twelve-checkbox markup. Existing relationship tests now use valid three-value fixtures.

Automated build, lint, application suite, and CI database regression results are recorded in the PR. Authenticated save/refresh/sign-out/cross-device and actual mobile/keyboard/screen-reader walkthroughs remain open for Preview review. Do not mark FIX-005 fully complete or release it to Production solely on rendered markup tests.
