-- Notify a member when another member sends them an Open to Chat request.
-- This is intentionally separate from open_to_chat_accepted, which notifies
-- the original sender only after the recipient accepts.

alter type public.notification_type
  add value if not exists 'open_to_chat_received';
