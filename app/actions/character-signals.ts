'use server';

import { revalidatePath } from 'next/cache';

import {
  getSignalDefinition,
  isCharacterSignalId,
  isInteractionType,
} from '@/lib/character-signals/catalog';
import type { CharacterSignalActionResult } from '@/lib/character-signals/types';
import { createClient } from '@/lib/supabase/server';

async function signedInClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function rpcMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

function rpcSucceeded(data: unknown): boolean {
  return Boolean(data && typeof data === 'object' && (data as { ok?: unknown }).ok === true);
}

export async function giveCharacterSignalAction(input: {
  receiverId: string;
  signalId: string;
  interactionType: string;
}): Promise<CharacterSignalActionResult> {
  if (!isCharacterSignalId(input.signalId) || !isInteractionType(input.interactionType)) {
    return { success: false, message: 'Choose a valid positive quality and interaction type.' };
  }
  if (!getSignalDefinition(input.signalId).interactionTypes.includes(input.interactionType)) {
    return { success: false, message: 'That quality does not match the interaction type.' };
  }
  const { supabase, user } = await signedInClient();
  if (!user) return { success: false, message: 'Your session expired. Sign in and try again.' };
  const { data, error } = await supabase.rpc('give_character_signal', {
    p_receiver_id: input.receiverId,
    p_signal_key: input.signalId,
    p_interaction_type: input.interactionType,
  });
  if (error) {
    console.error('Character Signal could not be created.', { code: error.code, message: error.message });
    return { success: false, message: 'Could not save this recognition. Please try again.' };
  }
  if (!rpcSucceeded(data)) {
    return { success: false, message: rpcMessage(data, 'This recognition is not available.') };
  }
  revalidatePath('/character-signals');
  revalidatePath('/profile');
  revalidatePath('/discovery/profile/[profileId]', 'page');
  return { success: true, message: 'Recognition submitted privately.' };
}

export async function respondToCharacterSignalAction(input: {
  signalId: string;
  visibility: 'public' | 'private' | 'decline';
}): Promise<CharacterSignalActionResult> {
  const { supabase, user } = await signedInClient();
  if (!user) return { success: false, message: 'Your session expired. Sign in and try again.' };
  const { data, error } = await supabase.rpc('respond_my_character_signal', {
    p_signal_id: input.signalId,
    p_visibility: input.visibility,
  });
  if (error) {
    console.error('Character Signal response failed.', { code: error.code, message: error.message });
    return { success: false, message: 'Could not save your choice. Please try again.' };
  }
  revalidatePath('/character-signals');
  revalidatePath('/profile');
  revalidatePath('/discovery/profile/[profileId]', 'page');
  return {
    success: rpcSucceeded(data),
    message: rpcMessage(data, 'Your Character Signal preference was saved.'),
  };
}

export async function setCharacterSignalVisibilityAction(input: {
  signalId: string;
  isPublic: boolean;
}): Promise<CharacterSignalActionResult> {
  if (!isCharacterSignalId(input.signalId)) {
    return { success: false, message: 'Choose a valid Character Signal.' };
  }
  const { supabase, user } = await signedInClient();
  if (!user) return { success: false, message: 'Your session expired. Sign in and try again.' };
  const { data, error } = await supabase.rpc('set_my_character_signal_visibility', {
    p_signal_key: input.signalId,
    p_is_public: input.isPublic,
  });
  if (error) {
    console.error('Character Signal visibility failed.', { code: error.code, message: error.message });
    return { success: false, message: 'Could not save your visibility choice. Please try again.' };
  }
  revalidatePath('/character-signals');
  revalidatePath('/profile');
  revalidatePath('/discovery/profile/[profileId]', 'page');
  return {
    success: rpcSucceeded(data),
    message: rpcMessage(data, 'Your Character Signal preference was saved.'),
  };
}
