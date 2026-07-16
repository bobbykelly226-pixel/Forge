/**
 * Client-only simulated Discovery / Connections actions for seed profiles.
 * Simulation never writes to Supabase or production databases.
 */

import { isSeedProfileId } from '@/lib/seed/access';
import { getSeedDiscoveryProfiles, getSeedMutualConnectionProfiles } from '@/lib/seed/catalog';
import {
  createEmptyActionState,
  type DiscoveryProfileActionState,
} from '@/lib/discovery-actions-types';

export const SEED_DISCOVERY_ACTION_STORAGE_KEY = 'forge.seed.discovery.actionState.v1';
export const SEED_DISCOVERY_EDUCATION_STORAGE_KEY =
  'forge.seed.discovery.openToChatEducationSeen.v1';
export const SEED_CONNECTIONS_ACTION_STORAGE_KEY =
  'forge.seed.connections.actionState.v1';

/** Legacy keys — cleared on reset for migration cleanliness. */
const LEGACY_STORAGE_KEYS = [
  'forge.demo.discovery.actionState.v1',
  'forge.demo.discovery.openToChatEducationSeen.v1',
];

export function shouldSimulateDiscoveryAction(profileId: string): boolean {
  return isSeedProfileId(profileId);
}

export function createResetSeedDiscoveryActionState(): Record<
  string,
  DiscoveryProfileActionState
> {
  return Object.fromEntries(
    getSeedDiscoveryProfiles().map((profile) => [
      profile.id,
      createEmptyActionState(),
    ])
  );
}

/** @deprecated */
export function createResetSampleDiscoveryActionState() {
  return createResetSeedDiscoveryActionState();
}

export function mergeResetSeedDiscoveryActions(
  current: Record<string, DiscoveryProfileActionState>
): Record<string, DiscoveryProfileActionState> {
  const next = { ...current };
  const reset = createResetSeedDiscoveryActionState();
  for (const [id, state] of Object.entries(reset)) {
    next[id] = state;
  }
  for (const id of Object.keys(next)) {
    if (isSeedProfileId(id) && !(id in reset)) {
      delete next[id];
    }
  }
  return next;
}

/** @deprecated */
export function mergeResetSampleDiscoveryActions(
  current: Record<string, DiscoveryProfileActionState>
) {
  return mergeResetSeedDiscoveryActions(current);
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

export function readSeedDiscoveryActionStateFromSession(): Record<
  string,
  DiscoveryProfileActionState
> {
  const storage = getSessionStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(SEED_DISCOVERY_ACTION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, DiscoveryProfileActionState> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!isSeedProfileId(id) || !isActionState(value)) continue;
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

/** @deprecated */
export function readSampleDiscoveryActionStateFromSession() {
  return readSeedDiscoveryActionStateFromSession();
}

export function writeSeedDiscoveryActionStateToSession(
  byProfileId: Record<string, DiscoveryProfileActionState>
): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    const seedOnly: Record<string, DiscoveryProfileActionState> = {};
    for (const [id, state] of Object.entries(byProfileId)) {
      if (isSeedProfileId(id)) {
        seedOnly[id] = state;
      }
    }
    storage.setItem(SEED_DISCOVERY_ACTION_STORAGE_KEY, JSON.stringify(seedOnly));
  } catch {
    // Ignore quota / private-mode failures
  }
}

/** @deprecated */
export function writeSampleDiscoveryActionStateToSession(
  byProfileId: Record<string, DiscoveryProfileActionState>
) {
  writeSeedDiscoveryActionStateToSession(byProfileId);
}

export function clearSeedDiscoveryActionStateSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(SEED_DISCOVERY_ACTION_STORAGE_KEY);
    storage.removeItem(SEED_CONNECTIONS_ACTION_STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) {
      storage.removeItem(key);
    }
  } catch {
    // no-op
  }
}

/** @deprecated */
export function clearSampleDiscoveryActionStateSession() {
  clearSeedDiscoveryActionStateSession();
}

export function readSeedDiscoveryEducationSeenFromSession(): boolean | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SEED_DISCOVERY_EDUCATION_STORAGE_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return null;
  } catch {
    return null;
  }
}

/** @deprecated */
export function readSampleDiscoveryEducationSeenFromSession() {
  return readSeedDiscoveryEducationSeenFromSession();
}

export function writeSeedDiscoveryEducationSeenToSession(seen: boolean): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(SEED_DISCOVERY_EDUCATION_STORAGE_KEY, seen ? '1' : '0');
  } catch {
    // no-op
  }
}

/** @deprecated */
export function writeSampleDiscoveryEducationSeenToSession(seen: boolean) {
  writeSeedDiscoveryEducationSeenToSession(seen);
}

export function clearSeedDiscoveryEducationSeenSession(): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(SEED_DISCOVERY_EDUCATION_STORAGE_KEY);
  } catch {
    // no-op
  }
}

/** @deprecated */
export function clearSampleDiscoveryEducationSeenSession() {
  clearSeedDiscoveryEducationSeenSession();
}

/** Full developer reset of all seed simulation state. */
export function resetAllSeedState(): void {
  clearSeedDiscoveryActionStateSession();
  clearSeedDiscoveryEducationSeenSession();
}

export function listSeedMutualConnectionIds(): string[] {
  return getSeedMutualConnectionProfiles().map((profile) => profile.id);
}
