# Forge Data Model

Authoritative documentation for the Forge Backend Foundation persistence layer.

**Remote migration status:** Not applied from the agent environment. Apply `supabase/migrations/20260714000000_forge_backend_foundation.sql` in the linked Supabase SQL Editor before relying on these tables in production.

**Types status:** `lib/supabase/database.types.ts` is schema-aligned to the migration SQL. After remote apply, refresh with `npm run supabase:types`.

---

## Design principles

- Every concept helps users understand and respectfully connect with another person.
- Prefer the existing Profile V2 / onboarding vocabulary over inventing parallel fields.
- Private by default; public only when actively discoverable.
- No matching, messaging, notifications, Voice, Video, Spotify, or Stripe in this foundation.

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

`compatibility_answers` remains for the live onboarding flow (`relationship_intention`, `core_values`). New questionnaire work should prefer `profile_answers`; a later PR can migrate V1 rows.

`waitlist` and `feedback` are marketing tables and are intentionally untouched.

---

## Tables

### 1. `profiles`

**Purpose:** Public-facing profile presentation and lifecycle.

**Key columns:** identity (`id` → `auth.users`), presentation fields (name, location, about, details, enjoy/music arrays), `status`, `is_discoverable`, completion/activity timestamps.

**Public vs private:** Readable by the owner always. Other authenticated users may read only when `status = 'active'` AND `is_discoverable = true`. Anonymous users cannot browse.

**Not included:** Voice/Video introduction media columns.

### 2. `profile_private_details`

**Purpose:** Sensitive inputs that must never appear as ordinary public profile columns.

**Columns:** `date_of_birth`, `postal_code`, optional `latitude`/`longitude`.

**Access:** Owner-only select/insert/update. Exact DOB is never exposed through public profile queries.

### 3. `profile_preferences`

**Purpose:** Discovery and relationship preferences.

**Columns:** `gender_identity`, `interested_in[]`, age range, `max_distance_miles`, `discovery_enabled`, `open_to_chat_available`.

**Access:** Owner-only. Check constraints enforce age (18–120) and distance (1–500) ranges.

### 4. `profile_answers`

**Purpose:** Compatibility, values, lifestyle, and alignment answers without one column per question.

**Columns:** `question_key` (stable snake_case id), `answer` (jsonb), `importance_level` (1–5), `is_non_negotiable`, `visibility`.

**Constraint:** One current answer per `(user_id, question_key)`.

**Access:** Owner-only direct access. Future matching should use trusted server/SQL logic, not broad client reads of others’ answers.

### 5. `profile_photos`

**Purpose:** Ordered photo metadata. Binary files live in Storage.

**Columns:** `storage_path`, `display_order`, `is_primary`, `moderation_status`.

**Constraints:** Unique display order per user; at most one primary photo per user.

**Access:** Owners manage their rows. Authenticated users may read metadata for active+discoverable profiles.

### 6. `user_app_state`

**Purpose:** Small cross-device product flags — not a JSON dumping ground.

**Columns:** `onboarding_step`, `onboarding_completed`, `open_to_chat_education_seen`.

**Access:** Owner-only.

### 7. `saved_profiles`

**Purpose:** Private Save for Later.

**Rules:** Unique `(saver_id, saved_id)`; no self-save; only the saver can read/insert/delete. The saved person cannot see who saved them.

### 8. `passed_profiles`

**Purpose:** Private Not for Me.

**Rules:** Unique pair; no self-pass; only the passer can access. The passed person is never notified via this table.

### 9. `interests`

**Purpose:** Persist Interested actions for future mutual behavior.

**Rules:** No self-interest; unique sender→recipient; both participants may read; sender creates pending; sender may withdraw pending → `withdrawn`. Broader status transitions stay for trusted logic later.

### 10. `open_to_chat_requests`

**Purpose:** Open to Chat V2 requests with optional note (max 200 chars).

**Statuses:** `pending`, `accepted`, `declined`, `expired`.

**Rules:** No self-request; one row per sender→recipient; participants may read; sender may insert pending. No authenticated UPDATE policy — accept/decline/expire via trusted functions in a later PR. No read receipts, seen, or ignored status.

### 11. `connections`

**Purpose:** Real connection created by mutual interest or accepted Open to Chat.

**Rules:** Ordered pair (`user_a_id < user_b_id`); one connection per unordered pair; no self-connection; participants may SELECT only. No client insert/update/delete.

**Messaging later:** Threads should reference `connections.id` as the relationship anchor.

### 12. `user_blocks`

**Purpose:** Basic safety foundation for filtering.

**Rules:** Unique blocker→blocked; no self-block; only the blocker can manage/read. Not a full moderation system.

### 13. `character_signals`

**Purpose:** Positive-only Character Signals recognition records.

**Columns:** `giver_id`, `receiver_id`, `signal_key`, optional interaction type/context, `status` (`pending`/`approved`/`declined`), timestamps.

**Rules:** No self-signal; giver creates pending; receiver approves or declines; public profile display later shows only approved positives. No negative public reviews.

---

## Enums

