import { PaymentMethod } from '../types/PaymentMethod';

// Default payment methods with IDs — seeded so these work out of the box.
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'PM001',
    name: 'PayPal',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'PM002',
    name: 'AmazonRefund',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'PM003',
    name: 'WalmartRefund',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'PM004',
    name: 'Zelle',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

// Default payment method ID (PayPal) — used if ever needed for backfill-by-id
export const DEFAULT_PAYMENT_METHOD_ID = 'PM001';

// Utility functions for payment method management
export const getPaymentMethodById = (methods: PaymentMethod[], id: string): PaymentMethod | undefined => {
  return methods.find(method => method.id === id);
};

export const getPaymentMethodName = (methods: PaymentMethod[], id?: string): string => {
  if (!id) return 'Unknown';
  const method = getPaymentMethodById(methods, id);
  return method ? method.name : 'Unknown';
};

export const getActivePaymentMethods = (methods: PaymentMethod[]): PaymentMethod[] => {
  return methods.filter(method => method.isActive);
};
