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

## Verification checkpoint

625 application tests, TypeScript, build and lint (zero errors) pass.
PR Validation #98, run 34745555339, passed application and disposable database
checks, including all eight new database assertions. Vercel Preview for
0f2692f84766b2c83cbed719b39f610076f898a3 is READY.
The additive constraint was applied to the shared database and verified
validated with all five accepted identifiers. Migration filename is aligned
with its recorded version 20260913073722; SQL content is unchanged.
No Production web release or founder browser acceptance is claimed.

## Superseding founder direction: flexibility and pace

Bobby approved a primary goal plus optional Also open to destinations and a
separate optional relationship-development preference. The three destinations
are Marriage, Lifelong partnership, and Long-term relationship. The two former
pace-like intentions remain visible only for members who previously selected
them; no existing answer is silently reinterpreted or overwritten. Members can
keep their legacy primary or choose a destination when ready.

Pace choices: Let it develop naturally; Move slowly and build trust; Ready to
pursue commitment. Optional clear state is supported. A security-invoker RPC
saves the primary, deduplicated alternatives, pace and onboarding resume answers
in one transaction under existing member RLS. The primary cannot also appear in
alternatives. Onboarding Continue awaits the successful save. Pace is a separate
public profile field, omitted when unanswered and cleared by account deletion.
Discovery goal filters include explicitly selected alternatives. Compatibility
question content, weights and evaluator rules remain unchanged; pace is not a
scoring input. The approved visual baseline is preserved.
