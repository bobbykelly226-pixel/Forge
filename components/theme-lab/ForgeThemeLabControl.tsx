'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Palette, RotateCcw, X } from 'lucide-react';

import { useForgeThemeLab } from '@/components/theme-lab/ForgeThemeLabProvider';
import { FORGE_THEME_LAB_OPTIONS } from '@/lib/forge-theme-lab';

/**
 * Temporary floating Theme Lab control.
 * Collapsed by default; does not trap focus like a modal.
 */
export default function ForgeThemeLabControl() {
  const { themeId, setThemeId, resetToCurrentCream } = useForgeThemeLab();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  return (
    <div
      className="pointer-events-none fixed z-[70] bottom-[5.75rem] right-3 sm:right-4 lg:bottom-6 lg:right-6"
      data-forge-theme-lab-control=""
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {open && (
          <div
            ref={panelRef}
            id={panelId}
            role="region"
            aria-labelledby={titleId}
            className="w-[min(18.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.35rem] border border-[#0B2D5C]/12 bg-white shadow-[0_16px_40px_rgba(11,45,92,0.16)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#0B2D5C]/08 px-4 py-3">
              <div className="min-w-0">
                <p
                  id={titleId}
                  className="text-sm font-semibold text-[#0B2D5C]"
                  style={{ fontFamily: 'var(--font-discovery-display), Georgia, serif' }}
                >
                  Forge Theme Lab
                </p>
                <p className="mt-0.5 text-xs text-[#7A8494]">Application background preview</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0B2D5C]/12 text-[#0B2D5C] transition hover:bg-[#F8F6F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
                aria-label="Close Forge Theme Lab"
              >
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <div
              className="flex flex-col gap-1.5 p-3"
              role="radiogroup"
              aria-label="Application background themes"
            >
              {FORGE_THEME_LAB_OPTIONS.map((option) => {
                const selected = themeId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setThemeId(option.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C] ${
                      selected
                        ? 'border-[#0B2D5C] bg-[#E8EEF6]/80'
                        : 'border-[#0B2D5C]/10 bg-white hover:border-[#0B2D5C]/20 hover:bg-[#FBF9F6]'
                    }`}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-xl border border-[#0B2D5C]/15 shadow-inner"
                      style={{ background: option.swatch }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0B2D5C]">
                        {option.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[#7A8494]">
                        {option.hexLabel ?? option.swatch}
                        {selected ? ' · Selected' : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[#0B2D5C]/08 px-3 py-3">
              <button
                type="button"
                onClick={resetToCurrentCream}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#0B2D5C]/12 bg-[#FBF9F6] px-3 py-2.5 text-sm font-semibold text-[#0B2D5C] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                Reset to Current Cream
              </button>
              <p className="mt-2 text-center text-[10px] leading-relaxed text-[#8A93A0]">
                Temporary developer tool — remove after theme selection
              </p>
            </div>
          </div>
        )}

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label="Open Forge Theme Lab"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0B2D5C]/15 bg-white text-[#0B2D5C] shadow-[0_10px_28px_rgba(11,45,92,0.14)] transition hover:border-[#0B2D5C]/28 hover:bg-[#FBF9F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2D5C]"
        >
          <Palette className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
