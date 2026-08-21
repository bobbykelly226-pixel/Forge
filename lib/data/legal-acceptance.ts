import { createClient } from '@/lib/supabase/server';

export type LegalAcceptanceStatus = {
  accepted: boolean;
  unavailable: boolean;
  message?: string;
};

function isMissingLegalFunction(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST202';
}

export async function loadCurrentLegalAcceptance(): Promise<LegalAcceptanceStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('has_current_legal_acceptance');

  if (error) {
    if (!isMissingLegalFunction(error)) {
      console.error('current legal acceptance lookup failed');
    }
    return {
      accepted: false,
      unavailable: true,
      message: 'Forge could not verify the current legal versions. Please try again.',
    };
  }

  return { accepted: data === true, unavailable: false };
}
