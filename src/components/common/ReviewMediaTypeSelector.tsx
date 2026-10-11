import React, { useId } from 'react';
import {
  CheckIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { typography } from '../../utils/typography';
import { DEFAULT_REVIEW_MEDIA_TYPE, ReviewMediaType } from '../../types/Product';

const REVIEW_MEDIA_OPTIONS: {
  value: ReviewMediaType;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  { value: 'text', label: 'Text', Icon: DocumentTextIcon },
  { value: 'photo', label: 'Photo', Icon: PhotoIcon },
  { value: 'video', label: 'Video', Icon: VideoCameraIcon },
];

interface ReviewMediaTypeSelectorProps {
  value?: ReviewMediaType;
  onChange: (value: ReviewMediaType) => void;
  /** Hide the legend when a parent section already provides context */
  hideLabel?: boolean;
}

export const ReviewMediaTypeSelector: React.FC<ReviewMediaTypeSelectorProps> = ({
  value,
  onChange,
  hideLabel = false,
}) => {
  const groupId = useId();
  const current = value ?? DEFAULT_REVIEW_MEDIA_TYPE;

  return (
    <fieldset className="border-0 p-0 m-0 min-w-0">
      <legend className={`${typography.label} mb-2 ${hideLabel ? 'sr-only' : ''}`}>
        Review requirement
      </legend>
      <div className="flex w-full gap-1 p-1 rounded-xl bg-secondary/80 border border-input/45">
        {REVIEW_MEDIA_OPTIONS.map(({ value: optionValue, label, Icon }) => {
          const inputId = `${groupId}-${optionValue}`;
          const isSelected = current === optionValue;

          return (
            <label
              key={optionValue}
              htmlFor={inputId}
              className="relative flex-1 min-w-0 cursor-pointer"
            >
              <input
                id={inputId}
                type="radio"
                name={groupId}
                value={optionValue}
                checked={isSelected}
                onChange={() => onChange(optionValue)}
                className="peer sr-only"
              />
              <span
                className={`flex h-11 items-center justify-center gap-1.5 rounded-lg ${typography.button} transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary/25 peer-focus-visible:ring-offset-1 ${
                  isSelected
                    ? 'bg-brand text-brand-foreground font-semibold'
                    : 'bg-transparent text-on-surface-variant hover:bg-white/70'
                }`}
              >
                {isSelected && (
                  <CheckIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 ${isSelected ? 'opacity-90' : 'opacity-60'}`}
                  aria-hidden={true}
                />
                <span>{label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

/** Alias for product form usage */
export const ReviewRequirementSelector = ReviewMediaTypeSelector;

export default ReviewMediaTypeSelector;
