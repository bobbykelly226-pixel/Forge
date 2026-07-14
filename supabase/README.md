# Forge Supabase

Version-controlled database schema for the Forge application.

## Layout

```
supabase/
  migrations/   # Ordered SQL migrations
  README.md
```

## Storage notes

The `profile-photos` bucket remains **public** for V1 ProfileForm compatibility (`getPublicUrl`). Private-bucket migration is deferred until signed URLs are implemented in the profile-persistence PR.

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

## Existing tables outside this app model

`waitlist` and `feedback` exist in the remote project for marketing flows. Do not modify or remove them in Forge application migrations.

## Legacy notes

Early migrations (`20260708*`, `20260709*`) established V1 `profiles`, `profile-photos` storage, and `compatibility_answers`. The Forge Backend Foundation migration evolves this into the production data model while preserving those tables and existing V1 app writes.
