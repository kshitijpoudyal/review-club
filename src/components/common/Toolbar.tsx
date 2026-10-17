import {
  PlusIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { typography } from '../../utils/typography';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterControlConfig {
  type: 'search' | 'select';
  key: string;
  label?: string;
  placeholder?: string;
  options?: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Max width class for search inputs, e.g. max-w-[580px] */
  maxWidth?: string;
}

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string | React.ReactElement;
  disabled?: boolean;
  mobileHidden?: boolean;
}

interface ToolbarProps {
  filters: FilterControlConfig[];
  actions: ActionButton[];
  onClearFilters?: () => void;
  showClearButton?: boolean;
  loading?: boolean;
}

// Sits flush under the header (3.25rem + its 1px hairline). The fade below is
// a scroll-edge effect: rows dissolve into the bar instead of hitting a line.
const STICKY_BAR =
  'sticky top-[calc(3.25rem+1px+env(safe-area-inset-top))] z-30 bg-background pb-1 pt-1 ' +
  "after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-gradient-to-b after:from-background after:to-transparent after:content-['']";

const CONTROL_HEIGHT = 'h-11';
const CONTROL_RADIUS = 'rounded-xl';

const filterTriggerClasses =
  `inline-flex items-center justify-center gap-x-1.5 ${CONTROL_HEIGHT} px-3.5 ${typography.body} ` +
  `${CONTROL_RADIUS} border transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] active:duration-75 min-w-[8.5rem] ` +
  'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20';

const filterInactiveClasses =
  'bg-card border-input/50 text-foreground hover:bg-secondary/60 ' +
  'data-[state=open]:border-ring';

