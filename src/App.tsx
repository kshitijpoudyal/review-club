import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useOnboardingStatus } from './hooks/useOnboardingStatus';
import AppHeader from './components/Header/AppHeader';
import { VendorsProvider } from './contexts/VendorsContext';
import { PaymentMethodsProvider } from './contexts/PaymentMethodsContext';
import { TransactionsProvider } from './contexts/TransactionsContext';

/**
 * App Layout Component
 *
 * This component serves as the main layout wrapper for all authenticated pages.
 * It provides:
 * - Common header navigation
 * - Consistent styling and layout structure
 * - User context through useAuth hook
 *
 * Uses React Router's Outlet to render child routes
 */
const App: React.FC = () => {
  const { user, logout } = useAuth();
  const { completed: onboardingCompleted, loading: onboardingLoading } = useOnboardingStatus();

  // Don't render if user is null (should be handled by ProtectedRoute, but extra safety)
  if (!user) {
    return null;
  }

  // Avoid a flash redirect before the first onboarding snapshot resolves
  if (onboardingLoading) {
    return null;
  }

  // Send anyone who hasn't finished onboarding to the wizard, which lives
  // outside this layout (no header/nav) — see src/pages/OnboardingPage.tsx
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <VendorsProvider userId={user.uid}>
      <PaymentMethodsProvider userId={user.uid}>
        <TransactionsProvider userId={user.uid}>
          <div className="min-h-screen bg-[#fbf9f3]">
            <AppHeader user={user} onLogout={logout} />
            <main>
              <Outlet />
            </main>
          </div>
        </TransactionsProvider>
      </PaymentMethodsProvider>
    </VendorsProvider>
  );
};

export default App;
