# Forge Data Model

Authoritative documentation for the Forge Backend Foundation persistence layer.

**Remote migration status (verified live 2026-07-29 through the connected Supabase project):**

| Layer | Result |
|---|---|
| Supabase project | `uwgjdqzwcgbaaudbrvgx` (`Forge`) |
| Project health | `ACTIVE_HEALTHY` |
| Source migration `20260723000000_questionnaire_foundation.sql` | Applied through the connector as remote ledger entry `20260726021004 questionnaire_foundation` |
| Source migration `20260725000000_compatibility_profile_persistence_v1.sql` | Applied through the connector as remote ledger entry `20260726021051 compatibility_profile_persistence_v1` |
| Source migration `20260728195226_profile_discovery_connections_stabilization.sql` | Applied as remote ledger entry `20260728195226 profile_discovery_connections_stabilization` |
| Active catalog | Compatibility Profile V2 |
| Live catalog counts | 10 categories, 80 questions, zero priority follow-up screens |
| RLS | Enabled on all 10 questionnaire catalog, response, progress, and operation tables |
| Mutation grants | Authenticated direct writes revoked; hardened owner RPCs require `operation_id` |
| Live pgTAP | 49 of 49 assertions pass inside a rollback transaction |
| Linked TypeScript types | Regenerated from the resulting live schema |

The Supabase connector records migrations using the application timestamp rather
than the repository filename timestamp. Preserve the two remote ledger entries
above; do not rewrite or repair applied history.

Executable pgTAP contracts live at
`supabase/tests/compatibility_profile_persistence_v1.test.sql`. The committed
harness installs pgTAP transactionally, includes the `extensions` schema in the
local search path, and grants the switched authenticated test role access only
to its session-owned fixture table.

**Earlier documented status (pre-questionnaire foundation):** Linked history previously recorded `20260714000000` (`forge_backend_foundation`), `20260714060000` (`migrate_compatibility_to_profile_answers`), `20260714180000` (`discovery_connections_persistence`), `20260714190000` (`discovery_without_completion_gate`), `20260714200000` (`fix_discovery_visibility_status_write`), and `20260714210000` (`structured_profile_fields_and_location`).

**Types status:** `lib/supabase/database.types.ts` is generated from the linked
schema after both questionnaire migrations. It is no longer a hand-extended
placeholder.

---

## Design principles

- Every concept helps users understand and respectfully connect with another person.
- Prefer the existing Profile V2 / onboarding vocabulary over inventing parallel fields.
- Private by default; public only when actively discoverable.
- No matching, notifications, Voice, Video, Spotify, or Stripe in this foundation.
- Messaging / conversations are defined in `20260719000000_conversation_experience_v1.sql` and documented in `docs/CONVERSATION_EXPERIENCE_V1.md`.

---

## What another authenticated Forge user may see

Other users must **not** query `profiles` with `select *`. Discovery peer reads go
through its guarded server path. Connections and pending relationship surfaces
resolve only requested, relationship-authorized members through
`load_connection_hub_profiles(uuid[])`. Photo metadata continues through
`discoverable_profile_photos`.

### Allowed (intentional public profile presentation)

| Field | Source |
|-------|--------|
| User id | `discoverable_profiles.id` |
| Display name | `full_name` |
| Public age | `age` (not date of birth) |
| City / region text | `location` |
| Relationship goals | `relationship_goals` (plural); `relationship_goal` remains a primary-value compatibility field |
| Faith | `faith_importance` |
| Service background | `service_background` |
| About | `short_bio` (canonical); `more_about` is a legacy fallback merged into About for display and cleared when About is saved |
| Children / Has children | `children`, `has_children` |
| Education, pets, smoking, drinking, career, relocation | matching columns |
| Things I Enjoy | `things_i_enjoy` |
| Favorite music | `favorite_music_artists`, `favorite_music_songs` |
| Legacy primary photo URL | `profile_photo_url` |
| Approved photo metadata | `discoverable_profile_photos` (`storage_path`, order, primary) |

### Never available to other users through profile reads

| Information | Where it lives / why blocked |
|-------------|------------------------------|
| Exact date of birth | `profile_private_details` (owner-only) |
| Postal code | `profile_private_details` (owner-only) |
| Precise coordinates | `profile_private_details` (owner-only) |
| Email address | `auth.users` only — never on profiles |
| Phone number | Not stored in Forge app tables |
| Profile status / discoverability flags | Filtered in the view; not selected for peers |
| Onboarding / completion / last-active / created / updated timestamps | Owner-only on base `profiles` |
| Private compatibility / questionnaire answers | Essential Profile answers use owner-only `profile_answers`; Compatibility Profile (100 questions) uses owner-only `user_questionnaire_*` tables; legacy `compatibility_answers` remains read-only |
| Preferences | `profile_preferences` owner-only |
| Photo moderation status | Excluded from `discoverable_profile_photos` |
| Who saved or passed them | `saved_profiles` / `passed_profiles` actor-only |

Anonymous users cannot browse dating profiles or these views.

