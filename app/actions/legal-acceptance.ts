'use server';

import {
  hasAllRequiredLegalAcknowledgements,
  isLegalDocumentKey,
  type LegalDocumentKey,
} from '@/lib/legal/documents';
import { createClient } from '@/lib/supabase/server';

export type AcceptLegalDocumentsResult = {
  success: boolean;
  message: string;
};

export async function acceptCurrentLegalDocument(
  documentKey: string
): Promise<AcceptLegalDocumentsResult> {
  if (!isLegalDocumentKey(documentKey)) {
    return { success: false, message: 'Forge could not identify this legal document.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Your session expired. Sign in and try again.' };
  }

  const { data, error } = await supabase.rpc('accept_current_legal_document', {
    p_document_key: documentKey,
  });

  if (error || data !== true) {
    console.error('legal document acceptance write failed');
    return {
      success: false,
      message: 'Forge could not record your acceptance. Please try again.',
    };
  }

  return { success: true, message: 'Your acceptance was recorded.' };
}

export async function acceptCurrentLegalDocuments(input: {
  acknowledgedKeys: LegalDocumentKey[];
}): Promise<AcceptLegalDocumentsResult> {
  if (
    !Array.isArray(input?.acknowledgedKeys) ||
    !hasAllRequiredLegalAcknowledgements(input.acknowledgedKeys)
  ) {
    return {
      success: false,
      message: 'Review and acknowledge all four documents before continuing.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Your session expired. Sign in and try again.' };
  }

  const { data, error } = await supabase.rpc('accept_current_legal_documents');

  if (error || data !== true) {
    console.error('legal acceptance write failed');
    return {
      success: false,
      message: 'Forge could not record your acceptance. Please try again.',
    };
  }

  return { success: true, message: 'Your acceptance was recorded.' };
}
