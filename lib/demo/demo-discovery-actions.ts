/**
 * Helpers for preview-only simulated Discovery actions.
 * Simulation must activate only for demo-discovery-* ids and never write to Supabase.
 */

import { isDemoDiscoveryProfileId } from '@/lib/demo/demo-access';
import { getSampleDiscoveryProfiles } from '@/lib/demo/sample-discovery-profiles';
import {
  createEmptyActionState,
  type DiscoveryProfileActionState,
} from '@/lib/discovery-actions-types';

export const SAMPLE_DISCOVERY_ACTION_STORAGE_KEY =
  'forge.demo.discovery.actionState.v1';

export const SAMPLE_DISCOVERY_EDUCATION_STORAGE_KEY =
  'forge.demo.discovery.openToChatEducationSeen.v1';

export function shouldSimulateDiscoveryAction(profileId: string): boolean {
  return isDemoDiscoveryProfileId(profileId);
}

export function createResetSampleDiscoveryActionState(): Record<
  string,
  DiscoveryProfileActionState
> {
  return Object.fromEntries(
    getSampleDiscoveryProfiles().map((profile) => [
      profile.id,
      createEmptyActionState(),
    ])
  );
}

export function mergeResetSampleDiscoveryActions(
  current: Record<string, DiscoveryProfileActionState>
): Record<string, DiscoveryProfileActionState> {
  const next = { ...current };
  for (const profile of getSampleDiscoveryProfiles()) {
    next[profile.id] = createEmptyActionState();
  }
  // Drop any stale demo-discovery keys not in the fixture set
  for (const id of Object.keys(next)) {
    if (isDemoDiscoveryProfileId(id) && !(id in createResetSampleDiscoveryActionState())) {
      delete next[id];
    }
  }
  return next;
}

function isActionState(value: unknown): value is DiscoveryProfileActionState {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.interested === 'boolean' &&
    typeof record.openToChatSent === 'boolean' &&
    typeof record.saved === 'boolean' &&
    typeof record.passed === 'boolean'
  );
}

function getSessionStorage(): Storage | null {
  try {
    const storage =
      typeof globalThis !== 'undefined'
        ? (globalThis as { sessionStorage?: Storage }).sessionStorage
        : undefined;
    if (!storage) return null;
    return storage;
  } catch {
    return null;
  }
}

/** Read simulated sample Discovery action state from sessionStorage (browser only). */
export function readSampleDiscoveryActionStateFromSession(): Record<
  string,
  DiscoveryProfileActionState
> {
  const storage = getSessionStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(SAMPLE_DISCOVERY_ACTION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, DiscoveryProfileActionState> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!isDemoDiscoveryProfileId(id) || !isActionState(value)) continue;
      next[id] = {
        ...createEmptyActionState(),
        interested: value.interested,
        openToChatSent: value.openToChatSent,
        openToChatNote:
          typeof value.openToChatNote === 'string' || value.openToChatNote === null
            ? value.openToChatNote
            : null,
        saved: value.saved,
        passed: value.passed,
      };
    }
    return next;
  } catch {
    return {};
  }
}

/** Persist only demo-discovery-* action entries. Never writes to Supabase. */
export function writeSampleDiscoveryActionStateToSession(
  byProfileId: Record<string, DiscoveryProfileActionState>
): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    const demoOnly: Record<string, DiscoveryProfileActionState> = {};
    for (const [id, state] of Object.entries(byProfileId)) {
      if (isDemoDiscoveryProfileId(id)) {
        demoOnly[id] = state;
      }
    }
    storage.setItem(SAMPLE_DISCOVERY_ACTION_STORAGE_KEY, JSON.stringify(demoOnly));
  } catch {
    // Ignore quota / private-mode failures; in-memory state still works for the page.
  }
}

export function clearSampleDiscoveryActionStateSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(SAMPLE_DISCOVERY_ACTION_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function readSampleDiscoveryEducationSeenFromSession(): boolean | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAMPLE_DISCOVERY_EDUCATION_STORAGE_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  } catch {
    return null;
  }
}

export function writeSampleDiscoveryEducationSeenToSession(seen: boolean): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(SAMPLE_DISCOVERY_EDUCATION_STORAGE_KEY, seen ? '1' : '0');
  } catch {
    // no-op
  }
}

export function clearSampleDiscoveryEducationSeenSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(SAMPLE_DISCOVERY_EDUCATION_STORAGE_KEY);
  } catch {
    // no-op
  }
}
