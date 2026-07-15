# Sample Connections & Discovery (Preview Injection)

Private preview support so Bobby can demonstrate Forge with realistic sample profiles inside the **real** Connections and Discovery experiences — without creating fake live users or writing to Supabase.

---

## Purpose

### Connections

When a preview/local account has zero real Mutual connections, five sample connections are injected into the same `ConnectionsHubData` consumed by:

- `ConnectionsHubProvider`
- `ConnectionsHubPrototype`
- `MutualConnectionCard`
- `/discovery/profile/[profileId]` → `DiscoveryProfileView` → `PublicProfilePresentation`

### Discovery

When a preview/local account has zero real Discovery candidates (or `?demo=1`), seven sample profiles are injected into the same feed consumed by:

- `app/discovery/page.tsx`
- `DiscoveryFeedPrototype` → `DiscoveryFeedCard`
- `/discovery/profile/[profileId]` → `DiscoveryProfileView` → `PublicProfilePresentation`
- `DiscoveryActionTiles` + `DiscoveryActionsProvider` (simulated actions for `demo-discovery-*` only)

There is **no** separate showcase design, Compatibility Index, or custom demo Connections/Discovery layout.

---

## Routes

| Surface | Behavior |
|---------|----------|
| `/connections` | Authoritative Connections UI. Samples inject in preview/local when mutuals are empty (or `?demo=1`). |
| `/discovery` | Authoritative Discovery feed. Samples inject in preview/local when candidates are empty (or `?demo=1`). |
| `/discovery/profile/demo-discovery-*` | Resolves Discovery fixtures via adapter — no Supabase query. |
| `/discovery/profile/demo-*` | Resolves Connections mutual fixtures via adapter — no Supabase query. |
| `/internal/demo-connections` | **Retired.** Redirects to `/connections?demo=1` (or `notFound()` in production). |

---

## Visibility rules

Controlled by `lib/demo/demo-access.ts`:

| Environment | Samples shown? |
|-------------|----------------|
| Local development | Yes (when zero real items, or `?demo=1`) |
| Vercel preview | Yes (same) |
| Production | Only if `ENABLE_INTERNAL_DEMOS=true` |

Ordinary production shows only real Connections / Discovery data.

---

## Fixture architecture

| File | Role |
|------|------|
| `lib/demo/sample-connections.ts` | Connections mutual fixtures + adapters |
| `lib/demo/inject-sample-connections.ts` | Merge samples into `ConnectionsHubData` |
| `lib/demo/sample-discovery-profiles.ts` | Discovery feed/profile fixtures + adapters |
| `lib/demo/inject-sample-discovery.ts` | Merge samples into Discovery feed cards |
| `lib/demo/demo-discovery-actions.ts` | Simulation gating + sessionStorage helpers + reset |
| `lib/demo/demo-access.ts` | Env gating + id helpers |

Adapters map into production types (`HubProfileCard`, `MutualConnectionItem`, `DiscoveryFeedCardModel`, `PublicDiscoveryProfile`).

---

## Sample profile IDs

### Connections (Mutual)

- `demo-jessica` — Strong Alignment
- `demo-megan` — Promising Alignment (relocation worth discussing)
- `demo-lauren` — More to Discover (faith / drinking / incomplete relocation)
- `demo-natalie` — More to Discover (potential dealbreaker: children; smoking conflict)
- `demo-emily` — Not Enough Information

### Discovery feed

- `demo-discovery-amanda` — Strong Alignment
- `demo-discovery-sarah` — Promising Alignment
- `demo-discovery-nicole` — Promising Alignment
- `demo-discovery-rachel` — More to Discover
- `demo-discovery-danielle` — Strong Alignment
- `demo-discovery-monica` — More to Discover (potential dealbreaker: children/parenting)
- `demo-discovery-kristin` — Not Enough Information

Qualitative Relationship Alignment only. No Compatibility Index. No numeric scores or category gauges.

---

## Product language

Use **Important Alignment Factors**. Never label a person a red flag.

Serious conflicts may use: Potential dealbreaker, Important difference, Worth discussing.

---

## Banner + controls

### Connections (Mutual tab)

> Sample connections are shown for product preview. No live member data is affected.

Quiet control: **Hide sample connections** (client-only).

### Discovery feed

> Sample profiles are shown for product preview. Actions are simulated and reset on refresh.

Quiet controls:

- **Hide sample profiles**
- **Reset sample Discovery actions** — restores all seven fixtures and clears session simulation state

---

## Simulated Discovery actions

For `demo-discovery-*` ids only, `DiscoveryActionsProvider` simulates:

- Interested
- Open to Chat (including first-time education + confirmation; no request, notification, or daily-limit consumption)
- Save for Later
- Not for Me

State is kept in React state and mirrored to `sessionStorage` so feed ↔ profile navigation keeps the preview session. Refresh or **Reset sample Discovery actions** clears it.

Real Discovery candidates keep full Supabase-backed persistence. Simulation never activates for non-`demo-discovery-*` ids (including Connections `demo-*` mutuals).

---

## Why no fake live users

Injecting into the UI at runtime avoids polluting Auth, Discovery, connections, notifications, and messaging. No database migration is required or permitted.

---

## How to change samples later

### Connections

1. Edit `SAMPLE_CONNECTIONS` in `lib/demo/sample-connections.ts`
2. Keep `demo-*` ids and `isDemo: true`
3. Update `lib/__tests__/demo-connections-showcase.test.ts`

### Discovery

1. Edit `SAMPLE_DISCOVERY_PROFILES` in `lib/demo/sample-discovery-profiles.ts`
2. Keep `demo-discovery-*` ids
3. Optional: add portraits under `public/demo-portraits/`
4. Update `lib/__tests__/demo-discovery-showcase.test.ts`

---

## How to remove before launch

1. Remove injection from `app/connections/page.tsx` and `app/discovery/page.tsx`
2. Remove demo branches from `fetchDiscoveryProfileAction`
3. Delete `lib/demo/`, retired internal redirect, portrait placeholders, and this doc
4. Optionally remove `/internal` from `proxy.ts` if unused
5. Remove sample banner / hide / reset controls from Connections and Discovery UIs
