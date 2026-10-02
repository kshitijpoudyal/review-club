import { useState } from 'react';

const STORAGE_KEY = 'superpowerMode';

// Local-only UI preference (not synced to Firestore) that reveals
// testing/admin tools on the Settings page: the Gmail "Re-scan all
// (testing)" button, the manual push-notification trigger, and the
// Onboarding and Migrations section. Off by default for everyone.
export function useSuperpowerMode() {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Ignore write failures (e.g. private browsing) — state still updates for this session.
    }
  };

  return { enabled, setEnabled };
}
