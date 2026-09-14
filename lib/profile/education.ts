export function parseEducationOther(education: string | null, raw: FormDataEntryValue | null):
  { ok: true; value: string | null } | { ok: false; message: string } {
  if (education !== 'other') return { ok: true, value: null };
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { ok: false, message: 'Please describe your education or training.' };
  if (value.length > 200) return { ok: false, message: 'Keep your education description to 200 characters or fewer.' };
  return { ok: true, value };
}