Canonical allow-list in code: `lib/data-model-rules.ts` → `DISCOVERABLE_PROFILE_COLUMNS`.

---

## Legacy V1 field mapping

| Product concept | Database column | Notes |
|-----------------|-----------------|-------|
| Display name | `profiles.full_name` | V1 name retained |
| About | `profiles.short_bio` | Canonical public biography. Legacy `more_about` is merged for display and normalized into `short_bio` on About save. |
| Faith | `profiles.faith_importance` | V1 name retained |
| Relationship goals | `profiles.relationship_goals` | Canonical multi-select field |
| Primary relationship goal | `profiles.relationship_goal` | Legacy compatibility field synchronized to the first plural selection |
| Service background | `profiles.service_background` | Shared |
| Location (city/region) | `profiles.location` | Public-safe text only |
| Age (public) | `profiles.age` | Exact DOB is private |

`waitlist` and `feedback` are marketing tables and are intentionally untouched.

---

## Compatibility answers transition (completed)

**`profile_answers` is authoritative.** Onboarding and profile questionnaire reads/writes use `profile_answers` only.

### Migration applied

- Migration `20260714060000_migrate_compatibility_to_profile_answers.sql` copies legacy rows from `compatibility_answers` into `profile_answers` (`question_key` unchanged; `answer_value` → `answer`).
- Idempotent: `on conflict (user_id, question_key) do nothing`.
- Does **not** delete `compatibility_answers`.
- Table comment marks `compatibility_answers` as **legacy / read-only**.

### Application rules

1. **Do not dual-write** into both tables.
2. App code must not call `.from('compatibility_answers')` for reads or writes.
3. Keys in use today: `relationship_intention`, `core_values`.
4. A later cleanup migration may drop or archive `compatibility_answers`; not in this PR.

### Photo storage note

The `profile-photos` bucket is **private**. The server signs short-lived owner previews, and Discovery can access only approved photos for eligible profiles. New or replaced photos return to `pending` moderation.

Operator review is available only through `/internal/photo-moderation` for confirmed accounts in the server-only `FORGE_OPERATOR_EMAILS` allowlist. Approve/reject decisions record `reviewed_at`, `reviewed_by`, and a required rejection reason on the current photo row. Every decision also creates an append-only `profile_photo_moderation_events` record through the service-role-only `review_profile_photo` function. Ordinary members and anonymous callers have no audit-table or moderation-function access.

---

## Tables (summary)

See migration SQL for full DDL. High level:

1. **`profiles`** — owner full row; peers use `discoverable_profiles`
2. **`profile_private_details`** — DOB, postal, coords; owner-only
3. **`profile_preferences`** — owner-only discovery prefs
4. **`profile_answers`** — Essential Profile / onboarding answers; owner-only
5. **`profile_photos`** — owner metadata; peers use `discoverable_profile_photos`
6. **`user_app_state`** — onboarding flags; owner-only
7. **`saved_profiles` / `passed_profiles`** — private actor-only
8. **`interests` / `open_to_chat_requests`** — participants read; restricted writes
9. **`connections`** — participants select; no client writes
10. **`user_blocks`** — blocker-only
11. **`character_signals`** — positive-only; giver create; receiver approve/decline
12. **Questionnaire catalog** — `questionnaire_versions`, `questionnaire_categories`, `questionnaire_eligibility_rules`, `questionnaire_questions`, `questionnaire_answer_choices` (readable catalog; not user-editable)
13. **Compatibility Profile responses** — `user_questionnaire_progress`, `user_questionnaire_responses`, `user_questionnaire_selected_choices`, `user_questionnaire_priority_selections` (owner-only RLS; never public)
14. **Connections public projection** — `load_connection_hub_profiles(uuid[])`; signed-in only, relationship-authorized, blocked-user-aware, and limited to the public allowlist

Untouched by Compatibility Profile persistence: Essential Profile `/onboarding`, legacy `compatibility_answers` (read-only), `waitlist`, `feedback`, Compatibility Engine V1.

### Compatibility Profile persistence (repository migrations)

- `20260723000000_questionnaire_foundation.sql` — catalog + response tables, RLS, 100-question seed (`compatibility_profile_categories_1_10_v10`)
- `20260725000000_compatibility_profile_persistence_v1.sql` — resume fields, server `revision`/`write_generation`, mandatory-`operation_id` mutation RPCs only:
  - `save_my_questionnaire_response(text, text, text[], uuid, text[], jsonb, jsonb, bigint, bigint)`
  - `clear_my_questionnaire_question(text, text, uuid, bigint, bigint)`
  - `clear_my_questionnaire_category(text, text, uuid, bigint)`
  - `clear_my_questionnaire_profile(text, uuid, bigint)`
  - plus `save_my_questionnaire_progress_position` and `load_my_questionnaire_state`
  - Legacy operation-id-free mutation overloads are dropped. Direct table writes are revoked.

Application code must not dual-write Compatibility Profile answers into `profile_answers`, `compatibility_answers`, `profiles`, or `user_app_state`.

---

