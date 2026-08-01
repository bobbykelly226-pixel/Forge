import 'server-only';

import {
  isCharacterSignalId,
  type CharacterSignalId,
} from '@/lib/character-signals/catalog';
import type {
  CharacterSignalsDashboard,
  PublicCharacterSignal,
  RecognitionHistoryEntry,
  RecognitionRecipient,
  UserSignalInstance,
} from '@/lib/character-signals/types';
import { createClient } from '@/lib/supabase/server';

const EMPTY_DASHBOARD: CharacterSignalsDashboard = {
  signals: [],
  history: [],
  recipients: [],
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function relativeTime(value: unknown): string {
  if (typeof value !== 'string') return 'Recently';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Recently';
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  if (days < 45) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function parseSignals(value: unknown): UserSignalInstance[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    if (!row || typeof row.id !== 'string' || !isCharacterSignalId(row.signalId)) return [];
    const status = row.status;
    if (!['public', 'hidden', 'pending', 'private', 'growing'].includes(String(status))) return [];
    return [{
      id: row.id,
      signalId: row.signalId,
      confirmationCount: typeof row.confirmationCount === 'number' ? row.confirmationCount : 0,
      status: status as UserSignalInstance['status'],
      recognizedBy: typeof row.recognizedBy === 'string' ? row.recognizedBy : undefined,
      canPublishAfterApproval: row.canPublishAfterApproval === true,
    }];
  });
}

function parseHistory(value: unknown): RecognitionHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    if (!row || typeof row.id !== 'string' || !isCharacterSignalId(row.signalId)) return [];
    if (row.kind !== 'received' && row.kind !== 'given') return [];
    return [{
      id: row.id,
      kind: row.kind,
      signalId: row.signalId,
      contextLabel: typeof row.contextLabel === 'string' ? row.contextLabel : 'Forge interaction',
      relativeTime: relativeTime(row.createdAt),
      recipientFirstName:
        typeof row.recipientFirstName === 'string' ? row.recipientFirstName : undefined,
    }];
  });
}

function parseRecipients(value: unknown): RecognitionRecipient[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    if (!row || typeof row.id !== 'string' || typeof row.firstName !== 'string') return [];
    return [{
      id: row.id,
      firstName: row.firstName,
      defaultInteractionType: row.defaultInteractionType === 'in_person' ? 'in_person' : 'in_app',
      contextLabel: typeof row.contextLabel === 'string'
        ? row.contextLabel
        : 'Two-way Forge conversation',
    }];
  });
}

export async function loadMyCharacterSignals(): Promise<CharacterSignalsDashboard> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return EMPTY_DASHBOARD;

  const { data, error } = await supabase.rpc('list_my_character_signals');
  if (error) {
    console.error('Could not load Character Signals.', { code: error.code, message: error.message });
    return EMPTY_DASHBOARD;
  }
  const payload = record(data);
  if (!payload || payload.ok !== true) return EMPTY_DASHBOARD;
  return {
    signals: parseSignals(payload.signals),
    history: parseHistory(payload.history),
    recipients: parseRecipients(payload.recipients),
  };
}

export async function loadPublicCharacterSignals(
  receiverIds: string[]
): Promise<Map<string, PublicCharacterSignal[]>> {
  const result = new Map<string, PublicCharacterSignal[]>();
  const ids = [...new Set(receiverIds)].slice(0, 50);
  if (ids.length === 0) return result;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return result;
  const { data, error } = await supabase.rpc('list_public_character_signals', {
    p_receiver_ids: ids,
  });
  if (error) {
    console.error('Could not load public Character Signals.', {
      code: error.code,
      message: error.message,
    });
    return result;
  }
  for (const row of data ?? []) {
    if (!isCharacterSignalId(row.signal_key)) continue;
    const entry: PublicCharacterSignal = {
      signalId: row.signal_key as CharacterSignalId,
      confirmationCount: Number(row.confirmation_count),
    };
    result.set(row.receiver_id, [...(result.get(row.receiver_id) ?? []), entry]);
  }
  return result;
}
