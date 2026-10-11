import { useSyncExternalStore } from 'react';

// Matches Tailwind's `md` breakpoint: below it the app uses its mobile layouts.
const QUERY = '(max-width: 767px)';

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

export const useIsMobile = (): boolean =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
