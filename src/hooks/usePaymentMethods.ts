// Payment methods are fetched once per session via PaymentMethodsProvider
// (see src/contexts/PaymentMethodsContext.tsx) and shared across every component
// that needs them, instead of each hook call re-reading the collection from Firestore independently.
export { usePaymentMethods } from '../contexts/PaymentMethodsContext';
