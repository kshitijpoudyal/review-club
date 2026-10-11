import React from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => number;
  dismissToast: (id: number) => void;
}

const TOAST_DURATION_MS = 2800;

let counter = 0;

const showToast = (message: string, type: ToastType = 'success'): number => {
  const id = ++counter;
  if (type === 'loading') {
    // Loading toasts stay until the caller dismisses them.
    toast.loading(message, { id, duration: Infinity });
  } else {
    toast[type](message, { id });
  }
  return id;
};

const dismissToast = (id: number) => {
  toast.dismiss(id);
};

// Stable identity: callers list showToast in effect dependency arrays.
const toastApi: ToastContextValue = { showToast, dismissToast };

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    {children}
    {/* Bottom-right on desktop; on mobile sonner goes full-width, lifted above the tab bar and FAB */}
    <Toaster
      position="bottom-right"
      duration={TOAST_DURATION_MS}
      offset={24}
      mobileOffset={{ bottom: 152 }}
    />
  </>
);

export const useToast = (): ToastContextValue => toastApi;
