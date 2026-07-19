# Conversation Experience V1 — Architecture Decision Record

**Branch:** `cursor/conversation-experience-v1-c660`  
**Status:** Approved for implementation after repo audit  
**Date:** 2026-07-19

---

## 1. Audit summary (confirmed existing architecture)

### Connections Hub

| Area | Confirmed |
|------|-----------|
| Route | `/connections` (`app/connections/page.tsx`) |
| Shell | `ConnectionsHubProvider` + `ConnectionsHubPrototype` + tabbed UI |
| Tabs | `forYou`, `openToChat`, `mutual`, `saved`, `sent` |
| Data loader | `lib/data/connections-hub.ts` → `loadConnectionsHub()` |
| Cards | `components/connections/ConnectionCards.tsx` |
| Auth | `proxy.ts` protects `/connections*`; page also redirects unauthenticated users |

### Relationship actions (live)

| Action | Persistence |
|--------|-------------|
| Interested | RPC `send_interest` → may create `connections` via `forge_ensure_connection` |
| Open to Chat | RPC `send_open_to_chat` / `respond_open_to_chat` |
| Save / Pass | RPCs `save_profile_for_later`, `remove_saved_profile`, `pass_on_profile` |
| Mutual surfaces | Active rows in `connections` loaded into Mutual tab |

### Messaging (Conversation Experience V1 — integrated)

| Item | Status |
|------|--------|
| `messages` / `conversations` tables | Migration `20260719000000_conversation_experience_v1.sql` |
| Chat routes | `/connections?tab=conversations`, `/connections/c/[conversationId]` |
| `startMutualConversation` | Calls `ensure_conversation_for_connection`, opens thread |
| Bottom + desktop nav Messages | `/connections?tab=conversations` |
| End / block / report | Conversation safety menu + RPCs |
| One conversation per connection | Unique constraint + ensure RPC reuse |

### Reuse (do not duplicate)

- `connections` as the mutual-relationship authority
- `user_blocks` for blocking
- `discoverable_profiles` for peer presentation
- Compatibility Engine presentation (`toAlignmentPresentation`, Important Alignment Factors attribution)
- Seed conventions (`lib/seed/*`, `?seed=1`, never write Supabase)
- Drawer / confirmation patterns from Connections and Discovery
- Server action → `lib/data/*` → security-definer RPC pattern

### Seed conventions

- Allowed in development, Vercel preview, or `ENABLE_BETA_SEED=true`
- Force with `?seed=1` / `?demo=1`; disable with `?seed=0`
- Client-only injection; sessionStorage for simulated Discovery actions
- Seed profile ids: `seed-*`

---

## 2. Confirmed routes (V1)

| Route | Purpose |
|-------|---------|
| `/connections` | Connections Hub; new **Messages** tab (`?tab=conversations`) hosts Conversation Hub list |
| `/connections/c/[conversationId]` | Dedicated conversation thread |
| Bottom nav **Messages** | Points to `/connections?tab=conversations` (replaces `#messages` placeholder) |

**Rationale:** Hub stays inside the existing Connections experience (tabs, canvas, auth). Threads need a dedicated deep-linkable route; nesting under `/connections/c/…` reuses auth gating without inventing a parallel `/messages` app surface.

Legacy: `/internal/demo-connections` remains a redirect to `/connections?seed=1`.

---

## 3. Proposed schema (new)

Normalized model attached to existing `connections`:

### Enums

- `conversation_status`: `active` | `ended`
- `report_reason`: `unwanted_behavior` | `harassment` | `fake_profile` | `inappropriate_content` | `safety_concern` | `other`

### Tables

1. **`conversations`**
   - `id`, `connection_id` (unique FK → `connections`), `status`, `created_at`, `updated_at`, `last_message_at`
   - One conversation per connection

2. **`conversation_participants`**
   - `(conversation_id, user_id)` PK
   - `last_read_at`, `created_at`
   - Relational membership (no participant arrays)

