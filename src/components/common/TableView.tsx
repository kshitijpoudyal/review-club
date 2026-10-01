import React, { useState, useMemo } from 'react';
import { MobileItemCard, MobileCardSkeleton } from './MobileItemCard';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { Button } from './Button';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  sortable?: boolean;
}

export interface TableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'danger' | 'warn';
}

export interface TableRow {
  id: string | number;
  data: Record<string, React.ReactNode>;
  sortValues?: Record<string, string | number | null>;
  statusColor?: string;
  borderColor?: string;
  className?: string;
  actions?: TableAction[];
}

export interface MobileCardContent {
  headerContent: React.ReactNode;
  financialContent: React.ReactNode;
  actionsContent: React.ReactNode;
  borderColor?: string;
  className?: string;
  noDividers?: boolean;
}

interface TableViewProps {
  // Desktop table props
  columns: TableColumn[];
  rows: TableRow[];
  emptyMessage?: string;
  onClearFilters?: () => void;
  
  // Mobile card props
  mobileCards?: MobileCardContent[];
  
  // Common props
  loading?: boolean;
  loadingRows?: number;
  onRowAction?: (rowId: string | number, action: string) => void;
  
  // Dropdown state management
  activeDropdown?: string | number | null;
  onDropdownToggle?: (rowId: string | number | null) => void;

  /** Adds a blank spacer row/card at the end of the list */
  trailingSpacerRow?: boolean;
}

// Desktop Table Shimmer Loading Components
const TableRowSkeleton: React.FC<{ columns: TableColumn[] }> = ({ columns }) => (
  <tr className="group hover:bg-[#eae8e2]/60 transition-colors duration-150">
    {columns.map((column, index) => (
      <td 
        key={`skeleton-${index}`}
        className={`px-6 py-5 ${
          column.align === 'right' ? 'text-right' : 
          column.align === 'center' ? 'text-center' : 'text-left'
        }`}
      >
        {index === 0 ? (
          <div className="flex items-start space-x-3">
            <div className={`w-1 h-12 rounded-full flex-shrink-0 ${colors.loading.skeleton}`}></div>
            <div className="flex-1 min-w-0">
              <div className={`h-5 ${colors.loading.skeleton} rounded-full w-3/4 mb-1`}></div>
              <div className={`h-3 ${colors.loading.skeleton} rounded-full w-1/2`}></div>
            </div>
          </div>
        ) : column.key === 'actions' ? (
          <div className="flex justify-center">
            <div className={`w-8 h-8 ${colors.loading.skeleton} rounded-full`}></div>
          </div>
        ) : (
          <div className={`h-5 ${colors.loading.skeleton} rounded-full ${
            column.align === 'right' ? 'w-16 ml-auto' : 'w-3/4'
          }`}></div>
        )}
      </td>
    ))}
  </tr>
);

