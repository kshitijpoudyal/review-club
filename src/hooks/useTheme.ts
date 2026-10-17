import { useCallback, useSyncExternalStore } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

// Keep in sync with the inline script in index.html, which applies the theme
// before first paint.
const STORAGE_KEY = 'review-club-theme';
// Match the translucent header so the phone status bar blends into it
const THEME_COLORS = { light: '#f4f4f8', dark: '#0c0c0e' };

const listeners = new Set<() => void>();
const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

const readPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage unavailable (private mode): fall through to system
  }
  return 'system';
};

const resolve = (preference: ThemePreference): 'light' | 'dark' =>
  preference === 'system' ? (systemQuery().matches ? 'dark' : 'light') : preference;

const apply = () => {
  const resolved = resolve(readPreference());
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolved]);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const query = systemQuery();
  query.addEventListener('change', apply);
  return () => {
    listeners.delete(listener);
    query.removeEventListener('change', apply);
  };
};

export const useTheme = () => {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'system' as const);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    () => resolve(readPreference()),
    () => 'light' as const
  );

  const setTheme = useCallback((next: ThemePreference) => {
    // Ease the swap instead of an abrupt brightness jump (index.css .theme-transition)
    const root = document.documentElement;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-transition');
      window.setTimeout(() => root.classList.remove('theme-transition'), 320);
    }
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice still applies for this session's paint below
    }
    apply();
  }, []);

  return { preference, resolvedTheme, setTheme };
};
