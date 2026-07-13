/**
 * Temporary developer Theme Lab — application canvas backgrounds only.
 * Remove after a permanent background direction is chosen.
 * No backend, account preferences, or marketing-page impact.
 */

export const FORGE_THEME_LAB_STORAGE_KEY = 'forge-theme-lab-background';

/** Exact current Forge application canvas (Discovery / Connections / Character Signals). */
export const FORGE_CURRENT_CREAM_BACKGROUND =
  'radial-gradient(ellipse 120% 80% at 50% -10%, #E8EEF6 0%, #F4F1EC 42%, #EFEAE3 100%)';

export type ForgeThemeLabId =
  | 'current-cream'
  | 'warm-gray'
  | 'soft-slate'
  | 'soft-stone'
  | 'pure-white';

export type ForgeThemeLabOption = {
  id: ForgeThemeLabId;
  name: string;
  /** Solid swatch color for the Theme Lab UI */
  swatch: string;
  /** Value applied to --forge-app-background */
  background: string;
  /** Hex shown in the lab UI; omit for token/gradient baselines */
  hexLabel?: string;
};

export const FORGE_THEME_LAB_OPTIONS: ForgeThemeLabOption[] = [
  {
    id: 'current-cream',
    name: 'Current Cream',
    swatch: '#F4F1EC',
    background: FORGE_CURRENT_CREAM_BACKGROUND,
    hexLabel: 'Current',
  },
  {
    id: 'warm-gray',
    name: 'Warm Gray',
    swatch: '#EEF1F4',
    background: '#EEF1F4',
    hexLabel: '#EEF1F4',
  },
  {
    id: 'soft-slate',
    name: 'Soft Slate',
    swatch: '#E8EBF0',
    background: '#E8EBF0',
    hexLabel: '#E8EBF0',
  },
  {
    id: 'soft-stone',
    name: 'Soft Stone',
    swatch: '#F0F1F3',
    background: '#F0F1F3',
    hexLabel: '#F0F1F3',
  },
  {
    id: 'pure-white',
    name: 'Pure White',
    swatch: '#FFFFFF',
    background: '#FFFFFF',
    hexLabel: '#FFFFFF',
  },
];

export const FORGE_THEME_LAB_DEFAULT_ID: ForgeThemeLabId = 'current-cream';

export function getThemeLabOption(id: ForgeThemeLabId): ForgeThemeLabOption {
  return (
    FORGE_THEME_LAB_OPTIONS.find((option) => option.id === id) ??
    FORGE_THEME_LAB_OPTIONS[0]
  );
}

export function isForgeThemeLabId(value: string | null | undefined): value is ForgeThemeLabId {
  return FORGE_THEME_LAB_OPTIONS.some((option) => option.id === value);
}

/** Inline bootstrap script — reduces first-paint flash on app canvases. */
export const FORGE_THEME_LAB_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(
  FORGE_THEME_LAB_STORAGE_KEY
)};var raw=localStorage.getItem(k);var map=${JSON.stringify(
  Object.fromEntries(FORGE_THEME_LAB_OPTIONS.map((o) => [o.id, o.background]))
)};var bg=map[raw]||${JSON.stringify(FORGE_CURRENT_CREAM_BACKGROUND)};document.documentElement.style.setProperty('--forge-app-background',bg);document.documentElement.setAttribute('data-forge-theme-lab',raw&&map[raw]?raw:${JSON.stringify(
  FORGE_THEME_LAB_DEFAULT_ID
)});}catch(e){document.documentElement.style.setProperty('--forge-app-background',${JSON.stringify(
  FORGE_CURRENT_CREAM_BACKGROUND
)});}})();`;
