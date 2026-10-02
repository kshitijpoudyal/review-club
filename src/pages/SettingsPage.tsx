import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { useSuperpowerMode } from '../hooks/useSuperpowerMode';
import { typography } from '../utils/typography';
import { colors } from '../utils/colors';
import { VendorSettings } from '../components/Settings/VendorSettings';
import { PaymentMethodSettings } from '../components/Settings/PaymentMethodSettings';
import { GmailIntegration } from '../components/Settings/GmailIntegration';
import { OrderReminders } from '../components/Settings/OrderReminders';
import { BookmarkletSetupPanel } from '../components/ProductDashboard/BookmarkletSetupPanel';
import { ToggleSwitch } from '../components/common/ToggleSwitch';
import { GMAIL_STEP_INDEX } from '../components/Onboarding/onboardingSteps';

const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completed: onboardingCompleted, loading: onboardingLoading, setCurrentStep } = useOnboardingStatus();
  const { enabled: superpowerEnabled, setEnabled: setSuperpowerEnabled } = useSuperpowerMode();

  // If the Gmail OAuth round trip lands here while onboarding isn't finished
  // yet, bounce back into the wizard — landing back ON the Gmail step (not past
  // it) so the user sees their now-connected account, retailer checkboxes, and
  // the "Check Gmail now" button. No-op for already-onboarded users (existing
  // behavior below is unaffected in that case).
  const gmailParam = searchParams.get('gmail');
  useEffect(() => {
    if (onboardingLoading) return;
    if ((gmailParam === 'connected' || gmailParam === 'error') && !onboardingCompleted) {
      setCurrentStep(GMAIL_STEP_INDEX).then(() => navigate('/onboarding', { replace: true }));
    }
  }, [gmailParam, onboardingCompleted, onboardingLoading, navigate, setCurrentStep]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className={typography.pageTitle}>Settings</h1>
        <p className={`${typography.caption} mt-1`}>
          Manage notification triggers, connected integrations, and your vendor roster.
        </p>
      </div>

      <VendorSettings />

      <PaymentMethodSettings />

      <GmailIntegration showTestingActions={superpowerEnabled} />

      <OrderReminders showTestTrigger={superpowerEnabled} />

      <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
        <div className="p-4 sm:p-6 md:p-8">
          <h2 className={typography.sectionTitle}>Browser shortcuts</h2>
          <p className={`${typography.caption} mt-1 mb-3`}>
            Set up a drag-to-bookmark shortcut to pre-fill the Add Product form straight from an order page.
          </p>
          <BookmarkletSetupPanel />
        </div>
      </section>

      <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} overflow-hidden`}>
        <div className="p-4 sm:p-6 md:p-8 flex items-center justify-between gap-3">
          <div>
            <h2 className={typography.sectionTitle}>Superpower mode</h2>
            <p className={`${typography.caption} mt-1`}>
              Reveals testing and admin tools: Gmail&apos;s re-scan-all button and the manual
              push-notification trigger.
            </p>
          </div>
          <ToggleSwitch checked={superpowerEnabled} onChange={setSuperpowerEnabled} label="Superpower mode" />
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