3. **`messages`**
   - `id`, `conversation_id`, `sender_id`, `body` (1–2000 chars), `client_message_id` (optional dedupe), `created_at`
   - Unique `(conversation_id, client_message_id)` where `client_message_id` is not null

4. **`user_reports`**
   - `id`, `reporter_id`, `reported_user_id`, optional `conversation_id`, `reason`, `details`, `created_at`
   - Reporter-only select/insert via RLS; no client update/delete

### Indexes

- Participants by `user_id`
- Conversations by `last_message_at desc`
- Messages by `(conversation_id, created_at desc)`
- Unread helpers via `last_read_at` vs `last_message_at`

### RPCs (security definer, trusted writes)

| RPC | Behavior |
|-----|----------|
| `ensure_conversation_for_connection` | Participant-only; create conversation + both participants if missing; requires active connection and not blocked |
| `send_conversation_message` | Participant-only; sender must be `auth.uid()`; rejects ended/blocked; updates `last_message_at` |
| `list_my_conversations` | Participant rows with peer preview fields + latest message preview + unread flag |
| `list_conversation_messages` | Cursor pagination (`before` timestamptz / id), participant-only |
| `mark_conversation_read` | Updates caller’s `last_read_at` |
| `end_connection` | Sets `connections.status = ended` and `conversations.status = ended` |
| `block_user` | Inserts `user_blocks` + ends connection/conversation |
| `report_user` | Inserts `user_reports` (does not auto-block) |

Reuse existing `forge_users_blocked`, `forge_order_pair`, `forge.allow_system_writes` patterns.

### RLS (minimum)

- Participants select own conversations / messages / membership rows
- Message insert only via RPC (or tightly constrained insert with `sender_id = auth.uid()` + active participant checks)
- Non-participants cannot join conversations
- Blocked / ended relationships cannot send messages (enforced in RPC)
- Clients never receive service-role credentials

---

## 4. Product behavior

### Mutualization → conversation

1. Mutual interest or accepted Open to Chat already creates `connections`.
2. “Start a conversation” calls `ensure_conversation_for_connection` then navigates to `/connections/c/{id}`.
3. Restrained acknowledgment copy uses real first name + grounded alignment summary from Compatibility Engine (never invent “Strong Alignment”).

### Safety semantics

| Action | Effect |
|--------|--------|
| **End connection** | Soft-end; both lose messaging; profiles remain otherwise; conversation history retained but read-only / closed |
| **Block** | Ends connection + inserts `user_blocks`; Discovery/relationship RPCs already respect blocks; messaging denied |
| **Report** | Stores report for review; does **not** auto-block (user may block separately) |

### Realtime (V1 decision)

**Deferred.** Thread uses optimistic send + revalidation / manual refresh. Do not claim live delivery. Realtime subscriptions are a V2 candidate once the data model is proven.

### Seed / QA

Client-only seed conversations when seed access is allowed and Mutual seed injection is active (or `?seed=1`). States: empty mutual, active thread, unread, alignment context, insufficient context, ended, blocked (UI), failed-send simulation. Never written to Supabase.

---

## 5. Areas requiring founder awareness (not blockers)

1. **Messages tab placement** — Inside Connections (chosen) vs a separate top-level Messages app. Bottom nav Messages deep-links into Connections Messages tab.
2. **History retention after end/block** — V1 retains rows but closes messaging (soft-end). Hard delete deferred.
3. **Report handling workflow** — V1 persists reports only; no admin console in this slice.
4. **Realtime** — Explicitly deferred; refresh/optimistic UX only.

---

## 6. Implementation commit plan

1. Audit ADR (this document)
2. Schema / migrations / types / RLS
3. Server / data layer + server actions
4. Conversation Hub UI (Connections Messages tab)
5. Conversation thread
6. Compatibility context + starters
7. Safety controls
8. Seed / demo support
9. Testing, accessibility, polish

---

## 7. Explicit non-goals (V2)

- Supabase Realtime live delivery
- Read receipts / typing indicators
- Group chats / media attachments
- Push notifications
- Admin moderation console
- Compatibility percentage or Confidence metrics
- Gamification, streaks, artificial urgency
