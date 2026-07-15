# Sample Connections (Preview Injection)

Private preview support so Bobby can demonstrate Forge Connections with realistic sample profiles inside the **real** Connections experience — without creating fake live users or writing to Supabase.

---

## Purpose

When a preview/local account has zero real Mutual connections, five sample connections are injected into the same `ConnectionsHubData` consumed by:

- `ConnectionsHubProvider`
- `ConnectionsHubPrototype`
- `MutualConnectionCard`
- `/discovery/profile/[profileId]` → `DiscoveryProfileView` → `PublicProfilePresentation`

Bobby can click through cards, open profiles, open Relationship Alignment and Important Alignment Factors drawers, and view Character Signals exactly as a real user would.

---

## Routes

| Surface | Behavior |
|---------|----------|
| `/connections` | Authoritative Connections UI. Samples inject in preview/local when mutuals are empty (or `?demo=1`). |
| `/discovery/profile/demo-*` | Resolves sample fixtures via adapter — no Supabase user query. |
| `/internal/demo-connections` | **Retired.** Redirects to `/connections?demo=1` (or `notFound()` in production). |

There is **no** separate showcase design, Compatibility Index, or custom demo Connections layout.

---

## Visibility rules

Controlled by `lib/demo/demo-access.ts` / `lib/demo/inject-sample-connections.ts`:

| Environment | Samples shown? |
|-------------|----------------|
| Local development | Yes (when zero real mutuals, or `?demo=1`) |
| Vercel preview | Yes (same) |
| Production | Only if `ENABLE_INTERNAL_DEMOS=true` |

Ordinary production shows only real Connections data.

---

## Fixture architecture

| File | Role |
|------|------|
| `lib/demo/sample-connections.ts` | Sample fixtures + adapters to hub cards / public profiles / alignment presentation |
| `lib/demo/inject-sample-connections.ts` | Merge samples into `ConnectionsHubData` |
| `lib/demo/demo-access.ts` | Env gating + `isDemoProfileId` |

Adapters map into production types (`HubProfileCard`, `MutualConnectionItem`, `PublicDiscoveryProfile`).

---

## Sample profile IDs

- `demo-jessica` — Strong Alignment
- `demo-megan` — Promising Alignment (relocation worth discussing)
- `demo-lauren` — More to Discover (faith / drinking / incomplete relocation)
- `demo-natalie` — More to Discover (potential dealbreaker: children; smoking conflict)
- `demo-emily` — Not Enough Information

Qualitative Relationship Alignment only. No Compatibility Index. No numeric scores or category gauges.

---

## Product language

Use **Important Alignment Factors**. Never label a person a red flag.

Serious conflicts may use: Potential dealbreaker, Important difference, Worth discussing.

---

## Banner + hide control

When samples are visible on Mutual:

> Sample connections are shown for product preview. No live member data is affected.

Quiet control: **Hide sample connections** (client-only). Refresh restores them.

---

## Why no fake live users

Injecting into the UI at runtime avoids polluting Auth, Discovery, connections, notifications, and messaging. No database migration is required or permitted.

---

## How to change samples later

1. Edit `SAMPLE_CONNECTIONS` in `lib/demo/sample-connections.ts`
2. Keep `demo-*` ids and `isDemo: true`
3. Keep structured field values from `lib/profile/structured-options.ts`
4. Update `lib/__tests__/demo-connections-showcase.test.ts`
5. Optional: set `photoUrl` / photos when local portraits are available

---

## How to remove before launch

1. Remove injection from `app/connections/page.tsx`
2. Remove demo branch from `fetchDiscoveryProfileAction`
3. Delete `lib/demo/`, retired internal redirect, and this doc
4. Optionally remove `/internal` from `proxy.ts` if unused
5. Remove sample banner / hide control props from `ConnectionsHubPrototype`