const filterActiveClasses =
  'font-medium bg-primary/8 border-primary/25 text-primary hover:bg-primary/12 hover:border-primary/35';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(({
  filters,
  actions,
  onClearFilters,
  showClearButton = true,
  loading = false,
}, ref) => {
  const searchFilter = filters.find((f) => f.type === 'search');
  const selectFilters = filters.filter((f) => f.type === 'select');
  const hasActiveFilters = filters.some((f) => f.value && f.value !== '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderSearch = (filter: FilterControlConfig) => (
    <div
      key={filter.key}
      className="relative w-full min-w-0 flex-1"
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
      </div>
      <Input
        ref={searchInputRef}
        type="text"
        role="searchbox"
        inputMode="search"
        aria-label={filter.placeholder || 'Search'}
        placeholder={filter.placeholder || 'Search...'}
        value={filter.value}
        onChange={(e) => filter.onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            if (filter.value) {
              filter.onChange('');
            } else {
              searchInputRef.current?.blur();
            }
          }
        }}
        className="px-10"
      />
      {filter.value ? (
        <button
          type="button"
          onClick={() => {
            filter.onChange('');
            searchInputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-on-surface-variant active:opacity-60 transition-opacity"
        >
          <span className="flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-muted-foreground/40 text-card">
            <XMarkIcon className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          </span>
        </button>
      ) : (
        <kbd
          className="hidden lg:flex absolute inset-y-0 right-3 items-center pointer-events-none text-caption text-muted-foreground/50 font-normal"
          aria-hidden="true"
        >
          /
        </kbd>
      )}
    </div>
  );

  const renderSelect = (filter: FilterControlConfig, inGrid = false) => {
    const selectedOption = filter.options?.find((option) => option.value === filter.value);
    const isActive = filter.value !== '';
    return (
      <div key={filter.key} className={inGrid ? 'min-w-0' : 'flex-shrink-0'}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(filterTriggerClasses, isActive ? filterActiveClasses : filterInactiveClasses, inGrid && 'w-full min-w-0 justify-between')}
            aria-label={filter.label || selectedOption?.label || 'Filter'}
          >
            <span className="truncate max-w-[10rem]">
              {selectedOption?.label || filter.label || 'Select...'}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-52 max-h-60 filter-scrollbar">
            {filter.options?.map((option) => {
              const isSelected = option.value === filter.value;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => filter.onChange(option.value)}
                  className={cn('justify-between', isSelected && 'bg-primary/8 text-primary font-medium')}
                >
                  {option.label}
                  {isSelected && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderActions = (forDesktop = false) => {
    const visibleActions = actions.filter((action) => forDesktop || !action.mobileHidden);
    if (visibleActions.length === 0) return null;

    return (
    <div className={forDesktop ? 'hidden lg:flex items-center gap-2' : 'col-span-2 flex items-center gap-2 lg:hidden [&>button]:flex-1'}>
      {visibleActions.map((action, index) => (
          <Button
            key={index}
            type="button"
            size="control"
            variant={action.variant === 'secondary' || action.variant === 'danger' ? 'outline' : 'default'}
            onClick={action.onClick}
            className={cn(
              'flex-shrink-0',
              action.variant !== undefined && action.variant !== 'primary' && 'px-3',
              action.variant === 'danger' && 'text-destructive border-destructive/25 hover:bg-destructive-container/40 hover:text-destructive'
            )}
            disabled={action.disabled || loading}
          >
            {action.icon ? (
              <span className="flex-shrink-0">{action.icon}</span>
            ) : (
              <PlusIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            <span>{action.label}</span>
          </Button>
        ))}
    </div>
    );
  };

  const renderClearFilters = () =>
    showClearButton && hasActiveFilters && onClearFilters ? (
      <Button
        type="button"
        variant="outline"
        size="control"
        onClick={onClearFilters}
        title="Clear all filters"
        aria-label="Clear all filters"
        className="flex-shrink-0 px-3"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        <span className="lg:hidden xl:inline">Clear</span>
      </Button>
    ) : null;

  const ToolbarShimmer = () => (
    <div ref={ref} className={STICKY_BAR}>
      <div className="page-gutter py-2">
        <div className="block lg:hidden space-y-3">
          <Skeleton className={`${CONTROL_HEIGHT} bg-secondary ${CONTROL_RADIUS}`} />
          <div className="flex flex-wrap gap-2">
            <Skeleton className={`${CONTROL_HEIGHT} w-32 bg-secondary ${CONTROL_RADIUS}`} />
            <Skeleton className={`${CONTROL_HEIGHT} w-28 bg-secondary ${CONTROL_RADIUS}`} />
          </div>
        </div>
        <div className="hidden lg:flex lg:items-center lg:gap-3 w-full">
          <Skeleton className={`${CONTROL_HEIGHT} flex-1 min-w-0 bg-secondary ${CONTROL_RADIUS}`} />
          <Skeleton className={`${CONTROL_HEIGHT} w-32 bg-secondary ${CONTROL_RADIUS}`} />
          <Skeleton className={`${CONTROL_HEIGHT} w-28 bg-secondary ${CONTROL_RADIUS}`} />
          <Skeleton className={`${CONTROL_HEIGHT} w-36 bg-secondary ${CONTROL_RADIUS} ml-auto`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <ToolbarShimmer />;
  }

  return (
    <div ref={ref} className={STICKY_BAR}>
      <div className="page-gutter py-2">
        {/* Mobile */}
        <div className="lg:hidden space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {searchFilter && renderSearch(searchFilter)}
            </div>
            {selectFilters.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMobileFilters((v) => !v)}
                className={`pressable flex items-center justify-center ${CONTROL_HEIGHT} w-11 ${CONTROL_RADIUS} border flex-shrink-0 ${
                  showMobileFilters || hasActiveFilters
                    ? 'bg-primary/8 text-primary border-primary/25'
                    : 'bg-card text-on-surface-variant border-input/50'
                }`}
                aria-label="Toggle filters"
                aria-expanded={showMobileFilters}
              >
                <AdjustmentsHorizontalIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Two filters per row; the clear button and actions span the width */}
          {(showMobileFilters || selectFilters.length <= 2) && selectFilters.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {selectFilters.map((filter) => renderSelect(filter, true))}
              {renderClearFilters()}
              {renderActions()}
            </div>
          )}

          {!showMobileFilters && selectFilters.length > 2 && (
            <div className="flex items-center justify-between gap-2">
              {renderClearFilters()}
              {renderActions()}
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex lg:items-center lg:gap-3 w-full">
          {searchFilter && renderSearch(searchFilter)}

          <div className="flex items-center gap-2 flex-shrink-0">
            {selectFilters.map((filter) => renderSelect(filter))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {renderClearFilters()}
            {renderActions(true)}
          </div>
        </div>
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;
