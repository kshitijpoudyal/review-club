import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { STAGGER_LIMIT } from '@/lib/motion';
import { MobileItemCard, MobileCardSkeleton } from './MobileItemCard';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { ArrowDown, ArrowUp, ChevronsUpDown, MoreVertical, PackageOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow as UITableRow } from '@/components/ui/table';

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

  /** Adds a blank spacer row/card at the end of the list */
  trailingSpacerRow?: boolean;
}

const MotionTableRow = motion.create(UITableRow);

// Desktop Table Shimmer Loading Components
const TableRowSkeleton: React.FC<{ columns: TableColumn[] }> = ({ columns }) => (
  <UITableRow className="group">
    {columns.map((column, index) => (
      <TableCell 
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
      </TableCell>
    ))}
  </UITableRow>
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
      <div className="overflow-hidden border border-border/60 bg-card shadow-soft rounded-2xl">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hidden pb-1">
          <Table className="w-full table-fixed">
            {/* Table Header */}
            <TableHeader className={`bg-muted/95 backdrop-blur border-b border-border sticky top-0 z-10`}>
              <UITableRow>
                {columns.map((column) => (
                  <TableHead
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
                  </TableHead>
                ))}
              </UITableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-input/10">
              {Array.from({ length: loadingRows }).map((_, index) => (
                <TableRowSkeleton key={`row-skeleton-${index}`} columns={columns} />
              ))}
            </TableBody>
          </Table>
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
  trailingSpacerRow = false,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Rows rise in on the first paint after loading; later filter and sort
  // changes swap content without replaying the entrance.
  const hasEntered = useRef(false);
  useEffect(() => {
    if (!loading) hasEntered.current = true;
  }, [loading]);
  const entrance = (index: number) => {
    const animated = !hasEntered.current && index < STAGGER_LIMIT;
    return {
      // `animate` stays constant so a re-render mid-entrance can't strand a row hidden
      initial: animated ? { opacity: 0, y: 10 } : (false as const),
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.32, delay: animated ? 0.04 * index : 0, ease: [0.22, 1, 0.36, 1] as const },
    };
  };

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
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary">
          <PackageOpen className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <p className={`${typography.sectionTitle} font-display`}>Nothing here yet</p>
        <p className="mt-1 text-muted-foreground text-sm">{emptyMessage}</p>
        {onClearFilters && (
          <Button onClick={onClearFilters} className="mt-4 px-5 font-semibold">
            <X className="w-4 h-4" />
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-2">
        {mobileCards?.map((card, index) => (
          <motion.div key={index} {...entrance(index)}>
            <MobileItemCard
              headerContent={card.headerContent}
              financialContent={card.financialContent}
              actionsContent={card.actionsContent}
              borderColor={card.borderColor}
              className={card.className}
              noDividers={card.noDividers}
            />
          </motion.div>
        ))}
        {trailingSpacerRow && (mobileCards?.length ?? 0) > 0 && (
          <div aria-hidden="true" className="h-16" />
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        <div className={`overflow-hidden border border-border/60 bg-card shadow-soft rounded-2xl`}>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hidden pb-1">
            <Table className="w-full table-fixed">
              {/* Table Header */}
              <TableHeader className={`bg-muted/95 backdrop-blur border-b border-border sticky top-0 z-10`}>
                <UITableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      onClick={column.sortable ? () => handleSortClick(column.key) : undefined}
                      className={`py-3 ${typography.tableHeader} ${
                        column.key === 'actions'
                          ? 'px-3 lg:px-4 text-center'
                          : `px-4 lg:px-6 ${
                              column.align === 'right' ? 'text-right' :
                              column.align === 'center' ? 'text-center' : 'text-left'
                            }`
                      } ${column.width || ''} ${column.className || ''} ${column.sortable ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''}`}
                    >
                      {column.key === 'actions' ? (
                        <span className="block w-full text-center">{column.label}</span>
                      ) : column.sortable ? (
                        <span className="inline-flex items-center gap-1">
                          {column.label}
                          {sortKey === column.key
                            ? sortDir === 'asc'
                              ? <ArrowUp className="h-3.5 w-3.5" />
                              : <ArrowDown className="h-3.5 w-3.5" />
                            : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
                        </span>
                      ) : column.label}
                    </TableHead>
                  ))}
                </UITableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-input/10">
                {sortedRows.map((row, rowIndex) => (
                  <MotionTableRow
                    key={row.id}
                    className={cn('group', row.className)}
                    {...entrance(rowIndex)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell
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
                          <div className="flex justify-center py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="More actions" aria-label="More actions">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                {row.actions.map((action, actionIndex) => (
                                  <DropdownMenuItem
                                    key={actionIndex}
                                    onSelect={action.onClick}
                                    className={cn(
                                      action.variant === 'danger' && 'text-destructive focus:bg-destructive-container focus:text-destructive',
                                      action.variant === 'warn' && 'text-status-amber-fg focus:bg-status-amber/10 focus:text-status-amber-fg',
                                      action.className
                                    )}
                                  >
                                    {action.icon && (
                                      <span className={`w-4 h-4 mr-1 ${action.variant === 'danger' ? 'text-destructive' : action.variant === 'warn' ? 'text-status-amber-fg' : 'text-muted-foreground'}`}>
                                        {action.icon}
                                      </span>
                                    )}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </MotionTableRow>
                ))}
                {trailingSpacerRow && sortedRows.length > 0 && (
                  <UITableRow aria-hidden="true" className="pointer-events-none">
                    <TableCell colSpan={columns.length} className="h-16" />
                  </UITableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
};