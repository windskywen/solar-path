export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'solar-theme-mode';
export const DEFAULT_THEME: ThemeMode = 'dark';

export const THEME_META_COLORS: Record<ThemeMode, string> = {
  dark: '#04070d',
  light: '#eef4fb',
};

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

export function resolveThemeMode(value: string | null | undefined): ThemeMode {
  return isThemeMode(value) ? value : DEFAULT_THEME;
}

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', THEME_META_COLORS[theme]);
  }
}

export function buildThemeInitScript(): string {
  const storageKey = JSON.stringify(THEME_STORAGE_KEY);
  const darkMetaColor = JSON.stringify(THEME_META_COLORS.dark);
  const lightMetaColor = JSON.stringify(THEME_META_COLORS.light);
  const defaultTheme = JSON.stringify(DEFAULT_THEME);

  return `(() => {
    const storageKey = ${storageKey};
    const defaultTheme = ${defaultTheme};
    let theme = defaultTheme;

    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === 'dark' || storedTheme === 'light') {
        theme = storedTheme;
      }
    } catch {}

    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'light' ? ${lightMetaColor} : ${darkMetaColor});
    }
  })();`;
}
