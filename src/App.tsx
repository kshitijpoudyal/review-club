import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { useOnboardingStatus } from './hooks/useOnboardingStatus';
import AppHeader from './components/Header/AppHeader';
import BottomTabBar from './components/Header/BottomTabBar';
import { AppShellSkeleton } from './components/common/AppShellSkeleton';
import { pageTransition } from './lib/motion';
import { VendorsProvider } from './contexts/VendorsContext';
import { PaymentMethodsProvider } from './contexts/PaymentMethodsContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

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
  const location = useLocation();
  const { user, logout } = useAuth();
  const { completed: onboardingCompleted, loading: onboardingLoading } = useOnboardingStatus();

  // Don't render if user is null (should be handled by ProtectedRoute, but extra safety)
  if (!user) {
    return <AppShellSkeleton />;
  }

  // Avoid a flash redirect before the first onboarding snapshot resolves
  if (onboardingLoading) {
    return <AppShellSkeleton />;
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
          <NotificationsProvider>
            <div className="min-h-screen bg-background">
              <AppHeader user={user} onLogout={logout} />
              {/* Bottom padding clears the phone tab bar */}
              <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                <motion.div
                  key={location.pathname}
                  variants={pageTransition}
                  initial="initial"
                  animate="enter"
                >
                  <Outlet />
                </motion.div>
              </main>
              <BottomTabBar />
            </div>
          </NotificationsProvider>
        </TransactionsProvider>
      </PaymentMethodsProvider>
    </VendorsProvider>
  );
};

export default App;
