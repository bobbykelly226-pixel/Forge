import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { formatNotificationTimestamp } from '@/lib/notifications/format';
import {
  buildNotificationBody,
  isSupportedNotificationType,
  resolveNotificationDestination,
} from '@/lib/notifications/resolve';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Notifications & Conversation Polish V1', () => {
  it('migration defines durable notifications table with RLS and dedupe', () => {
    const sql = read('supabase/migrations/20260720000000_notifications_v1.sql');
    assert.match(sql, /create table if not exists public\.notifications/);
    assert.match(sql, /recipient_user_id/);
    assert.match(sql, /actor_user_id/);
    assert.match(sql, /notification_type/);
    assert.match(sql, /destination_path/);
    assert.match(sql, /read_at/);
    assert.match(sql, /notifications_dedupe_uidx/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /forge_create_notification/);
    assert.match(sql, /revoke insert, update, delete on public\.notifications/);
    assert.match(sql, /list_my_notifications/);
    assert.match(sql, /mark_notification_read/);
    assert.match(sql, /mark_all_notifications_read/);
  });

  it('new-message notify goes to peer only; sender skipped by helper', () => {
    const sql = read('supabase/migrations/20260720000000_notifications_v1.sql');
    assert.match(sql, /send_conversation_message/);
    assert.match(sql, /'new_message'::public\.notification_type/);
    assert.match(
      sql,
      /if p_actor_user_id is not null and p_actor_user_id = p_recipient_user_id then\s*return null;/
    );
    // Peer is notified with message entity id
    assert.match(sql, /'message'::public\.notification_entity_type/);
    assert.match(sql, /v_message\.id/);
    assert.match(sql, /\/connections\/c\/' \|\| p_conversation_id::text/);
  });

  it('mutual connection notifies peer; interest_received only when not mutual', () => {
    const sql = read('supabase/migrations/20260720000000_notifications_v1.sql');
    assert.match(sql, /'mutual_connection'::public\.notification_type/);
    assert.match(sql, /'interest_received'::public\.notification_type/);
    assert.match(sql, /is interested in connecting\./);
    assert.match(sql, /are now connected\./);
    // Decline / defer explicitly do not notify
    assert.match(sql, /The sender was not notified\./);
  });

  it('Open to Chat accept notifies original sender only', () => {
    const sql = read('supabase/migrations/20260720000000_notifications_v1.sql');
    assert.match(sql, /'open_to_chat_accepted'::public\.notification_type/);
    assert.match(sql, /accepted your invitation to chat\./);
    assert.match(sql, /v_req\.sender_id/);
    assert.match(sql, /\/connections\?tab=mutual/);
  });

  it('does not create Character Signal or Not for Me notifications', () => {
    const sql = read('supabase/migrations/20260720000000_notifications_v1.sql');
    assert.doesNotMatch(sql, /character_signal/i);
    assert.doesNotMatch(sql, /not_for_me/i);
    assert.doesNotMatch(sql, /compatibility/i);
    assert.doesNotMatch(sql, /confidence/i);
    assert.ok(isSupportedNotificationType('new_message'));
    assert.equal(isSupportedNotificationType('character_signal'), false);
  });

  it('notification copy builders match product language', () => {
    assert.equal(buildNotificationBody('new_message', 'Lisa'), 'Lisa sent you a message.');
    assert.equal(
      buildNotificationBody('mutual_connection', 'Lisa'),
      'You and Lisa are now connected.'
    );
    assert.equal(
      buildNotificationBody('open_to_chat_accepted', 'Lisa'),
      'Lisa accepted your invitation to chat.'
    );
    assert.equal(
      buildNotificationBody('interest_received', 'Lisa'),
      'Lisa is interested in connecting.'
    );
  });

  it('resolves only verified destination paths', () => {
    assert.equal(
      resolveNotificationDestination('/connections/c/abc'),
      '/connections/c/abc'
    );
    assert.equal(
      resolveNotificationDestination('/connections?tab=mutual'),
      '/connections?tab=mutual'
    );
    assert.equal(
      resolveNotificationDestination('/discovery/profile/user-1'),
      '/discovery/profile/user-1'
    );
    assert.equal(resolveNotificationDestination('/notifications'), '/connections');
    assert.equal(resolveNotificationDestination('https://evil.example'), '/connections');
    assert.equal(resolveNotificationDestination('/connections/hack'), '/connections');
  });

  it('notification drawer opens from Bell and marks read', () => {
    const topBar = read('components/DiscoveryDesktopTopBar.tsx');
    const drawer = read('components/notifications/NotificationsDrawer.tsx');
    const provider = read('components/notifications/NotificationsProvider.tsx');

    assert.match(topBar, /openNotifications/);
    assert.doesNotMatch(topBar, /Prototype only/);
    assert.doesNotMatch(topBar, /onPrototypeAction/);
    assert.match(topBar, /href="\/connections\?tab=conversations"/);
    assert.match(topBar, /href="\/profile"/);
    assert.match(drawer, /Notifications/);
    assert.match(drawer, /Mark all as read/);
    assert.match(drawer, /No notifications yet/);
    assert.match(provider, /markNotificationReadAction/);
    assert.match(provider, /markAllNotificationsReadAction/);
    assert.match(provider, /listMyNotificationsAction/);
  });

  it('conversation unread remains on last_read_at; Messages badge uses real unread', () => {
    const migration = read('supabase/migrations/20260719000000_conversation_experience_v1.sql');
    const notifyMigration = read(
      'supabase/migrations/20260720000000_notifications_v1.sql'
    );
    const bottom = read('components/ForgeAppBottomNav.tsx');
    const desktop = read('components/ForgeDesktopAppNav.tsx');
    const hub = read('components/conversations/ConversationHub.tsx');

    assert.match(migration, /last_read_at/);
    assert.match(migration, /mark_conversation_read/);
    assert.doesNotMatch(notifyMigration, /create table.*conversation_participants/i);
    assert.match(bottom, /messagesUnread/);
    assert.match(desktop, /messagesUnread/);
    assert.match(hub, /item\.unread/);
    assert.match(hub, /latestMessageBody/);
    assert.match(hub, /\/connections\/c\/\$\{item\.conversationId\}/);
  });

  it('dead prototype controls are removed from authenticated utility bar hosts', () => {
    const hosts = [
      'components/DiscoveryFeedPrototype.tsx',
      'components/connections/ConnectionsHubPrototype.tsx',
      'components/profile/MyProfileHub.tsx',
      'components/profile/MyProfileHubPrototype.tsx',
      'components/character-signals/CharacterSignalsPrototype.tsx',
    ];
    for (const file of hosts) {
      const source = read(file);
      assert.doesNotMatch(source, /onPrototypeAction/, file);
      assert.doesNotMatch(source, /Prototype only —/, file);
      assert.match(source, /DiscoveryDesktopTopBar/, file);
    }
  });

  it('no placeholder notification language remains in connected controls', () => {
    const files = [
      'components/DiscoveryDesktopTopBar.tsx',
      'components/notifications/NotificationsDrawer.tsx',
      'components/notifications/NotificationsProvider.tsx',
      'components/ForgeAppBottomNav.tsx',
      'components/ForgeDesktopAppNav.tsx',
    ];
    for (const file of files) {
      const source = read(file);
      assert.doesNotMatch(source, /coming soon/i, file);
      assert.doesNotMatch(source, /Prototype only/i, file);
      assert.doesNotMatch(source, /not connected yet/i, file);
    }
  });

  it('relative timestamps stay calm and compact', () => {
    const now = Date.parse('2026-07-20T12:00:00.000Z');
    assert.equal(
      formatNotificationTimestamp('2026-07-20T11:59:30.000Z', now),
      'Just now'
    );
    assert.equal(
      formatNotificationTimestamp('2026-07-20T11:45:00.000Z', now),
      '15m ago'
    );
  });

  it('authenticated shells mount NotificationsProvider', () => {
    const pages = [
      'app/discovery/page.tsx',
      'app/connections/page.tsx',
      'app/profile/page.tsx',
      'app/character-signals/page.tsx',
      'app/connections/c/[conversationId]/page.tsx',
    ];
    for (const file of pages) {
      assert.match(read(file), /NotificationsProvider/, file);
    }
  });
});
