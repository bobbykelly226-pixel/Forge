# Forge Supabase

Version-controlled database schema for the Forge application.

## Layout

```
supabase/
  migrations/   # Ordered SQL migrations
  README.md
```

## Storage notes

The `profile-photos` bucket is **private**. Owners receive short-lived signed previews, while Discovery can read only moderator-approved photos for profiles the current member is eligible to discover. New and replaced photos default to `pending` moderation.

## Applying migrations

Migrations are applied manually in the linked Supabase project until CI/CD is wired.

1. Open the Supabase Dashboard → SQL Editor for the Forge project.
2. Apply each file in `migrations/` in filename order if it has not already been applied.
3. Prefer running new migrations only (files not yet applied), not re-running historical ones blindly.
4. After applying, regenerate TypeScript types:

```bash
npm run supabase:types
```

`supabase:types` requires the Supabase CLI and a linked project (`npx supabase link`). It does not hardcode a project ID.

Until types are regenerated from an applied schema, `lib/supabase/database.types.ts` is a **temporary schema-aligned hand-authored file**, not CLI output.

## Founding Beta signup invitations

New account creation is restricted by the Supabase Auth `before-user-created`
hook. The invited email must be added in normalized lowercase form before the
person signs up:

```sql
insert into public.beta_signup_invitations (email, expires_at, note)
values (
  lower(btrim('person@example.com')),
  now() + interval '14 days',
  'Founding Beta invitation'
);
```

Each invitation is single-use. To revoke an unused invitation:

```sql
update public.beta_signup_invitations
set revoked_at = now()
where email = lower(btrim('person@example.com'))
  and accepted_at is null;
```

After applying the migration, confirm **Authentication → Hooks → Before User
Created** points to
`public.hook_enforce_beta_signup_invitation`. The checked-in `config.toml`
enables the same hook for local Supabase.

Production rollout order:

1. Apply `20260814141901_invitation_only_signup.sql`.
2. Add at least one test invitation using the SQL above.
3. Enable the **Before User Created** hook in the Supabase dashboard.
4. Deploy the application changes and verify invited, uninvited, expired, and
   replayed signup attempts.

Do not enable the remote Auth hook before the migration is applied. Existing
accounts are unaffected because this hook runs only when Auth creates a new
user.

## Existing tables outside this app model

`waitlist` and `feedback` exist in the remote project for marketing flows. Do not modify or remove them in Forge application migrations.

## Legacy notes

Early migrations (`20260708*`, `20260709*`) established V1 `profiles`, `profile-photos` storage, and `compatibility_answers`. The Forge Backend Foundation migration evolves this into the production data model while preserving those tables and existing V1 app writes.

## Applied status

Foundation migration `20260714000000_forge_backend_foundation` has been applied to the linked Forge project via `supabase migration up --linked` and is recorded in remote migration history.
