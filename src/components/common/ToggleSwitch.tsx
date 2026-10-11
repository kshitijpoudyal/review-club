import React from 'react';
import { Switch } from '@/components/ui/switch';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled, label }) => (
  <Switch
    checked={checked}
    onCheckedChange={onChange}
    disabled={disabled}
    aria-label={label}
  />
);
