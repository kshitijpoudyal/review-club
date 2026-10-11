import { typography } from '../../utils/typography';
import React from 'react';
import { Product } from '../../types/Product';
import { ProductFormSectionHeader } from './ProductFormSectionHeader';

const REVIEW_STEPS: { field: keyof Product; label: string }[] = [
  { field: 'orderPlaced', label: 'Placed' },
  { field: 'orderDelivered', label: 'Delivered' },
  { field: 'reviewAdded', label: 'Reviewed' },
  { field: 'reviewLive', label: 'Live' },
  { field: 'reviewSSSent', label: 'Screenshot' },
];

interface ProductFormReviewJourneySectionProps {
  product: Product;
  onStepToggle: (field: keyof Product, newValue: boolean) => void;
}

export const ProductFormReviewJourneySection: React.FC<ProductFormReviewJourneySectionProps> = ({
  product,
  onStepToggle,
}) => {
  const allStepsDone = REVIEW_STEPS.every(s => !!product[s.field]);

  return (
    <div className="px-6 py-5">
      <ProductFormSectionHeader title="Review journey" />

      <div className="flex items-start">
        {REVIEW_STEPS.map((step, i) => {
          const done = !!product[step.field];
          const nextDone = i < REVIEW_STEPS.length - 1 && !!product[REVIEW_STEPS[i + 1].field];
          return (
            <React.Fragment key={step.field}>
              <button
                type="button"
                onClick={() => onStepToggle(step.field, !done)}
                className="flex flex-col items-center flex-1 gap-1.5 focus:outline-none group"
                title={done ? `Unmark ${step.label}` : `Mark as ${step.label}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-150 ${
                  done
                    ? 'bg-brand border-brand text-brand-foreground group-hover:bg-brand/90'
                    : 'bg-card border-input text-muted-foreground group-hover:border-brand group-hover:text-brand'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`${typography.captionStrong}`}>{i + 1}</span>
                  )}
                </div>
                <span className={`${typography.caption} text-center leading-tight transition-colors ${
                  done ? 'text-brand font-semibold' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </button>
              {i < REVIEW_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mt-[18px] transition-colors duration-300 ${
                  done && nextDone ? 'bg-brand' : 'bg-surface-variant'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {allStepsDone && (
        <p className="text-xs text-brand font-medium mt-3 text-center">
          🎉 All steps complete!
        </p>
      )}
    </div>
  );
};

export default ProductFormReviewJourneySection;
