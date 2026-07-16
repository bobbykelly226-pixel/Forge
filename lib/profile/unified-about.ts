/**
 * Canonical public biography helpers.
 *
 * Legacy storage keeps `profiles.short_bio` and `profiles.more_about`.
 * Public presentation and editing use one About value; `more_about` is a
 * fallback that is normalized into `short_bio` when the About section is saved.
 */

function normalizeForCompare(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Resolve a single About string from the legacy dual fields.
 * - Only About → About
 * - Only More About → that content as About
 * - Both different → combine with a blank line (nothing silently dropped)
 * - Same / substantially identical → one copy
 */
export function resolveUnifiedAbout(
  shortBio: string | null | undefined,
  moreAbout: string | null | undefined
): string | null {
  const about = (shortBio ?? '').trim();
  const more = (moreAbout ?? '').trim();

  if (!about && !more) return null;
  if (!about) return more;
  if (!more) return about;

  const aboutKey = normalizeForCompare(about);
  const moreKey = normalizeForCompare(more);

  if (aboutKey === moreKey) return about;
  if (aboutKey.includes(moreKey)) return about;
  if (moreKey.includes(aboutKey)) return more;

  return `${about}\n\n${more}`;
}

/**
 * Feed / card preview: prefer the short About field; fall back to More About
 * when About is empty so legacy-only content still surfaces.
 */
export function resolveAboutPreview(
  shortBio: string | null | undefined,
  moreAbout: string | null | undefined
): string | null {
  const about = (shortBio ?? '').trim();
  if (about) return about;
  const more = (moreAbout ?? '').trim();
  return more || null;
}
