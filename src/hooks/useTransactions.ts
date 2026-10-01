// Transactions are fetched once per session via TransactionsProvider
// (see src/contexts/TransactionsContext.tsx) and shared across every component
// that needs them, instead of each hook call re-reading the collection independently.
export { useTransactions } from '../contexts/TransactionsContext';
