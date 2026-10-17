
import React from 'react';
import { colors } from '../../utils/colors';
import { usePressFeedback } from '../../hooks/usePressFeedback';

interface MobileItemCardProps {
  headerContent: React.ReactNode;
  financialContent: React.ReactNode;
  actionsContent: React.ReactNode;
  borderColor?: string;
  className?: string;
  noDividers?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const MobileItemCard: React.FC<MobileItemCardProps> = ({
  headerContent,
  financialContent,
  actionsContent,
  borderColor = 'border-l-primary',
  className = '',
  noDividers = false,
  onClick,
}) => {
  const divider = noDividers ? '' : 'border-t border-border/60';
  const backgroundClass = className.includes('bg-') ? '' : 'bg-card';
  const { pressed, handlers } = usePressFeedback(!!onClick);

  return (
    <div onClick={onClick} {...handlers} className={`
      ${backgroundClass}
      ${onClick ? 'cursor-pointer' : ''}
      transition-[transform,filter] ease-out ${pressed ? 'scale-[0.985] brightness-[0.97] duration-75 motion-reduce:scale-100' : 'duration-200'}
      shadow-soft
      rounded-2xl
      border border-border/60 border-l-4 ${borderColor}
      mx-0 mb-3
      ${className}
    `}>
      {/* Header Section */}
      <div className="px-4 pt-5 pb-4">
        <div className="w-full">
          {headerContent}
        </div>
      </div>

      {/* Financial Section — only rendered if content provided */}
      {financialContent && (
        <div className={`px-4 py-3 ${divider}`}>
          {financialContent}
        </div>
      )}

      {/* Actions Section — only rendered if content provided */}
      {actionsContent && (
        <div className={`px-4 py-3 ${divider} rounded-b-2xl`}>
          <div className="flex justify-end items-center">
            {actionsContent}
          </div>
        </div>
      )}
    </div>
  );
};

export const MobileCardSkeleton: React.FC = () => (
  <div className={`
    bg-card
    shadow-soft
    rounded-2xl
    border border-border/60 border-l-4 border-l-surface-variant
    mx-0 mb-3
  `}>
    {/* Header Section */}
    <div className="px-4 pt-4 pb-3">
      <div className="w-full">
        <div className={`h-6 ${colors.loading.skeleton} rounded-full mb-2 w-3/4`}></div>
        <div className={`h-4 ${colors.loading.skeleton} rounded-full w-1/3 mb-2`}></div>
        <div className="flex flex-col items-end space-y-2 mt-2">
          <div className={`h-6 ${colors.loading.skeleton} rounded-full w-16`}></div>
          <div className={`h-5 ${colors.loading.skeleton} rounded-full w-12`}></div>
        </div>
      </div>
    </div>

    {/* Financial Section */}
    <div className="px-4 py-3 border-t border-border/60">
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[0, 1, 2].map((i) => (
          <div key={i} className="text-center">
            <div className={`h-4 ${colors.loading.skeleton} rounded-full mb-1`}></div>
            <div className={`h-5 ${colors.loading.skeleton} rounded-full`}></div>
          </div>
        ))}
      </div>
    </div>

    {/* Actions Section */}
    <div className="px-4 py-3 border-t border-border/60">
      <div className="flex justify-end items-center">
        <div className={`w-8 h-8 ${colors.loading.skeleton} rounded-full`}></div>
      </div>
    </div>
  </div>
);