| Enum | Values |
|------|--------|
| `profile_status` | `draft`, `active`, `paused`, `hidden`, `deactivated` |
| `answer_visibility` | `private`, `shared_with_matches`, `public_summary` |
| `photo_moderation_status` | `pending`, `approved`, `rejected` |
| `interest_status` | `pending`, `mutual`, `withdrawn` |
| `open_to_chat_status` | `pending`, `accepted`, `declined`, `expired` |
| `connection_source` | `mutual_interest`, `open_to_chat` |
| `connection_status` | `active`, `ended` |
| `character_signal_status` | `pending`, `approved`, `declined` |
| `character_signal_interaction` | `in_app`, `in_person` |

---

## Relationships and constraints (summary)

- All user FKs reference `auth.users(id)` with `ON DELETE CASCADE`.
- One-to-one owner tables: `profiles`, `profile_private_details`, `profile_preferences`, `user_app_state`.
- Unique relationship pairs prevent duplicate saves, passes, interests, Open to Chat requests, blocks, and connections.
- Self-actions blocked with CHECK constraints.
- Open to Chat note length ≤ 200.
- Preference age/distance ranges enforced in CHECK constraints.
- Reusable `set_updated_at()` trigger maintains `updated_at` on mutable tables.

---

## RLS policy summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Owner; peers if active+discoverable | Owner | Owner | — |
| `profile_private_details` | Owner | Owner | Owner | — |
| `profile_preferences` | Owner | Owner | Owner | — |
| `profile_answers` | Owner | Owner | Owner | Owner |
| `profile_photos` | Owner; peers if owner active+discoverable | Owner | Owner | Owner |
| `user_app_state` | Owner | Owner | Owner | — |
| `saved_profiles` | Saver only | Saver | — | Saver |
| `passed_profiles` | Passer only | Passer | — | Passer |
| `interests` | Sender or recipient | Sender (pending) | Sender withdraw only | — |
| `open_to_chat_requests` | Sender or recipient | Sender (pending) | — (trusted fn later) | — |
| `connections` | Participants | — | — | — |
| `user_blocks` | Blocker | Blocker | — | Blocker |
| `character_signals` | Giver or receiver | Giver (pending) | Receiver approve/decline | — |

Anonymous users cannot browse dating profiles or media.

---

## Storage

**Bucket:** `profile-photos` (private, 5MB, jpeg/png/webp/gif)

**Path convention:** `{user_id}/{photo_id-or-filename}`

**Policies:**

- Authenticated users upload/update/delete only inside their own folder.
- Owners can read their own files.
- Authenticated users may read files whose folder user has an active+discoverable profile.
- Anonymous users cannot enumerate or retrieve dating-profile media.
- Prefer signed URLs when wiring the UI (next persistence PR). Legacy `getPublicUrl` on the V1 profile form is unchanged in this PR and will need signed URLs after the private-bucket migration is applied.

---

## New-user trigger

`handle_new_user` runs `AFTER INSERT ON auth.users` (security definer) and inserts minimum rows into:

1. `profiles`
2. `profile_private_details`
3. `profile_preferences`
4. `user_app_state`

Behavior:

- Nullable fields remain null until onboarding supplies them.
- `is_discoverable` defaults to `false`.
- Errors are caught and logged as warnings so signup never fails.
- Existing auth users are backfilled idempotently by the migration.

---

## Onboarding answers

Today’s live onboarding still writes `compatibility_answers` with keys:

- `relationship_intention`
- `core_values`

Foundation path for new questionnaire data:

- Store under `profile_answers.question_key` (same stable keys).
- Put the value in `answer` jsonb.
- Optionally set `importance_level`, `is_non_negotiable`, and `visibility`.

`user_app_state` tracks step + completion; `profiles.onboarding_completed_at` is stamped when completion flips to true via the data-access helper.

---

## Profile completion

Source of truth: `lib/profile-completion.ts`

Counted sections:

1. Photos
2. About Me (`short_bio`)
3. Profile details (majority of lifestyle fields)
4. Relationship Alignment (answers present)
5. Important Alignment Factors (answers present)
6. Things I Enjoy
7. Favorite Music

**Excluded while Coming Soon:** Voice Introduction, Video Introduction — they must not reduce completion.

Percentage is computed in TypeScript from section completeness, not stored as a stale column.

---

## Future matching (`profile_answers`)

Matching should:

1. Read the current user’s preferences and private DOB/location as needed server-side.
2. Compare against candidates’ public profiles + answers via trusted functions/server code.
3. Respect `importance_level` / `is_non_negotiable` / visibility.
4. Never expose private answers or DOB to other clients.

This PR does not implement scoring.

---

## Future messaging (`connections`)

Messaging should attach to an `connections` row between two participants. Client code must not invent connections; creation belongs to trusted mutual-interest / Open to Chat acceptance logic.

---

## Intentionally deferred

- Matching / Relationship Alignment calculations
- Messaging and notifications
- Open to Chat accept/decline SQL functions
- Voice Introduction / Video Introduction
- Spotify
- Subscriptions / Stripe
- Full moderation beyond photo status + blocks
- Wiring Profile V2, onboarding, and discovery UI to these tables

---

## Data access layer

Server helpers in `lib/data/` (authenticated user only):

- `getCurrentUserProfile`
- `getCurrentUserPrivateDetails`
- `getCurrentUserPreferences`
- `getCurrentUserProfileAnswers`
- `getCurrentUserProfilePhotos`
- `upsertCurrentUserProfile`
- `updateOnboardingProgress`
- `hasCompletedOnboarding`
- `getCurrentUserAppState`

No service-role key. No arbitrary user id for “current user” operations.
