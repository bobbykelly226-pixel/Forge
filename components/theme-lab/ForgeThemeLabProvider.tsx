'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  FORGE_CURRENT_CREAM_BACKGROUND,
  FORGE_THEME_LAB_DEFAULT_ID,
  FORGE_THEME_LAB_STORAGE_KEY,
  getThemeLabOption,
  isForgeThemeLabId,
  type ForgeThemeLabId,
} from '@/lib/forge-theme-lab';

type ForgeThemeLabContextValue = {
  themeId: ForgeThemeLabId;
  setThemeId: (id: ForgeThemeLabId) => void;
  resetToCurrentCream: () => void;
};

const ForgeThemeLabContext = createContext<ForgeThemeLabContextValue | null>(null);

export function useForgeThemeLab() {
  const ctx = useContext(ForgeThemeLabContext);
  if (!ctx) {
    throw new Error('useForgeThemeLab must be used within ForgeThemeLabProvider');
  }
  return ctx;
}

function applyThemeToDocument(themeId: ForgeThemeLabId) {
  const option = getThemeLabOption(themeId);
  document.documentElement.style.setProperty('--forge-app-background', option.background);
  document.documentElement.setAttribute('data-forge-theme-lab', themeId);
}

function readStoredThemeId(): ForgeThemeLabId {
  if (typeof window === 'undefined') return FORGE_THEME_LAB_DEFAULT_ID;
  try {
    const raw = window.localStorage.getItem(FORGE_THEME_LAB_STORAGE_KEY);
    return isForgeThemeLabId(raw) ? raw : FORGE_THEME_LAB_DEFAULT_ID;
  } catch {
    return FORGE_THEME_LAB_DEFAULT_ID;
  }
}

/**
 * Temporary Theme Lab provider — application canvas backgrounds only.
 * Easy to remove after a permanent theme is selected.
 */
export function ForgeThemeLabProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ForgeThemeLabId>(FORGE_THEME_LAB_DEFAULT_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredThemeId();
    setThemeIdState(stored);
    applyThemeToDocument(stored);
    setHydrated(true);
  }, []);

  const setThemeId = useCallback((id: ForgeThemeLabId) => {
    setThemeIdState(id);
    applyThemeToDocument(id);
    try {
      window.localStorage.setItem(FORGE_THEME_LAB_STORAGE_KEY, id);
    } catch {
      // Ignore private-mode / storage failures in this temporary lab.
    }
  }, []);

  const resetToCurrentCream = useCallback(() => {
    setThemeId(FORGE_THEME_LAB_DEFAULT_ID);
  }, [setThemeId]);

  const value = useMemo(
    () => ({
      themeId: hydrated ? themeId : FORGE_THEME_LAB_DEFAULT_ID,
      setThemeId,
      resetToCurrentCream,
    }),
    [hydrated, themeId, setThemeId, resetToCurrentCream]
  );

  return (
    <ForgeThemeLabContext.Provider value={value}>{children}</ForgeThemeLabContext.Provider>
  );
}

/** Fallback style for SSR / before bootstrap — exact Current Cream. */
export const forgeAppCanvasFallbackStyle = {
  background: `var(--forge-app-background, ${FORGE_CURRENT_CREAM_BACKGROUND})`,
} as const;
