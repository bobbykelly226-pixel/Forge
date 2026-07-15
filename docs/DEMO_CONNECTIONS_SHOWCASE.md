# Demo Connections Showcase

Private demonstration experience so Forge Connections and compatibility language can be shown even when a real account has zero live connections.

Status: Draft preview feature (local fixtures only)  
Route: `/internal/demo-connections`

---

## Purpose

Bobby can walk through realistic sample connections that demonstrate:

- Multiple connections
- Compatibility Index
- Relationship Alignment categories
- Confidence levels
- Shared alignment strengths
- Important Alignment Factors
- Potential dealbreakers (factor-focused language)
- Incomplete-information behavior
- Character Signals
- Compatibility breakdowns
- Conversation topics

This is not a disconnected mockup. It reuses Forge app chrome, typography, card shells, Soft Slate canvas, and Connections-adjacent layout patterns.

---

## Route

| Surface | Path |
|---------|------|
| Demo hub | `/internal/demo-connections` |
| Compatibility detail | `/internal/demo-connections/[id]` |

The route does **not** appear in public marketing navigation.

---

## Preview-only behavior

Access is controlled by `lib/demo/demo-access.ts`:

| Environment | Allowed? |
|-------------|----------|
| Local development (`NODE_ENV=development`) | Yes |
| Vercel preview (`VERCEL_ENV=preview`) | Yes |
| Production | Only if `ENABLE_INTERNAL_DEMOS=true` |

Suggested optional flag:

```bash
ENABLE_INTERNAL_DEMOS=true
```

Bobby does **not** need to set the flag for normal Vercel preview testing when `VERCEL_ENV` is already `preview`.

Authenticated session is required (same pattern as `/connections`). Unauthenticated visitors are redirected to login with `redirectTo` preserved. `/internal` is included in `proxy.ts` protected routes.

---

## Production protection

In production without `ENABLE_INTERNAL_DEMOS=true`, the demo pages call `notFound()`.

The quiet Connections empty-state shortcut is also gated and will not render in production.

---

## Empty Connections shortcut

On the real `/connections` page, when the viewer has **zero mutual connections**:

- In local development or Vercel preview only, a quiet supporting link appears under the Mutual empty state:
  - **Preview Demo Connections** → `/internal/demo-connections`
- The normal empty state copy is preserved
- Real Connections behavior is otherwise unchanged

---

## Fixture architecture

Central file:

`lib/demo/demo-connections.ts`

Access helpers:

`lib/demo/demo-access.ts`

Fixtures are typed (`DemoConnection`, `DemoAlignmentFactor`, etc.) and map closely to live hub presentation fields (`HubProfileCard` adapter via `toDemoHubProfileCard`).

Do not scatter sample data through components.

---

## Sample profiles

| Id | Name | Alignment | Index | Confidence |
|----|------|-----------|-------|------------|
| `demo-jessica` | Jessica, 38 | Strong Alignment | 94 | High |
| `demo-megan` | Megan, 36 | Promising Alignment | 83 | High |
| `demo-lauren` | Lauren, 41 | More to Discover | 68 | Moderate |
| `demo-natalie` | Natalie, 39 | More to Discover | 52 | High |
| `demo-emily` | Emily, 37 | Not Enough Information | Not yet available | Low |

All profiles are marked `isDemo: true` internally and show a restrained **Demo Connection** badge in UI.

---

## Compatibility examples

- Strong / Promising / More to Discover examples show a numeric Compatibility Index beside alignment category, confidence, and written reasoning.
- Not Enough Information withholds a numeric score and explains why.
- Breakdown rows either show category scores or incomplete/unavailable states.

The index is informational guidance — not arcade scoring, not green/red judgment of a person.

---

## Important Alignment Factor language

Forge must not label a human being as a “red flag.”

Official product language:

- **Important Alignment Factors**
- For serious conflicts: **Potential dealbreaker**, **Important difference**, **Preference conflict**, **Worth discussing before moving forward**

The factor is the concern, not the person.

Severity visuals (restrained):

| Severity | Treatment |
|----------|-----------|
| Informational | Muted slate / navy |
| Worth discussing | Warm neutral / restrained amber |
| Potential dealbreaker | Restrained Forge red accent (not a fully red card) |

---

## Why fake live users were not created

Creating fake auth users, connection rows, notifications, or messages would:

- Pollute Bobby’s real account and Discovery
- Risk production data integrity
- Trigger real relationship actions

This showcase uses deterministic local fixtures only. No database migration is required or permitted.

---

## How to add or change demo profiles later

1. Edit `DEMO_CONNECTIONS` in `lib/demo/demo-connections.ts`
2. Keep `isDemo: true` and a stable `demo-*` id
3. Prefer existing Character Signal titles used in product language
4. For Not Enough Information cases, set `compatibilityIndex: null` and incomplete breakdown rows
5. Update tests in `lib/__tests__/demo-connections-showcase.test.ts`
6. Optional: add a local portrait under `public/` and set `photoUrl` (architecture already supports it)

---

## How to remove the showcase before launch

1. Delete `app/internal/demo-connections/`
2. Delete `components/demo/`
3. Delete `lib/demo/`
4. Delete `docs/DEMO_CONNECTIONS_SHOWCASE.md` and related tests
5. Remove `showDemoShortcut` plumbing from `app/connections/page.tsx` and `ConnectionsHubPrototype.tsx`
6. Remove `/internal` from the protected-route list in `proxy.ts` if no other internal routes remain

---

## Read-only guarantee

Demo cards may only:

- View Compatibility
- View demo detail / navigate back

They must not send messages, create connections, block users, trigger Open to Chat, mark Interested, or modify Supabase.
