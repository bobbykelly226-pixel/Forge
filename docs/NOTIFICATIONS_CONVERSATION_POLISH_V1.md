# Notifications & Conversation Polish V1 — Architecture

## 1. Proposed architecture

**In-app notifications** are a durable Postgres table + security-definer RPCs.  
**Conversation unread** stays on `conversation_participants.last_read_at` (no second system).  
**UI:** drawer/panel opened from the existing Bell (desktop + restrained mobile). No `/notifications` route.  
**Realtime:** not required for V1; refresh/re-fetch is source of truth.

```
Event RPCs (trusted)
  → forge_create_notification(...)  -- insert-only helper, ON CONFLICT DO NOTHING
  → notifications table

Client
  → list_my_notifications / mark_notification_read / mark_all_notifications_read
  → NotificationsDrawer (+ badge on Bell)
  → Messages nav badge from list_my_conversations.unread
```

### Notification types (V1)

| type | Recipient | Actor | Entity | Destination |
|---|---|---|---|---|
| `new_message` | peer | sender | `message` / message id | `/connections/c/{conversationId}` |
| `mutual_connection` | peer (non-actor) | actor | `connection` / connection id | `/discovery/profile/{actorId}` or `/connections?tab=mutual` |
| `open_to_chat_accepted` | OTC request sender | acceptor | `open_to_chat_request` / request id | `/connections?tab=mutual` |
| `interest_received` | interest recipient | sender | `interest` / interest id | `/connections` (For You / interest already visible) |

Excluded: Character Signals, Not for Me, compatibility/confidence, anonymous interest.

### Copy (stable `body` stored at insert)

- new_message: `{Actor} sent you a message.`
- mutual_connection: `You and {Actor} are now connected.`
- open_to_chat_accepted: `{Actor} accepted your invitation to chat.`
- interest_received: `{Actor} is interested in connecting.`

Actor first name resolved at insert from `profiles`.

---

## 2. Exact SQL migration

See: `supabase/migrations/20260720000000_notifications_v1.sql`

---

## 3. Event write paths modified

| Path | Change |
|---|---|
| `send_conversation_message` | After insert (non-duplicate), notify peer `new_message` |
| `send_interest` | If pending only → `interest_received` to recipient; if mutual → `mutual_connection` to peer only (not actor) |
| `respond_open_to_chat` (accept) | `open_to_chat_accepted` to original request sender; **no** extra `mutual_connection` (avoids duplicate) |

Unchanged: `mark_conversation_read`, `list_my_conversations`, client conversation unread model.

---

## 4. Duplicate-prevention strategy

Unique index:

`(recipient_user_id, notification_type, entity_type, entity_id)`

`forge_create_notification` uses `INSERT … ON CONFLICT DO NOTHING`.

- Messages: `entity_id = message.id` (one notification per message)
- Idempotent `client_message_id` retry returns early **before** notify
- Mutual vs interest: only one of `interest_received` / `mutual_connection` for a given send_interest call
- OTC accept: only `open_to_chat_accepted`, not also `mutual_connection`

---

## 5. Files expected to change

- `supabase/migrations/20260720000000_notifications_v1.sql` (new; not auto-applied)
- `lib/notifications/*` types, copy, resolve destination
- `lib/data/notifications.ts` + `app/actions/notifications.ts`
- Replace RPCs in migration (send_interest, respond_open_to_chat, send_conversation_message)
- `components/notifications/*` drawer + provider
- `components/DiscoveryDesktopTopBar.tsx` → real actions
- `components/ForgeAppBottomNav.tsx` / `ForgeDesktopAppNav.tsx` messages badge
- Host pages/prototypes wiring utility bar + indicators
- Tests under `lib/__tests__/`

---

## 6. Risks / edge cases

- Migration must be applied manually to production before notifications appear
- Until migration is applied, notification RPCs will fail — UI must show a calm error/empty, not crash messaging
- Actor name changes later won’t rewrite historical notification bodies (by design)
- Interest withdraw does not delete prior `interest_received` (acceptable V1)
- High message volume = one notification per message (no coalescing in V1)
- Seed/demo profiles won’t create DB notifications
