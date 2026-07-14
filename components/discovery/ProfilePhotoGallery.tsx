'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

import {
  buildPublicProfilePhotoUrl,
  resolveAuthoritativeProfilePhotoUrl,
  sortPhotosByDisplayOrder,
} from '@/lib/profile-photo';
import { stablePortraitGradient } from '@/lib/discovery/presentation';

export type GalleryPhoto = {
  id?: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  public_url?: string | null;
};

export type ProfilePhotoGalleryProps = {
  profileId: string;
  firstName: string;
  age: number | null;
  locationLabel: string | null;
  legacyProfilePhotoUrl?: string | null;
  photos: GalleryPhoto[];
  badge?: React.ReactNode;
};

function photoUrl(photo: GalleryPhoto): string | null {
  return photo.public_url || buildPublicProfilePhotoUrl(photo.storage_path);
}

/**
 * Public profile photo gallery.
 * Browsing changes only the active display — never primary metadata.
 * Wrap: continuous previous/next through the ordered gallery.
 */
export default function ProfilePhotoGallery({
  profileId,
  firstName,
  age,
  locationLabel,
  legacyProfilePhotoUrl,
  photos,
  badge,
}: ProfilePhotoGalleryProps) {
  const ordered = useMemo(() => {
    const sorted = sortPhotosByDisplayOrder(photos).filter((photo) =>
      Boolean(photoUrl(photo))
    );
    if (sorted.length > 0) return sorted;
    if (legacyProfilePhotoUrl?.trim()) {
      return [
        {
          id: 'legacy',
          storage_path: '',
          display_order: 0,
          is_primary: true,
          public_url: legacyProfilePhotoUrl.trim(),
        },
      ];
    }
    return [];
  }, [legacyProfilePhotoUrl, photos]);

  const primaryIndex = useMemo(() => {
    const idx = ordered.findIndex((photo) => photo.is_primary);
    return idx >= 0 ? idx : 0;
  }, [ordered]);

  const photosKey = `${profileId}:${ordered
    .map((photo) => `${photo.id ?? photo.storage_path}:${photo.is_primary ? 1 : 0}`)
    .join('|')}`;
  const [activeIndex, setActiveIndex] = useState(primaryIndex);
  const [syncKey, setSyncKey] = useState(photosKey);
  if (syncKey !== photosKey) {
    setSyncKey(photosKey);
    setActiveIndex(primaryIndex);
  }

  const touchStartX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const count = ordered.length;
  const hasMultiple = count > 1;
  const active = ordered[activeIndex] ?? ordered[0] ?? null;
  const activeUrl = active ? photoUrl(active) : null;
  const fallbackUrl = resolveAuthoritativeProfilePhotoUrl({
    photos,
    legacyProfilePhotoUrl,
  });
  const portrait = activeUrl
    ? `url(${activeUrl})`
    : fallbackUrl
      ? `url(${fallbackUrl})`
      : stablePortraitGradient(profileId);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setActiveIndex(next);
    },
    [count]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !hasMultiple) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, hasMultiple]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (!hasMultiple || touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  return (
    <div
      ref={rootRef}
      className="space-y-4 outline-none"
      data-testid="profile-photo-gallery"
      tabIndex={hasMultiple ? 0 : undefined}
      aria-roledescription={hasMultiple ? 'photo gallery' : undefined}
      aria-label={
        hasMultiple
          ? `${firstName} photos, ${activeIndex + 1} of ${count}`
          : `${firstName} photo`
      }
    >
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] lg:aspect-[3/4] lg:rounded-[2.25rem]"
        style={{
          backgroundImage: typeof portrait === 'string' ? portrait : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {badge}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2D5C]/70 to-transparent px-6 pb-6 pt-24 lg:px-7 lg:pb-7">
          <h1
            className="text-[2.25rem] leading-none text-white lg:text-[2.5rem]"
            style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
          >
            {firstName}
            {age != null ? `, ${age}` : ''}
          </h1>
          {locationLabel ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/90">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {locationLabel}
            </p>
          ) : null}
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#0B2D5C]/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-[#0B2D5C]/6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#0B2D5C]/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-[#0B2D5C]/6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <div
              className="absolute right-4 top-4 rounded-full bg-[#0B2D5C]/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
              aria-live="polite"
              data-testid="gallery-position"
            >
              {activeIndex + 1} of {count}
            </div>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <section aria-label="Photo thumbnails" data-testid="gallery-thumbnails">
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ordered.map((photo, index) => {
              const url = photoUrl(photo);
              if (!url) return null;
              const selected = index === activeIndex;
              return (
                <button
                  key={photo.id ?? `${photo.storage_path}-${index}`}
                  type="button"
                  aria-label={`Show photo ${index + 1} of ${count}`}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => goTo(index)}
                  className={`relative h-20 w-14 shrink-0 overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] sm:h-24 sm:w-16 ${
                    selected
                      ? 'ring-2 ring-[#0B2D5C] ring-offset-2 ring-offset-[#E8EBF0]'
                      : 'opacity-85'
                  }`}
                  style={{
                    backgroundImage: `url(${url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
