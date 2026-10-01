import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => number;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    if (type !== 'loading') {
      setTimeout(() => dismiss(id), 2800);
    }
    return id;
  }, [dismiss]);

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    loading: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  };

  const bgMap: Record<ToastType, string> = {
    success: 'bg-[#006a68] text-white',
    error: 'bg-[#ba1a1a] text-white',
    info: 'bg-[#022448] text-white',
    loading: 'bg-[#022448] text-white',
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast: dismiss }}>
      {children}
      {/* Toast container — above FAB (z-50), bottom-right on desktop, bottom-center on mobile */}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 md:right-6 z-50 flex flex-col gap-2 items-center md:items-end pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-2.5 px-4 py-3 rounded-full shadow-[0_8px_24px_rgba(2,36,72,0.22)]
              text-sm font-semibold max-w-xs pointer-events-auto
              animate-[slideUp_0.25s_ease-out]
              ${bgMap[toast.type]}
            `}
          >
            <span className="flex-shrink-0">{iconMap[toast.type]}</span>
            <span>{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 ml-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
