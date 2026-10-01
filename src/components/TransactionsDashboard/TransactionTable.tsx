import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../../types/Transaction';
import { Product, ProductLinkOptions } from '../../types/Product';
import ProductLinkModal from '../ProductLinkModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import { TableView, TableColumn, TableRow, MobileCardContent } from '../common/TableView';
import { ProductThumbnail } from '../common';
import { 
  colors, 
  getFinancialColor, 
  getBadgeClasses
} from '../../utils/colors';
import { typography } from '../../utils/typography';
import { formatCurrency } from '../../utils/currency';

interface TransactionTableProps {
  transactions: Transaction[];
  products: Product[];
  loading?: boolean;
  productsLoading?: boolean;
  onUpdateProductLink?: (transactionId: string, productIds: string[], options?: ProductLinkOptions) => Promise<boolean>;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => Promise<boolean>;
}

function LinkedProductLinkContent({
  linkedIds,
  products,
}: {
  linkedIds: string[];
  products: Product[];
}) {
  const linkedProducts = linkedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product != null);

  const firstProduct = linkedProducts[0];
  const label =
    linkedProducts.length <= 1
      ? firstProduct?.item || 'Product linked'
      : `${firstProduct?.item || 'Product linked'} + ${linkedProducts.length - 1} more`;

  const thumbProducts = linkedProducts.slice(0, 3);
  const overflowThumbCount = linkedProducts.length - 3;

  return (
    <div className="flex items-center gap-2 min-w-0 w-full px-1">
      <div className="flex items-center gap-1 flex-shrink-0">
        {thumbProducts.map((product, index) => (
          <ProductThumbnail
            key={product.id || index}
            imageUrl={product.imageUrl}
            productName={product.item}
            size="sm"
            className="!w-10 !h-10"
          />
        ))}
        {overflowThumbCount > 0 && (
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#eae8e2] text-[#43474e] text-xs font-medium flex-shrink-0"
            aria-hidden="true"
          >
            +{overflowThumbCount}
          </span>
        )}
      </div>
      <span className="truncate text-sm font-medium text-[#43474e] min-w-0">{label}</span>
    </div>
  );
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  products = [],
  loading = false,
  onDeleteTransaction,
  onEditTransaction,
  onUpdateProductLink
}) => {

  // Calculate which product IDs are already linked to transactions
  const linkedProductIds = useMemo(() => {
    return transactions
      .flatMap(t => t.linkedProductIds || [])
      .filter((id): id is string => id !== null && id !== undefined);
  }, [transactions]);

  const [showDropdown, setShowDropdown] = useState<string | number | null>(null);
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    // Sort transactions with unlinked ones first
    return [...transactions].sort((a, b) => {
      const aLinked = !!(a.linkedProductIds && a.linkedProductIds.length > 0);
      const bLinked = !!(b.linkedProductIds && b.linkedProductIds.length > 0);

      if (aLinked !== bLinked) {
        return aLinked ? 1 : -1; // Unlinked (false) comes first
      }

      // Sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions]);



  const openLinkModal = (transactionId: string) => {
    setIsModalActive(true);
    setActiveTransactionId(transactionId);
  };

  const getLinkedProductLabel = (linkedIds: string[]) => {
    if (linkedIds.length === 1) {
      const p = products.find((product) => product.id === linkedIds[0]);
      return p?.item || 'Product linked';
    }
    return `${linkedIds.length} products linked`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Define table columns — fixed widths on compact cols; Name absorbs remainder
  const columns: TableColumn[] = [
    {
      key: 'datetime',
      label: `Date/Time (${filteredAndSortedTransactions.length})`,
      align: 'left',
      sortable: true,
      width: 'w-32 lg:w-36',
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      align: 'left',
      width: 'w-40 lg:w-44',
    },
    {
      key: 'name',
      label: 'Name',
      align: 'left',
      sortable: true,
      width: 'w-36 lg:w-40',
      className: 'min-w-0',
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      width: 'w-20 lg:w-24',
      className: 'tabular-nums',
    },
    {
      key: 'fees',
      label: 'Fees',
      align: 'right',
      sortable: true,
      width: 'w-20 lg:w-24',
      className: 'tabular-nums',
    },
    {
      key: 'netReceived',
      label: 'Net Received',
      align: 'right',
      sortable: true,
      width: 'w-24 lg:w-28',
      className: 'tabular-nums',
    },
    {
      key: 'productLink',
      label: 'Product Link',
      align: 'left',
      width: 'w-80 lg:w-[24rem]',
      className: 'min-w-0 pl-3 lg:pl-4',
    },
    ...(onDeleteTransaction || onUpdateProductLink || onEditTransaction ? [{
      key: 'actions',
      label: 'Actions',
      align: 'center' as const,
      width: 'w-24',
    }] : []),
  ];

  // Transform transactions into table rows
  const rows: TableRow[] = filteredAndSortedTransactions.map((transaction, index) => {
    const isLinked = !!(transaction.linkedProductIds && transaction.linkedProductIds.length > 0);

    return {
      id: transaction.id || index,
      borderColor: isLinked ? 'border-l-[#0070BA]/30' : 'border-l-amber-500',
      className: '',
      sortValues: {
        datetime: transaction.date || '',
        name: transaction.name || '',
        amount: transaction.amount ?? null,
        fees: transaction.fees ?? null,
        netReceived: transaction.total ?? null,
      },
      data: {
        datetime: (
          <div className='flex flex-col'>
            <div className="font-medium">{formatDate(transaction.date)}</div>
            <div className={colors.text.muted}>{transaction.time}</div>
          </div>
        ),
        transactionId: (
          <span className={`${colors.text.muted} ${typography.caption} tabular-nums whitespace-nowrap`}>
            {transaction.transactionId}
          </span>
        ),
        name: (
          <div className="flex flex-col min-w-0">
            <div className="font-medium truncate">{transaction.name}</div>
            {transaction.itemTitle && (
              <div className={`${colors.text.muted} text-xs truncate`}>
                {transaction.itemTitle}
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {isLinked ? (
                <span className={getBadgeClasses('linked')}>
                  {transaction.linkedProductIds!.length === 1 ? 'Linked' : `${transaction.linkedProductIds!.length} Linked`}
                </span>
              ) : (
                <span className={getBadgeClasses('unlinked')}>Unlinked</span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#43474e]/8 text-[#43474e] text-xs font-medium">
                {transaction.paymentMethod ?? 'PayPal'}
              </span>
            </div>
          </div>
        ),
        amount: (
          <span className={`${typography.numericStrong} ${colors.financial.neutral}`}>
            {formatCurrency(transaction.amount)}
          </span>
        ),
        fees: (
          <span className={`${typography.numericStrong} ${colors.financial.negative}`}>
            {formatCurrency(transaction.fees)}
          </span>
        ),
        netReceived: (
          <span className={`${typography.numericStrong} ${getFinancialColor(transaction.total)}`}>
            {formatCurrency(transaction.total)}
          </span>
        ),
        productLink: (
          <div className="min-w-0 w-full">
            {onUpdateProductLink ? (
              isLinked ? (
                <LinkedProductLinkContent
                  linkedIds={transaction.linkedProductIds!}
                  products={products}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => transaction.id && openLinkModal(transaction.id)}
                  disabled={loading}
                  className={`group flex items-center gap-2 min-w-0 w-full max-w-full px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 bg-amber-500/10 text-amber-800 border border-amber-500/25 hover:bg-amber-500/15 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="flex-shrink-0 text-base leading-none">○</span>
                  <span className="truncate min-w-0 flex-1 text-left">Link product…</span>
                  <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )
            ) : (
              <span className="text-sm text-[#74777f]">No link action available</span>
            )}
          </div>
        ),
        actions: null // Will be handled by the actions array below
      },
      actions: (() => {
        const rowActions = [
          ...(onEditTransaction ? [{
            label: 'Edit transaction',
            icon: (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.828 2.828 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: () => onEditTransaction(transaction),
          }] : []),
          ...(onUpdateProductLink && isLinked ? [{
            label: 'Edit link',
            icon: (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            ),
            onClick: () => {
              if (transaction.id) openLinkModal(transaction.id);
            },
          }] : []),
          ...(onDeleteTransaction ? [{
            label: 'Delete Transaction',
            variant: 'danger' as const,
            icon: (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ),
            onClick: async () => {
              setDeleteTarget(transaction);
            },
          }] : []),
        ];
        return rowActions.length > 0 ? rowActions : undefined;
      })(),
    };
  });

  // Mobile cards data
  const mobileCards: MobileCardContent[] = filteredAndSortedTransactions.map((transaction, index) => {
    const isLinked = !!(transaction.linkedProductIds && transaction.linkedProductIds.length > 0);

    const headerContent = (
      <div className="space-y-3">
        {/* Status + Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isLinked ? (
              <span className={getBadgeClasses('linked')}>
                {transaction.linkedProductIds!.length === 1 ? 'Linked' : `${transaction.linkedProductIds!.length} Linked`}
              </span>
            ) : (
              <span className={getBadgeClasses('unlinked')}>Unlinked</span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#43474e]/8 text-[#43474e] text-xs font-medium">
              {transaction.paymentMethod ?? 'PayPal'}
            </span>
          </div>
          <span className={`text-xs ${colors.text.muted}`}>{formatDate(transaction.date)}</span>
        </div>

        {/* Amount + Name + Transaction ID */}
        <div>
          <p className={`text-sm ${colors.text.secondary} mt-0.5`}>{transaction.name}</p>
          <p className={`${typography.caption} tabular-nums ${colors.text.muted} mt-0.5`}>{transaction.transactionId}</p>
        </div>

        {/* All prices on one line */}
        <div className="flex items-end gap-5">
          <div>
            <p className={`text-xs ${colors.text.muted} mb-0.5`}>Amount</p>
            <p className={`${typography.numericStrong} ${getFinancialColor(transaction.amount)}`}>{formatCurrency(transaction.amount)}</p>
          </div>
          <div>
            <p className={`text-xs ${colors.text.muted} mb-0.5`}>Fees</p>
            <p className={`text-sm font-semibold ${colors.financial.negative}`}>{formatCurrency(transaction.fees)}</p>
          </div>
          <div>
            <p className={`text-xs ${colors.text.muted} mb-0.5`}>Net</p>
            <p className={`text-sm font-semibold ${getFinancialColor(transaction.total)}`}>{formatCurrency(transaction.total)}</p>
          </div>
        </div>

        {/* Footer: product link + dots menu */}
        <div className="flex items-center justify-between pt-1 gap-3">
          {onUpdateProductLink && !isLinked ? (
            <button
              type="button"
              onClick={() => transaction.id && openLinkModal(transaction.id)}
              disabled={loading}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors truncate max-w-[75%] text-[#9e9e9e] hover:text-[#74777f] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>○</span>
              <span className="truncate">Link product…</span>
              <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : (
            <span
              className={`truncate text-sm font-medium min-w-0 ${
                isLinked ? 'text-[#43474e]' : 'text-[#9e9e9e]'
              }`}
            >
              {isLinked ? getLinkedProductLabel(transaction.linkedProductIds!) : 'Not linked'}
            </span>
          )}

          {(onDeleteTransaction || onEditTransaction || (onUpdateProductLink && isLinked)) && (
            <div className="relative dropdown-container flex-shrink-0">
              <button
                onClick={() => setShowDropdown(showDropdown === index ? null : index)}
                className={`flex items-center justify-center w-8 h-8 ${colors.button.secondary} rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#022448]`}
                title="More actions"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showDropdown === index && (
                <div className="absolute right-0 top-full mt-2 bg-[#fbf9f3] border border-[rgba(196,198,207,0.15)] rounded-2xl shadow-[0_12px_32px_rgba(2,36,72,0.10)] z-50 min-w-[160px] py-2">
                  {onEditTransaction && (
                    <button
                      onClick={() => {
                        onEditTransaction(transaction);
                        setShowDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-[#1b1c19] hover:bg-[#eae8e2] transition-colors"
                    >
                      Edit transaction
                    </button>
                  )}
                  {onUpdateProductLink && isLinked && (
                    <button
                      onClick={() => {
                        if (transaction.id) openLinkModal(transaction.id);
                        setShowDropdown(null);
                      }}
                      disabled={loading}
                      className="block w-full text-left px-4 py-2.5 text-sm text-[#1b1c19] hover:bg-[#eae8e2] transition-colors disabled:opacity-50"
                    >
                      Edit link
                    </button>
                  )}
                  {onDeleteTransaction && (
                    <button
                      onClick={() => { setDeleteTarget(transaction); setShowDropdown(null); }}
                      className={`block w-full text-left px-4 py-2.5 text-sm ${colors.modal.danger} transition-colors`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    const financialContent = null;
    const actionsContent = null;

    return {
      headerContent,
      financialContent,
      actionsContent,
      borderColor: isLinked ? 'border-l-[#006a68]' : 'border-l-amber-500',
      noDividers: true,
      className: ''
    };
  });

  return (
    <>
      <TableView
        columns={columns}
        rows={rows}
        mobileCards={mobileCards}
        emptyMessage="No transactions found."
        loading={loading}
        activeDropdown={showDropdown}
        onDropdownToggle={(rowId) => setShowDropdown(prev => prev === rowId ? null : rowId as number)}
        trailingSpacerRow
      />
      
      {/* Product Link Modal */}
      {isModalActive && activeTransactionId && (
        <ProductLinkModal
          products={products}
          selectedProductIds={
            transactions.find(t => t.id === activeTransactionId)?.linkedProductIds || []
          }
          onProductSelect={async (productIds, options) => {
            if (onUpdateProductLink && activeTransactionId) {
              await onUpdateProductLink(activeTransactionId, productIds, options);
            }
            if (!options?.keepModalOpen) {
              setIsModalActive(false);
              setActiveTransactionId(null);
            }
          }}
          linkedProductIds={linkedProductIds}
          transaction={transactions.find(t => t.id === activeTransactionId)}
          isOpen={true}
          onClose={() => {
            setIsModalActive(false);
            setActiveTransactionId(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction${deleteTarget ? ` of $${deleteTarget.amount}` : ''}? This action cannot be undone.`}
        onConfirm={async () => {
          if (deleteTarget?.id && onDeleteTransaction) await onDeleteTransaction(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
