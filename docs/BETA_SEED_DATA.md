# Forge Beta Seed Data

Runtime-only profile fixtures for local development and Vercel preview so Discovery and Connections feel populated without writing to Supabase.

## Purpose

When a preview/local account has zero real Discovery candidates or Mutual connections, seed profiles are injected into the same production surfaces:

- Discovery feed (`app/discovery/page.tsx` → `DiscoveryFeedPrototype`)
- Connections Mutual tab (`app/connections/page.tsx` → `ConnectionsHubPrototype`)
- Public profile route (`/discovery/profile/[profileId]` → `DiscoveryProfileView`)

There is **no** separate showcase UI, Compatibility Index, or numeric ranking.

## Catalog

| Item | Count |
|------|-------|
| Total seed profiles | 40 |
| Women | 20 |
| Men | 20 |
| Mutual connections (subset) | 10 |

All profile ids use the `seed-` prefix. Portraits live under `/public/seed-portraits/`.

### Portrait coverage

| Set | Count | Photos |
|-----|-------|--------|
| All seed profiles | 40 | At least 1 primary portrait each |
| Featured gallery profiles | 12 | 3 photos each (primary + 2 lifestyle) |

Featured galleries (all 10 mutual connections plus 2 Discovery standouts): Amanda Cole, Nicole Hayes, Lauren Price, Jessica Rivera, Courtney Diaz, Michael Turner, Matthew Ruiz, Ryan Cooper, Nathan Brooks, Gregory Lane, Sarah Bennett, Danielle Brooks.

`photoFiles` in the catalog must only reference files that exist on disk.

## Query flags

| Query | Behavior |
|-------|----------|
| *(none)* | Auto-inject when access is allowed **and** real items are empty |
| `?seed=1` | Force a **seed-only** Discovery feed and Mutual Connections tab (replaces live candidates/mutuals); shows discreet **Reset Seed State** |
| `?seed=0` | Disable seed injection |
| `?demo=1` | Legacy alias for force inject (same as `?seed=1` for force; reset only with `seed=1`) |

Seed injection is a controlled preview dataset. It does **not** merge newly created real user profiles into Discovery or Mutual Connections.

Examples:

- `/discovery?seed=1`
- `/connections?seed=1`
- `/discovery?seed=0`

## Access / production safety

Controlled by `lib/seed/access.ts`:

| Environment | Seed injection allowed? |
|-------------|-------------------------|
| Local development (`NODE_ENV=development`) | Yes |
| Vercel preview (`VERCEL_ENV=preview`) | Yes |
| Explicit `ENABLE_BETA_SEED=true` or legacy `ENABLE_INTERNAL_DEMOS=true` | Yes |
| Ordinary production | **No** |

Production never receives seed data unless an explicit enable flag is set (and even then, prefer keeping production clean).

## Module map

| File | Role |
|------|------|
| `lib/seed/catalog.ts` | Unified 40-profile catalog |
| `lib/seed/adapters.ts` | Map catalog → Discovery / Connections presentation models |
| `lib/seed/inject-discovery.ts` | Replace Discovery feed with seed-only cards when injecting |
| `lib/seed/inject-connections.ts` | Replace Mutual tab with seed-only connections when injecting |
| `lib/seed/actions.ts` | Client-only action simulation + `resetAllSeedState` |
| `lib/seed/access.ts` | Env gating, id helpers, `parseSeedQueryParam` |

## Behavior notes

- Seed Discovery actions are simulated in the browser (sessionStorage). They never write to Supabase.
- When seeds are injected, Discovery shows only the 40 seed cards (live `list_eligible_discovery_profiles` results are not appended).
- When seeds are injected, Connections Mutual shows only the 10 seed mutuals (live mutual rows are not appended). Other Connections tabs still reflect real relationship records for the signed-in viewer.
- Mutual seed profiles quietly omit write actions on profile view; messaging copy stays production-like.
- The feed and hub look like real members — no banners labeling fixtures as sample/demo.
- `/internal/demo-connections` redirects to `/connections?seed=1` when access is allowed, otherwise `notFound()`.
- Without `?seed=1` / auto-inject, live Discovery can still show real users who opted into **Show Me in Discovery** (`is_discoverable=true`). Completion alone does not create Connections.

## Editing fixtures

1. Edit `SEED_PROFILES` in `lib/seed/catalog.ts`
2. Keep `seed-*` ids and set `isMutualConnection` for Connections mutuals
3. Add portraits under `public/seed-portraits/` (filenames referenced by `photoFiles`)
4. Keep qualitative Relationship Alignment only — no red-flag labels, no Compatibility Index / numeric scores
