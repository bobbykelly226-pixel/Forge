# Forge Data Model

Authoritative documentation for the Forge Backend Foundation persistence layer.

**Remote migration status:** Not applied from the agent environment. Apply `supabase/migrations/20260714000000_forge_backend_foundation.sql` in the linked Supabase SQL Editor before relying on these tables in production.

**Types status:** `lib/supabase/database.types.ts` contains **temporary schema-aligned types hand-authored from the migration SQL**. They were **not** generated from an applied Supabase database. After remote apply, replace them with `npm run supabase:types`.

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

## Compatibility answers transition plan

### Current app behavior (confirmed)

The live onboarding flow **still reads and writes** `compatibility_answers` via:

- `app/actions/compatibility.ts`
- `components/OnboardingShell.tsx`
- keys: `relationship_intention`, `core_values`

### Future authoritative system

**`profile_answers` is the future authoritative questionnaire store** (importance, non-negotiable, visibility, matching-ready jsonb).

### Rules for the next persistence PR

1. **Do not dual-write** the same question into both tables.
2. Keep `compatibility_answers` data intact — no deletes in this foundation migration.
3. During the persistence PR that connects onboarding:
   - Migrate existing `compatibility_answers` rows into `profile_answers` once (same `question_key`, map `answer_value` → `answer`).
   - Switch app reads/writes to `profile_answers` only.
   - Leave `compatibility_answers` read-only or unused until a later cleanup migration.
4. Until that PR lands, foundation data-access helpers use `profile_answers` only for new questionnaire APIs; they do not touch `compatibility_answers`.

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

- Wiring UI to Supabase
- Matching, messaging, notifications
- Private photo bucket + signed URLs
- Voice / Video / Spotify / Stripe
- Dual-write elimination (see transition plan above)

---

## Data access layer

`lib/data/` — authenticated user only; calls `ensureFoundationalRecords` first:

- `ensureFoundationalRecords`
- `getCurrentUserProfile` / PrivateDetails / Preferences / ProfileAnswers / ProfilePhotos / AppState
- `upsertCurrentUserProfile` (editable columns only)
- `updateOnboardingProgress` / `hasCompletedOnboarding`
