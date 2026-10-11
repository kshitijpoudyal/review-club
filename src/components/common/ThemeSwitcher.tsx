import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, ThemePreference } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/** Light / Dark / System segmented control. */
export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { preference, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn('grid grid-cols-3 gap-1 rounded-lg bg-muted p-1', className)}
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-caption font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            preference === value
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
};