const TableLoadingView: React.FC<{ columns: TableColumn[]; loadingRows?: number }> = ({ 
  columns, 
  loadingRows = 6 
}) => (
  <>
    {/* Mobile Loading Layout */}
    <div className="block md:hidden space-y-2">
      {Array.from({ length: loadingRows }).map((_, index) => (
        <MobileCardSkeleton key={`mobile-skeleton-${index}`} />
      ))}
    </div>

    {/* Desktop Loading Layout */}
    <div className="hidden md:block">
      <div className="overflow-hidden border border-[rgba(196,198,207,0.15)] bg-[#fbf9f3] shadow-navy rounded-2xl">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hidden pb-1">
          <table className="w-full table-fixed">
            {/* Table Header */}
            <thead className={`${colors.background.gradient} border-b border-[rgba(196,198,207,0.1)] sticky top-0 z-10`}>
              <tr>
                {columns.map((column) => (
                  <th
                    key={`header-${column.key}`}
                    className={`px-4 py-3 lg:px-6 lg:py-4 ${typography.tableHeader} ${
                      column.align === 'right' ? 'text-right' : 
                      column.align === 'center' ? 'text-center' : 'text-left'
                    } ${column.width || ''} ${column.className || ''}`}
                  >
                    <div className={`h-4 ${colors.loading.skeleton} rounded-full w-3/4 ${
                      column.align === 'right' ? 'ml-auto' : 
                      column.align === 'center' ? 'mx-auto' : ''
                    }`}></div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[rgba(196,198,207,0.1)]">
              {Array.from({ length: loadingRows }).map((_, index) => (
                <TableRowSkeleton key={`row-skeleton-${index}`} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

export const TableView: React.FC<TableViewProps> = ({
  columns,
  rows,
  mobileCards,
  emptyMessage = "No data found matching your criteria.",
  onClearFilters,
  loading = false,
  loadingRows = 6,
  activeDropdown,
  onDropdownToggle,
  trailingSpacerRow = false,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSortClick = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a.sortValues?.[sortKey] ?? null;
      const bv = b.sortValues?.[sortKey] ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  if (loading) {
    return <TableLoadingView columns={columns} loadingRows={loadingRows} />;
  }

  if (rows.length === 0 && (!mobileCards || mobileCards.length === 0)) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto mb-4 w-12 h-12 text-[#c4c6cf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-[#74777f] text-base">{emptyMessage}</p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-br from-[#022448] to-[#1e3a5f] text-white shadow-[0_4px_12px_rgba(2,36,72,0.15)] hover:shadow-[0_6px_16px_rgba(2,36,72,0.22)] active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-2">
        {mobileCards?.map((card, index) => (
          <MobileItemCard
            key={index}
            headerContent={card.headerContent}
            financialContent={card.financialContent}
            actionsContent={card.actionsContent}
            borderColor={card.borderColor}
            className={card.className}
            noDividers={card.noDividers}
          />
        ))}
        {trailingSpacerRow && (mobileCards?.length ?? 0) > 0 && (
          <div aria-hidden="true" className="h-16" />
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        <div className={`overflow-hidden border border-[rgba(196,198,207,0.15)] ${colors.background.primary} shadow-navy rounded-2xl`}>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hidden pb-1">
            <table className="w-full table-fixed">
              {/* Table Header */}
              <thead className={`${colors.background.gradient} border-b border-[rgba(196,198,207,0.1)] sticky top-0 z-10`}>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      onClick={column.sortable ? () => handleSortClick(column.key) : undefined}
                      className={`py-3 lg:py-4 ${typography.tableHeader} ${
                        column.key === 'actions'
                          ? 'px-3 lg:px-4 text-center'
                          : `px-4 lg:px-6 ${
                              column.align === 'right' ? 'text-right' :
                              column.align === 'center' ? 'text-center' : 'text-left'
                            }`
                      } ${column.width || ''} ${column.className || ''} ${column.sortable ? 'cursor-pointer select-none hover:text-white' : ''}`}
                    >
                      {column.key === 'actions' ? (
                        <span className="block w-full text-center">{column.label}</span>
                      ) : column.sortable ? (
                        <span className="inline-flex items-center gap-1">
                          {column.label}
                          <span className="opacity-60">
                            {sortKey === column.key
                              ? sortDir === 'asc' ? '↑' : '↓'
                              : '↕'}
                          </span>
                        </span>
                      ) : column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[rgba(196,198,207,0.1)]">
                {sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`group hover:bg-[#eae8e2]/60 transition-colors duration-150 ${row.className || ''} ${
                      activeDropdown === row.id ? 'relative z-30' : ''
                    }`}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${row.id}-${column.key}`}
                        className={`${
                          column.align === 'right' ? 'text-right' : 
                          column.align === 'center' ? 'text-center' : 'text-left'
                        } ${column.width || ''} ${column.className || ''}`}
                      >
                        {/* Status indicator bar for first column */}
                        {colIndex === 0 && row.borderColor && (
                          <div className="flex items-stretch gap-3 my-4">
                            <div className={`self-stretch min-h-12 w-0 flex-shrink-0 border-l-4 ${row.borderColor}`} />
                            <div className="flex flex-1 min-w-0 items-center">
                              {row.data[column.key]}
                            </div>
                          </div>
                        )}
                        
                        {/* Regular content */}
                        {colIndex !== 0 && row.data[column.key]}
                        
                        {/* Actions dropdown */}
                        {column.key === 'actions' && row.actions && (
                          <div className="relative dropdown-container flex justify-center py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDropdownToggle?.(row.id)}
                              icon={
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              }
                              title="More actions"
                            />

                            {activeDropdown === row.id && (
                              <div className="absolute right-0 top-full mt-2 w-52 bg-[#fbf9f3] rounded-2xl shadow-[0_12px_32px_rgba(2,36,72,0.10)] z-50 py-2 border border-[rgba(196,198,207,0.15)]">
                                {row.actions.map((action, actionIndex) => (
                                  <button
                                    key={actionIndex}
                                    onClick={() => {
                                      action.onClick();
                                      onDropdownToggle?.(null);
                                    }}
                                    className={`flex items-center justify-start text-left w-full px-4 py-2.5 text-sm transition-colors ${
                                      action.variant === 'danger'
                                        ? 'text-[#ba1a1a] hover:bg-[#ffdad6]'
                                        : action.variant === 'warn'
                                          ? 'text-amber-700 hover:bg-amber-50'
                                          : 'text-[#1b1c19] hover:bg-[#eae8e2]'
                                    } ${action.className || ''}`}
                                  >
                                    {action.icon && (
                                      <span className={`w-4 h-4 mr-3 ${action.variant === 'danger' ? 'text-[#ba1a1a]' : action.variant === 'warn' ? 'text-amber-600' : 'text-[#74777f]'}`}>
                                        {action.icon}
                                      </span>
                                    )}
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {trailingSpacerRow && sortedRows.length > 0 && (
                  <tr aria-hidden="true" className="pointer-events-none">
                    <td colSpan={columns.length} className="h-16" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};