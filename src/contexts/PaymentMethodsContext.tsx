import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { PaymentMethod } from '../types/PaymentMethod';
import { paymentMethodService } from '../firebase/paymentMethodService';
import { DEFAULT_PAYMENT_METHOD_ID } from '../utils/paymentMethods';

// ─── Cache helpers ──────────────────────────────────────────────────────────
const CACHE_VERSION = 'v1';
const cacheKey = (uid: string) => `art_payment_methods_${CACHE_VERSION}_${uid}`;

function readPaymentMethodCache(uid: string): PaymentMethod[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const { paymentMethods } = JSON.parse(raw);
    return Array.isArray(paymentMethods) ? paymentMethods : null;
  } catch {
    return null;
  }
}

function writePaymentMethodCache(uid: string, paymentMethods: PaymentMethod[]): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify({ paymentMethods, ts: Date.now() }));
  } catch {
    // Ignore quota errors
  }
}
// ───────────────────────────────────────────────────────────────────────────

interface PaymentMethodsContextValue {
  paymentMethods: PaymentMethod[];
  activePaymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  loadPaymentMethods: () => Promise<void>;
  addPaymentMethod: (methodData: Omit<PaymentMethod, 'id'>) => Promise<string>;
  updatePaymentMethod: (methodId: string, updates: Partial<PaymentMethod>) => Promise<void>;
  deactivatePaymentMethod: (methodId: string) => Promise<void>;
  getPaymentMethodById: (methodId: string) => PaymentMethod | undefined;
  getPaymentMethodName: (methodId?: string) => string;
  DEFAULT_PAYMENT_METHOD_ID: string;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextValue | null>(null);

export const PaymentMethodsProvider: React.FC<{ userId?: string; children: ReactNode }> = ({ userId, children }) => {
  const initRef = useRef<{ paymentMethods: PaymentMethod[]; hasCache: boolean } | null>(null);
  if (!initRef.current) {
    const cached = userId ? readPaymentMethodCache(userId) : null;
    initRef.current = { paymentMethods: cached ?? [], hasCache: !!cached };
  }

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initRef.current.paymentMethods);
  const [loading, setLoading] = useState(!initRef.current.hasCache);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setPaymentMethods([]);
      return;
    }

    if (!initRef.current?.hasCache) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch first — only seed the default payment methods the very first time a user has none.
      let methodsData = await paymentMethodService.getPaymentMethods(userId);
      if (methodsData.length === 0) {
        await paymentMethodService.initializePaymentMethods(userId);
        methodsData = await paymentMethodService.getPaymentMethods(userId);
      }

      writePaymentMethodCache(userId, methodsData);
      setPaymentMethods(methodsData);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addPaymentMethod = useCallback(async (methodData: Omit<PaymentMethod, 'id'>): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');
    try {
      const methodId = await paymentMethodService.addPaymentMethod(userId, methodData);
      await loadPaymentMethods();
      return methodId;
    } catch (err) {
      console.error('Error adding payment method:', err);
      throw err;
    }
  }, [userId, loadPaymentMethods]);

  const updatePaymentMethod = useCallback(async (methodId: string, updates: Partial<PaymentMethod>): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');
    try {
      await paymentMethodService.updatePaymentMethod(userId, methodId, updates);
      await loadPaymentMethods();
    } catch (err) {
      console.error('Error updating payment method:', err);
      throw err;
    }
  }, [userId, loadPaymentMethods]);

  const deactivatePaymentMethod = useCallback(async (methodId: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');
    try {
      await paymentMethodService.deactivatePaymentMethod(userId, methodId);
      await loadPaymentMethods();
    } catch (err) {
      console.error('Error deactivating payment method:', err);
      throw err;
    }
  }, [userId, loadPaymentMethods]);

  const getPaymentMethodById = useCallback((methodId: string): PaymentMethod | undefined => {
    return paymentMethods.find(method => method.id === methodId);
  }, [paymentMethods]);

  const getPaymentMethodName = useCallback((methodId?: string): string => {
    if (!methodId) return 'Unknown';
    const method = getPaymentMethodById(methodId);
    return method ? method.name : 'Unknown';
  }, [getPaymentMethodById]);

  const activePaymentMethods = useMemo(() => paymentMethods.filter(method => method.isActive), [paymentMethods]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const value: PaymentMethodsContextValue = {
    paymentMethods,
    activePaymentMethods,
    loading,
    error,
    loadPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deactivatePaymentMethod,
    getPaymentMethodById,
    getPaymentMethodName,
    DEFAULT_PAYMENT_METHOD_ID
  };

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
};

export const usePaymentMethods = (): PaymentMethodsContextValue => {
  const ctx = useContext(PaymentMethodsContext);
  if (!ctx) {
    throw new Error('usePaymentMethods must be used within a PaymentMethodsProvider');
  }
  return ctx;
};
