export function parseServiceBackgroundOther(values: readonly string[], raw: FormDataEntryValue | null):
  { ok: true; value: string | null } | { ok: false; message: string } {
  if (!values.includes('other') || values.includes('none') || values.includes('prefer_not_to_say')) return { ok: true, value: null };
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { ok: false, message: 'Please describe your service background.' };
  if (value.length > 200) return { ok: false, message: 'Keep your service background to 200 characters or fewer.' };
  return { ok: true, value };
}
