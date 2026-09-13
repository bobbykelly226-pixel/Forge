# FIX-004: primary relationship intentions

Source: Forge HQ task 3c9194770d2b814c9f3fe36523a4c9df.

## Stable value mapping

| Stored value | Approved label |
| --- | --- |
| marriage | Marriage |
| lifelong_partnership (new) | Lifelong partnership |
| serious_relationship | Long-term relationship |
| intentional_dating | Dating with intention |
| getting_to_know_someone | Getting to know someone |

Read-only Production inventory on September 13: 17 profiles; six unanswered,
six primary marriage, two serious_relationship, two intentional_dating,
one getting_to_know_someone.
Three profiles have historical multi-goal arrays. Preserve those stored arrays;
show the existing primary field, falling back to the first array element only
when the primary is absent. Explicit new edits save one selection to both fields.
No member answer backfill, deletion or automatic reselection.

The additive migration expands the existing array constraint to allow the new
slug while retaining all legacy values and arrays. Types are text/string[];
there is no database enum or generated structural type change. Existing
Compatibility Profile questions, scoring rules and eligibility are unchanged.

The shared catalog supplies selectors, Discovery filters and public labels.
Onboarding and Profile enforce one valid required choice; onboarding completion
accepts recognized historical aliases and rejects arbitrary nonempty text.

Release prerequisite: apply and verify the additive database constraint before
inviting a live Preview save of Lifelong partnership. Run disposable database
CI tests first. Founder walkthrough: existing Profile → Relationship → each
choice (one at a time), save/refresh, Preview; fresh onboarding Step 4; desktop
and mobile. Do not mark FIX-004 complete until browser/device and release
verification evidence is recorded.