## Enums

`profile_status`, `answer_visibility`, `photo_moderation_status`, `interest_status`, `open_to_chat_status`, `connection_source`, `connection_status`, `character_signal_status`, `character_signal_interaction`

---

## Protected system information

Triggers prevent ordinary authenticated clients from changing:

- Ownership / participant ids (`id`, `user_id`, sender/recipient, giver/receiver, connection pair)
- Administrative `profiles.status`
- Completion timestamps except a one-time null→set stamp
- `profile_photos.moderation_status`
- Open to Chat / interest / connection protected status fields outside allowed transitions
- `created_at` immutability

Users may edit intentional profile presentation fields and preferences that belong to them (`OWNER_EDITABLE_PROFILE_COLUMNS` in `lib/data-model-rules.ts`). Connection inserts require trusted SQL (`forge.allow_system_writes = on`).

Member lifecycle controls use the existing protected status model without weakening operator enforcement:

- `paused` hides the member from Discovery but preserves existing conversations.
- `deactivated` disables member interactions and requires recent password confirmation to enter or leave.
- retention, deletion, legal hold, and lifecycle audit data lives in private service-only tables described in `docs/ACCOUNT_LIFECYCLE_PRIVACY_CONTROLS.md`.

---

## New-account reliability

1. Signup trigger `handle_new_user` calls `ensure_foundational_user_records`.
2. That function idempotently inserts `profiles`, `profile_private_details`, `profile_preferences`, `user_app_state`.
3. Failures during signup are **logged as warnings** (auth must not abort) and repaired later.
4. Server data layer calls `ensureFoundationalRecords()` → RPC `ensure_foundational_user_records` before profile reads/writes. Missing rows are repaired and logged; incomplete repair returns an error (not silently ignored).
5. Migration backfills existing `auth.users` idempotently.

New profiles are never auto-discoverable.

---

## Storage / profile photos approach

**Decision: keep `profile-photos` PRIVATE and use server-issued signed URLs.**

Why: profile photos are sensitive user content. Owners may preview their own pending photos, while other authenticated members may retrieve only approved photos belonging to profiles they are eligible to discover.

Owner-scoped upload/update/delete policies remain. Private-bucket + signed-URL retrieval is deferred to the profile-persistence PR.

Path convention remains `{user_id}/{filename}`.

---

## RLS summary

| Table / view | Peer / other access |
|--------------|---------------------|
| `profiles` | Owner only |
| `discoverable_profiles` | Authenticated select of public columns for active+discoverable |
| Private / prefs / answers / app state | Owner only |
| `profile_photos` | Owner only |
| `discoverable_profile_photos` | Authenticated select of approved metadata |
| `load_connection_hub_profiles(uuid[])` | Authenticated execution; returns public fields only for a relationship participant or saved discoverable profile |
| Saved / passed / blocks | Actor only |
| Interests / O2C / signals | Participants; restricted writes |
| Connections | Participants select only |
| Anonymous | No dating profile browsing |

---

## Profile completion

Source: `lib/profile-completion.ts`

Counted: photos, about, details, alignment, factors, enjoy, music.  
**Excluded (Coming Soon):** Voice, Video.

---

## Intentionally deferred

- Matching scores / Relationship Alignment calculations
- Messaging / message threads / notifications
- Private photo bucket + signed URLs
- Voice / Video / Spotify / Stripe
- Numeric daily Open to Chat send limit (counting infrastructure exists; product number not chosen)
- Dual-write elimination cleanup for `compatibility_answers`

---

## Discovery & relationships (PR persistence layer)

Trusted RPCs (security definer):

- `set_my_discovery_visibility` — Show Me in Discovery (activates `status=active` when enabling; **completion is not required**)
- `can_activate_discovery_visibility` — safety only (blocks deactivated/hidden)
- `list_eligible_discovery_profiles` / `get_eligible_discovery_profile`
- `save_profile_for_later` / `remove_saved_profile` / `pass_on_profile`
- `send_interest` / `withdraw_interest` (mutual → `forge_ensure_connection`)
- `send_open_to_chat` / `respond_open_to_chat` (`accept` | `defer` | `decline`)
- `forge_users_blocked` / `count_open_to_chat_sent_today` / `mark_open_to_chat_education_seen`

**Discoverability product rule:** Profile completion % is informational only. Any authenticated owner may enable Discovery unless the account is deactivated or hidden. Partial profiles may appear; empty sections are omitted (no filler).

`open_to_chat_status` includes `deferred` for Not Right Now (private to recipient).

App config: `lib/discovery/config.ts` (`OPEN_TO_CHAT_DAILY_LIMIT = null` until product decides).

---

## Data access layer

`lib/data/` — authenticated user only; calls `ensureFoundationalRecords` first:

- `ensureFoundationalRecords`
- `getCurrentUserProfile` / PrivateDetails / Preferences / ProfileAnswers / ProfilePhotos / AppState
- `upsertCurrentUserProfile` (editable columns only)
- `updateOnboardingProgress` / `hasCompletedOnboarding`
