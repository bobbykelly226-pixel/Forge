# Forge Data Model

Authoritative documentation for the Forge Backend Foundation persistence layer.

**Remote migration status:** Applied to the linked Forge Supabase project via `supabase migration up --linked`. Remote migration history records `20260714000000` (`forge_backend_foundation`), `20260714060000` (`migrate_compatibility_to_profile_answers`), `20260714180000` (`discovery_connections_persistence`), and `20260714190000` (`discovery_without_completion_gate`).

**Types status:** `lib/supabase/database.types.ts` was **generated from the linked, applied Forge Supabase schema** via `npx supabase gen types typescript --linked --schema public` after migration `20260714190000` was recorded remotely.

---

## Design principles

- Every concept helps users understand and respectfully connect with another person.
- Prefer the existing Profile V2 / onboarding vocabulary over inventing parallel fields.
- Private by default; public only when actively discoverable.
- No matching, messaging, notifications, Voice, Video, Spotify, or Stripe in this foundation.

---

## What another authenticated Forge user may see

Other users must **not** query `profiles` with `select *`. Peer reads go through `discoverable_profiles` (and `discoverable_profile_photos` for photo metadata).

### Allowed (intentional public profile presentation)

| Field | Source |
|-------|--------|
| User id | `discoverable_profiles.id` |
| Display name | `full_name` |
| Public age | `age` (not date of birth) |
| City / region text | `location` |
| Relationship goal | `relationship_goal` |
| Faith | `faith_importance` |
| Service background | `service_background` |
| About | `short_bio` |
| More About | `more_about` |
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
| Private compatibility / questionnaire answers | `compatibility_answers` and `profile_answers` are owner-only |
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
| About | `profiles.short_bio` | V1 name retained |
| Faith | `profiles.faith_importance` | V1 name retained |
| Relationship goal | `profiles.relationship_goal` | Shared |
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

The `profile-photos` bucket remains **public** for this persistence PR so existing upload/preview URLs keep working. A future PR may move to private + signed URLs once the full retrieval flow is tested.

---

## Tables (summary)

See migration SQL for full DDL. High level:

1. **`profiles`** — owner full row; peers use `discoverable_profiles`
2. **`profile_private_details`** — DOB, postal, coords; owner-only
3. **`profile_preferences`** — owner-only discovery prefs
4. **`profile_answers`** — future questionnaire authority; owner-only
5. **`profile_photos`** — owner metadata; peers use `discoverable_profile_photos`
6. **`user_app_state`** — onboarding flags; owner-only
7. **`saved_profiles` / `passed_profiles`** — private actor-only
8. **`interests` / `open_to_chat_requests`** — participants read; restricted writes
9. **`connections`** — participants select; no client writes
10. **`user_blocks`** — blocker-only
11. **`character_signals`** — positive-only; giver create; receiver approve/decline

Untouched: `compatibility_answers`, `waitlist`, `feedback`.

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

**Decision: keep the existing `profile-photos` bucket PUBLIC for this PR.**

Why: the live Profile edit/preview flow uploads with `getPublicUrl()` (`app/profile/edit/ProfileForm.tsx`, `components/ProfilePreviewCard.tsx`). Making the bucket private now would break current photos, previews, and uploads.

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
