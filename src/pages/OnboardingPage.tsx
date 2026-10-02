import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { OnboardingWizard } from '../components/Onboarding/OnboardingWizard';
import { VendorsProvider } from '../contexts/VendorsContext';
import { PaymentMethodsProvider } from '../contexts/PaymentMethodsContext';

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { completed, loading } = useOnboardingStatus();

  if (loading) {
    return <div className="min-h-screen bg-[#fbf9f3]" />;
  }

  // Already-onboarded users hitting this route directly (stale bookmark, etc.)
  // get sent to the normal app instead of re-running the wizard.
  if (completed) {
    return <Navigate to="/products" replace />;
  }

  // The wizard mounts all of its steps at once (for the slide transition),
  // including VendorSettings and PaymentMethodSettings — both of which throw
  // if rendered outside their provider. App.tsx supplies these for the main
  // layout, but this route lives outside that layout, so it needs its own.
  return (
    <VendorsProvider userId={user?.uid}>
      <PaymentMethodsProvider userId={user?.uid}>
        <OnboardingWizard />
      </PaymentMethodsProvider>
    </VendorsProvider>
  );
};

export default OnboardingPage;
