import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStatus } from '../../hooks/useOnboardingStatus';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { ONBOARDING_STEPS, ONBOARDING_TOTAL_STEPS } from './onboardingSteps';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, loading, setCurrentStep, markOnboardingComplete } = useOnboardingStatus();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Hydrate local step from Firestore once the first snapshot resolves, so a
  // mid-wizard refresh resumes where the user left off instead of restarting.
  useEffect(() => {
    if (!loading) setStep(currentStep);
  }, [loading, currentStep]);

  const isLastStep = step === ONBOARDING_TOTAL_STEPS - 1;
  const current = ONBOARDING_STEPS[step];

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await markOnboardingComplete();
      navigate('/products', { replace: true });
    } finally {
      setFinishing(false);
    }
  };

  const goNext = () => {
    if (isLastStep) {
      handleFinish();
      return;
    }
    const next = step + 1;
    setStep(next);
    setCurrentStep(next);
  };

  const goBack = () => {
    if (step === 0) return;
    const prev = step - 1;
    setStep(prev);
    setCurrentStep(prev);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#fbf9f3]" />;
  }

  return (
    <div className="h-dvh bg-[#fbf9f3] flex flex-col overflow-hidden">
      <div className="shrink-0 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className={typography.caption}>
            Step {step + 1} of {ONBOARDING_TOTAL_STEPS}
          </span>
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= step ? 'bg-[#006a68]' : 'bg-[rgba(196,198,207,0.5)]'
                }`}
              />
            ))}
          </div>
        </div>
        <h1 className={typography.pageTitle}>{current.title}</h1>
        <p className={`${typography.caption} mt-1`}>{current.description}</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{
            width: `${ONBOARDING_TOTAL_STEPS * 100}%`,
            transform: `translateX(-${step * (100 / ONBOARDING_TOTAL_STEPS)}%)`,
          }}
        >
          {ONBOARDING_STEPS.map(({ key, Component, props }) => (
            <div
              key={key}
              className="shrink-0 overflow-y-auto px-4 sm:px-6 pb-6"
              style={{ width: `${100 / ONBOARDING_TOTAL_STEPS}%` }}
            >
              <div className="max-w-2xl w-full mx-auto">
                <Component {...(props ?? {})} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 max-w-2xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className={`${colors.button.secondary} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-0 disabled:pointer-events-none`}
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {current.skippable && (
            <button
              type="button"
              onClick={goNext}
              className={`${colors.button.secondary} px-4 py-2.5 rounded-xl font-medium text-sm transition-colors`}
            >
              Skip for now
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={finishing}
            className={`${colors.button.primary} px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLastStep ? (finishing ? 'Finishing...' : 'Finish') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
