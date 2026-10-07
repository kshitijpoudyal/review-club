import {
  PlusIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import React, { useEffect, useRef, useState } from 'react';
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

const CONTROL_HEIGHT = 'h-11';
const CONTROL_RADIUS = 'rounded-xl';

const searchInputClasses =
  `block w-full ${CONTROL_HEIGHT} pl-10 pr-10 ${typography.body} ${CONTROL_RADIUS} ` +
  'bg-white border border-[rgba(196,198,207,0.55)] placeholder-[#74777f] text-[#1b1c19] ' +
  'focus:outline-none focus:border-[#022448] focus:ring-2 focus:ring-[#022448]/20 transition-colors';

const filterInactiveClasses =
  `inline-flex items-center justify-center gap-x-1.5 ${CONTROL_HEIGHT} px-3.5 ${typography.body} ` +
  `${CONTROL_RADIUS} bg-white border border-[rgba(196,198,207,0.45)] text-[#43474e] ` +
  'hover:border-[rgba(196,198,207,0.7)] hover:bg-[#fbf9f3] ' +
  'focus:outline-none focus:border-[#022448] focus:ring-2 focus:ring-[#022448]/20 transition-colors min-w-[8.5rem]';

const filterActiveClasses =
  `inline-flex items-center justify-center gap-x-1.5 ${CONTROL_HEIGHT} px-3.5 ${typography.body} font-medium ` +
  `${CONTROL_RADIUS} bg-[#022448]/8 border border-[#022448]/25 text-[#022448] ` +
  'hover:bg-[#022448]/12 hover:border-[#022448]/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#022448]/20 transition-colors min-w-[8.5rem]';

const primaryButtonClasses =
  `inline-flex items-center justify-center gap-2 ${CONTROL_HEIGHT} px-4 ${typography.button} ${CONTROL_RADIUS} ` +
  'bg-[#022448] text-white hover:bg-[#1a3558] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#022448] focus:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0';

const secondaryButtonClasses =
  `inline-flex items-center justify-center gap-2 ${CONTROL_HEIGHT} px-3 ${typography.button} ${CONTROL_RADIUS} ` +
  'bg-white border border-[rgba(196,198,207,0.45)] text-[#43474e] ' +
  'hover:bg-[#fbf9f3] focus:outline-none focus:ring-2 focus:ring-[#022448]/20 transition-colors flex-shrink-0';

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
        <MagnifyingGlassIcon className="h-[18px] w-[18px] text-[#74777f]" aria-hidden="true" />
      </div>
      <input
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
        className={searchInputClasses}
      />
      {filter.value ? (
        <button
          type="button"
          onClick={() => {
            filter.onChange('');
            searchInputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#74777f] hover:text-[#43474e] transition-colors"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <kbd
          className="hidden lg:flex absolute inset-y-0 right-3 items-center pointer-events-none text-caption text-[#74777f]/50 font-normal"
          aria-hidden="true"
        >
          /
        </kbd>
      )}
    </div>
  );

  const renderSelect = (filter: FilterControlConfig) => {
    const selectedOption = filter.options?.find((option) => option.value === filter.value);
    const isActive = filter.value !== '';
    return (
      <div key={filter.key} className="flex-shrink-0">
        <Menu as="div" className="relative">
          <MenuButton
            className={isActive ? filterActiveClasses : filterInactiveClasses}
            aria-label={filter.label || selectedOption?.label || 'Filter'}
          >
            <span className="truncate max-w-[10rem]">
              {selectedOption?.label || filter.label || 'Select...'}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#022448]/70' : 'text-[#74777f]'}`}
              aria-hidden="true"
            />
          </MenuButton>

          <MenuItems className="absolute left-0 sm:right-0 z-20 mt-1.5 w-52 origin-top-left sm:origin-top-right rounded-xl bg-[#fbf9f3] shadow-[0_8px_24px_rgba(2,36,72,0.08)] ring-1 ring-[rgba(196,198,207,0.25)] focus:outline-none transform transition-all duration-150 data-[closed]:scale-95 data-[closed]:opacity-0 max-h-60 overflow-y-auto filter-scrollbar">
            <div className="py-1">
              {filter.options?.map((option) => (
                <MenuItem key={option.value}>
                  <button
                    type="button"
                    onClick={() => filter.onChange(option.value)}
                    className={`block w-full px-3.5 py-2.5 text-left ${typography.body} transition-colors ${
                      option.value === filter.value
                        ? 'bg-[#022448]/8 text-[#022448] font-medium'
                        : 'text-[#1b1c19] hover:bg-[#eae8e2]'
                    }`}
                  >
                    {option.label}
                  </button>
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Menu>
      </div>
    );
  };

  const renderActions = (forDesktop = false) => {
    const visibleActions = actions.filter((action) => forDesktop || !action.mobileHidden);
    if (visibleActions.length === 0) return null;

    return (
    <div className={`flex items-center gap-2 ${forDesktop ? 'hidden lg:flex' : 'lg:hidden'}`}>
      {visibleActions.map((action, index) => (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            className={
              action.variant === 'secondary'
                ? secondaryButtonClasses
                : action.variant === 'danger'
                  ? `${secondaryButtonClasses} text-[#ba1a1a] border-[#ba1a1a]/25 hover:bg-[#ffdad6]/40`
                  : primaryButtonClasses
            }
            disabled={action.disabled || loading}
          >
            {action.icon ? (
              <span className="flex-shrink-0">{action.icon}</span>
            ) : (
              <PlusIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            <span>{action.label}</span>
          </button>
        ))}
    </div>
    );
  };

  const renderClearFilters = () =>
    showClearButton && hasActiveFilters && onClearFilters ? (
      <button
        type="button"
        onClick={onClearFilters}
        title="Clear all filters"
        aria-label="Clear all filters"
        className={secondaryButtonClasses}
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden xl:inline">Clear</span>
      </button>
    ) : null;

  const ToolbarShimmer = () => (
    <div ref={ref} className="sticky top-0 z-30 bg-[#fbf9f3] pb-2 pt-1">
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="block lg:hidden space-y-3">
          <div className={`${CONTROL_HEIGHT} bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse`} />
          <div className="flex flex-wrap gap-2">
            <div className={`${CONTROL_HEIGHT} w-32 bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse`} />
            <div className={`${CONTROL_HEIGHT} w-28 bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse`} />
          </div>
        </div>
        <div className="hidden lg:flex lg:items-center lg:gap-3 w-full">
          <div className={`${CONTROL_HEIGHT} flex-1 min-w-0 bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse`} />
          <div className={`${CONTROL_HEIGHT} w-32 bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse`} />
          <div className={`${CONTROL_HEIGHT} w-28 bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse`} />
          <div className={`${CONTROL_HEIGHT} w-36 bg-[#eae8e2] ${CONTROL_RADIUS} animate-pulse ml-auto`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <ToolbarShimmer />;
  }

  return (
    <div ref={ref} className="sticky top-0 z-30 bg-[#fbf9f3] pb-2 pt-1">
      <div className="px-4 sm:px-6 lg:px-8 py-2">
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
                className={`flex items-center justify-center ${CONTROL_HEIGHT} w-11 ${CONTROL_RADIUS} border transition-colors flex-shrink-0 ${
                  showMobileFilters || hasActiveFilters
                    ? 'bg-[#022448]/8 text-[#022448] border-[#022448]/25'
                    : 'bg-white text-[#43474e] border-[rgba(196,198,207,0.45)]'
                }`}
                aria-label="Toggle filters"
                aria-expanded={showMobileFilters}
              >
                <AdjustmentsHorizontalIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            )}
          </div>

          {(showMobileFilters || selectFilters.length <= 2) && selectFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selectFilters.map(renderSelect)}
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
            {selectFilters.map(renderSelect)}
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
