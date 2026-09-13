# FIX-004: multi-select relationship goals

## Current founder-approved contract — September 13, 2026

This supersedes the single-primary and primary/alternatives/pace designs below,
which remain historical context. One question: **What are you looking for?**
Helper: **Select all that genuinely reflect what you’re open to.**
Choose one or more of the same five options. No ranking, secondary list or pace
control. All choices remain visible. Saved choices appear together on profiles.

Profile and onboarding share one checkbox fieldset. Existing scalar and alternative
answers load as a combined set. New saves use an atomic, member-authorized
security-invoker RPC, store the full array in profiles and the onboarding answer,
and reject zero or invalid selections. The database permits all five choices.
The old scalar field is kept for older readers, not as a member-selected priority.
Previously saved pace is retained but not displayed; no global answer rewrite.
The existing array-aware compatibility and Discovery logic remains in place.

628 local tests pass, including rendered checks of all 31 nonempty combinations,
empty-selection gating, legacy preservation, and combined public labels. Build
passes; lint has zero errors and 39 existing warnings. New database tests cover
all-five persistence, resume, deselection, return to dating, and authorization.
Founder mobile/authenticated acceptance and a Production web release remain open.

PR Validation #104 (34786376825) passed application and full database checks for
72162efc3427cc442a520d8a8ef040e1c530d8ab. Migration 20260913222046 applied to the
shared database after CI passed; the five-choice constraint and invoker-only,
authenticated execution grants were verified. No Production web release.
The pre-change security advisor reported existing definer-function warnings,
private RLS/no-policy informational notices, and leaked-password-protection
disabled. These are separate follow-up items; this change adds no definer RPC.
Password protection follow-up: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

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
