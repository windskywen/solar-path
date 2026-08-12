'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  applyThemeToDocument,
  DEFAULT_THEME,
  isThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '@/lib/theme/theme';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  isLight: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_CHANGE_EVENT = 'solar-theme-change';

function getThemeSnapshot(): ThemeMode {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function getServerThemeSnapshot(): ThemeMode {
  return DEFAULT_THEME;
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function persistTheme(theme: ThemeMode) {
  applyThemeToDocument(theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    persistTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    persistTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
