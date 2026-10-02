import { ComponentType } from 'react';
import { VendorSettings } from '../Settings/VendorSettings';
import { PaymentMethodSettings } from '../Settings/PaymentMethodSettings';
import { RemindersStep } from './RemindersStep';
import { GmailIntegration } from '../Settings/GmailIntegration';
import { BookmarkletSetupPanel } from '../ProductDashboard/BookmarkletSetupPanel';

// Deliberately a pure data file with no JSX/components of its own — mixing
// local component definitions with non-component exports (the array below)
// in one file breaks Vite's React Fast Refresh boundary detection and forces
// a full page reload on every edit anywhere in this module's dependency
// chain. Per-step props (instead of pre-bound wrapper components) keep all
// actual component rendering inside OnboardingWizard.tsx, which stays a
// clean, Fast-Refresh-safe component-only file.
export interface OnboardingStepConfig {
  key: string;
  title: string;
  description: string;
  Component: ComponentType<any>;
  props?: Record<string, unknown>;
  skippable: boolean;
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    key: 'vendors',
    title: 'Add your vendors',
    description: 'We’ve pre-filled a couple of defaults — rename, remove, or add your own, then continue.',
    Component: VendorSettings,
    skippable: false,
  },
  {
    key: 'paymentMethods',
    title: 'Add payment methods',
    description: 'PayPal, Amazon and Walmart refunds, and Zelle are already set up — customize this list any time.',
    Component: PaymentMethodSettings,
    skippable: false,
  },
  {
    key: 'reminders',
    title: 'Set your reminders',
    description: 'Get a push notification when a product sits in the same status too long, and again if a return window is about to quietly close.',
    Component: RemindersStep,
    skippable: false,
  },
  {
    key: 'gmail',
    title: 'Connect Gmail',
    description: 'Automatically detect new orders from your inbox. You can always connect this later from Settings.',
    Component: GmailIntegration,
    props: { showTestingActions: false },
    skippable: true,
  },
  {
    key: 'bookmarklet',
    title: 'Set up your browser shortcut',
    description: 'Drag a bookmarklet to your browser bar to pre-fill the Add Product form from any order page.',
    Component: BookmarkletSetupPanel,
    props: { defaultExpanded: true },
    skippable: false,
  },
];

export const GMAIL_STEP_INDEX = ONBOARDING_STEPS.findIndex((s) => s.key === 'gmail');
export const BOOKMARKLET_STEP_INDEX = ONBOARDING_STEPS.findIndex((s) => s.key === 'bookmarklet');
export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length;
