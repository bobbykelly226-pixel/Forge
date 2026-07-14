'use server';

import { loadConnectionsHub } from '@/lib/data/connections-hub';
import {
  getOpenToChatEducationSeen,
  markOpenToChatEducationSeen,
  passOnProfile,
  removeSavedProfile,
  respondOpenToChat,
  saveProfileForLater,
  sendInterest,
  sendOpenToChat,
  withdrawInterest,
} from '@/lib/data/relationships';

export async function saveForLaterAction(profileId: string) {
  return saveProfileForLater(profileId);
}

export async function removeSavedAction(profileId: string) {
  return removeSavedProfile(profileId);
}

export async function passOnProfileAction(profileId: string) {
  return passOnProfile(profileId);
}

export async function sendInterestAction(profileId: string) {
  return sendInterest(profileId);
}

export async function withdrawInterestAction(profileId: string) {
  return withdrawInterest(profileId);
}

export async function sendOpenToChatAction(profileId: string, note: string | null) {
  return sendOpenToChat(profileId, note);
}

export async function respondOpenToChatAction(
  requestId: string,
  action: 'accept' | 'defer' | 'decline'
) {
  return respondOpenToChat(requestId, action);
}

export async function markOpenToChatEducationSeenAction() {
  return markOpenToChatEducationSeen();
}

export async function getOpenToChatEducationSeenAction() {
  return getOpenToChatEducationSeen();
}

export async function loadConnectionsHubAction() {
  return loadConnectionsHub();
}
