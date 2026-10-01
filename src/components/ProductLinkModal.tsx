import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Product, ProductLinkOptions } from '../types/Product';
import { PayPalTransaction } from '../types/PayPalTransaction';
import { Modal, ProductThumbnail } from './common';
import ConfirmDeleteModal from './common/ConfirmDeleteModal';
import { getProductStatus, isVoid, isRefundPending } from '../utils/productStatus';
import { formatCurrency } from '../utils/currency';
import { getPayPalMatchSuggestions } from '../utils/paypalMatchSuggestions';
import {
  getExpectedReceivedForProduct,
  hasRefundExpectation,
  getProductRefundExpectation,
} from '../utils/refundUtils';
import { getBadgeClasses } from '../utils/colors';
import { typography } from '../utils/typography';
import {
  formFooterCancelClass,
  formFooterPrimaryClass,
  formInputClass,
  formLabelClass,
} from './ProductDashboard/productFormStyles';
import { ProductFormCurrencyInput } from './ProductDashboard/ProductFormCurrencyInput';

interface ProductLinkModalProps {
  products: Product[];
  selectedProductIds: string[];
  onProductSelect: (productIds: string[], options?: ProductLinkOptions) => void | Promise<void>;
  linkedProductIds?: string[];
  transaction?: PayPalTransaction;
  isOpen: boolean;
  onClose: () => void;
}

function formatOrderDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTransactionDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    /* fall through */
  }
  return dateStr;
}

function formatProductAmountLine(product: Product, transactionTotal?: number): string {
  const paidLabel = product.paid != null ? formatCurrency(product.paid) : '—';
  const expected = getExpectedReceivedForProduct(product);
  const expectation = getProductRefundExpectation(product);
  const parts = [`Paid ${paidLabel}`];

  if (hasRefundExpectation(expectation) && expected != null) {
    parts.push(`Expected ${formatCurrency(expected)}`);
  }

  if (transactionTotal != null) {
    const compareAmount =
      hasRefundExpectation(expectation) && expected != null ? expected : product.paid;
    if (compareAmount != null) {
      parts.push(`Difference ${formatCurrency(Math.abs(compareAmount - transactionTotal))}`);
    }
  }

  return parts.join(' · ');
}

function equalSplitAmounts(productIds: string[], netReceived: number): Record<string, string> {
  const perProduct = netReceived / productIds.length;
  return Object.fromEntries(productIds.map((id) => [id, perProduct.toFixed(2)]));
}

function parseSplitAmountInputs(
  productIds: string[],
  inputs: Record<string, string>
): Record<string, number> | null {
  const parsed: Record<string, number> = {};
  for (const id of productIds) {
    const value = parseFloat(inputs[id] ?? '');
    if (Number.isNaN(value) || value < 0) return null;
    parsed[id] = value;
  }
  return parsed;
}

const visibilityPillActive =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[rgba(196,198,207,0.55)] bg-white text-[#43474e] ' +
  `${typography.captionStrong} transition-colors hover:bg-[#fbf9f3]`;

const visibilityPillInactive =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[rgba(196,198,207,0.35)] bg-[#eae8e2]/60 text-[#74777f] ' +
  `${typography.captionStrong} transition-colors hover:bg-[#eae8e2]`;

export const ProductLinkModal: React.FC<ProductLinkModalProps> = ({
  products,
  selectedProductIds,
  onProductSelect,
  linkedProductIds = [],
  transaction,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedProductIds);
  const [hideLinked, setHideLinked] = useState(true);
  const [hideVoid, setHideVoid] = useState(true);
  const [completeWorkflow, setCompleteWorkflow] = useState(true);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempSelectedIds(selectedProductIds);
  }, [selectedProductIds]);

  useEffect(() => {
    if (isOpen) {
      setCompleteWorkflow(true);
      setShowUnlinkConfirm(false);

      const netReceived = transaction?.total ?? 0;
      const existingCustom = transaction?.productSplitAmounts;
      const canUseCustom =
        existingCustom &&
        selectedProductIds.length >= 2 &&
        selectedProductIds.every((id) => existingCustom[id] != null);

      if (canUseCustom) {
        setSplitEnabled(true);
        setSplitAmounts(
          Object.fromEntries(
            selectedProductIds.map((id) => [id, existingCustom[id].toFixed(2)])
          )
        );
      } else if (transaction?.splitPrice && selectedProductIds.length >= 2) {
        setSplitEnabled(true);
        setSplitAmounts(equalSplitAmounts(selectedProductIds, netReceived));
      } else {
        setSplitEnabled(false);
        setSplitAmounts({});
      }

      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [isOpen, transaction?.splitPrice, transaction?.productSplitAmounts, transaction?.total, selectedProductIds]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const closeModal = () => {
    setSearchTerm('');
    setTempSelectedIds(selectedProductIds);
    onClose();
  };

  const handleToggle = (productId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let options: ProductLinkOptions | undefined;
    if (
      tempSelectedIds.length === 1 &&
      completeWorkflow &&
      !selectedProducts[0]?.isVoid
    ) {
      options = { completeWorkflow: true };
    } else if (tempSelectedIds.length >= 2 && splitEnabled) {
      const parsed = parseSplitAmountInputs(tempSelectedIds, splitAmounts);
      if (parsed) {
        options = { customSplitAmounts: parsed };
      }
    }
    onProductSelect(tempSelectedIds, options);
    closeModal();
  };

  const sortPriority = (product: Product): number => {
    if (isVoid(product)) return 3;
    if (isRefundPending(product)) return 0;
    const status = getProductStatus(product);
    return status.type === 'complete' ? 2 : 1;
  };

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products
      .filter((p) => {
        if (hideLinked && (linkedProductIds.includes(p.id || '') || getProductStatus(p).type === 'complete')) {
          return false;
        }
        if (hideVoid && isVoid(p)) return false;
        if (!q) return true;
        return [p.item?.toLowerCase(), p.paid?.toString(), p.orderNumber?.toLowerCase()].some((f) =>
          f?.includes(q)
        );
      })
      .sort((a, b) => sortPriority(a) - sortPriority(b));
  }, [products, searchTerm, linkedProductIds, hideLinked, hideVoid]);

  const linkedCount = useMemo(() => products.filter(
    (p) => linkedProductIds.includes(p.id || '') || getProductStatus(p).type === 'complete'
  ).length, [products, linkedProductIds]);
  const voidCount = useMemo(() => products.filter((p) => isVoid(p)).length, [products]);

  const matchSuggestions = useMemo(() => {
    if (!transaction) return [];
    return getPayPalMatchSuggestions(transaction, products, linkedProductIds);
  }, [transaction, products, linkedProductIds]);

  const transactionLinkedProducts = useMemo(
    () =>
      selectedProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p != null),
    [selectedProductIds, products]
  );

  const selectedProducts = products.filter((p) => p.id && tempSelectedIds.includes(p.id));
  const totalSelectedPaid = selectedProducts.reduce((sum, p) => sum + (p.paid ?? 0), 0);
  const netReceived = transaction?.total ?? 0;
  const selectionDifference = Math.abs(totalSelectedPaid - netReceived);
  const parsedSplitAmounts = splitEnabled
    ? parseSplitAmountInputs(tempSelectedIds, splitAmounts)
    : null;
  const allocatedSplitTotal = parsedSplitAmounts
    ? Object.values(parsedSplitAmounts).reduce((sum, value) => sum + value, 0)
    : 0;
  const splitAllocationDiff = Math.abs(allocatedSplitTotal - netReceived);
  const splitAmountsValid =
    !splitEnabled || (parsedSplitAmounts != null && splitAllocationDiff < 0.01);
  const isAlreadyLinked = selectedProductIds.length > 0;

  useEffect(() => {
    if (!splitEnabled || tempSelectedIds.length < 2) return;
    setSplitAmounts((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of tempSelectedIds) {
        if (next[id] == null) {
          next[id] = (netReceived / tempSelectedIds.length).toFixed(2);
          changed = true;
        }
      }
      for (const id of Object.keys(next)) {
        if (!tempSelectedIds.includes(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tempSelectedIds, splitEnabled, netReceived]);

  const linkButtonLabel =
    tempSelectedIds.length === 0
      ? 'Link Products'
      : tempSelectedIds.length === 1
        ? 'Link 1 Product'
        : `Link ${tempSelectedIds.length} Products`;

  const ProductRow = ({ product }: { product: Product }) => {
    const id = product.id || '';
    const isSelected = tempSelectedIds.includes(id);
    const isAlreadyLinkedRow = linkedProductIds.includes(id);
    const status = getProductStatus(product);

    return (
      <li
        onClick={() => id && handleToggle(id)}
        className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors rounded-xl mx-1 ${
          isSelected ? 'bg-[#006a68]/10 ring-1 ring-[#006a68]/25' : 'hover:bg-[#fbf9f3]'
        }`}
      >
        <div
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-[#006a68] border-[#006a68]' : 'border-[#c4c6cf]'
          }`}
          aria-hidden="true"
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => id && handleToggle(id)}
          onClick={(e) => e.stopPropagation()}
          className="sr-only"
          aria-label={`Select ${product.item}`}
        />

        <ProductThumbnail imageUrl={product.imageUrl} productName={product.item} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`${typography.bodyStrong} leading-snug line-clamp-2 min-w-0 ${
                isSelected ? 'text-[#022448]' : 'text-[#1b1c19]'
              }`}
            >
              {product.item}
            </p>
            <span className={`${getBadgeClasses(status.type)} shrink-0 scale-90 origin-top-right`}>
              {status.label}
            </span>
          </div>

          <div className={`${typography.caption} mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5`}>
            {product.orderDate && <span>{formatOrderDate(product.orderDate)}</span>}
            {isAlreadyLinkedRow && (
              <span className="text-[#006a68] font-medium">linked</span>
            )}
          </div>

          <p className={`${typography.caption} tabular-nums mt-0.5 text-[#43474e]`}>
            {formatProductAmountLine(product)}
            {' · Received '}
            {product.received != null && product.received !== 0 ? (
              <span className="text-[#006a68]">{formatCurrency(product.received)}</span>
            ) : (
              '—'
            )}
          </p>
        </div>
      </li>
    );
  };

  const header = (
    <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-[rgba(196,198,207,0.15)] space-y-3">
      <h3 className={typography.modalTitle}>
        {isAlreadyLinked ? 'Edit linked products' : 'Link Products'}
      </h3>

      {transaction && (
        <div className="px-3 py-2.5 rounded-xl bg-[#eae8e2]/50 border border-[rgba(196,198,207,0.4)] min-w-0 space-y-1">
          <div className="flex items-center gap-3 min-w-0">
            <p className={`${typography.bodyStrong} truncate min-w-0 flex-1`}>{transaction.name}</p>
            <p className={`${typography.caption} shrink-0 text-[#74777f]`}>
              {formatTransactionDate(transaction.date)}
            </p>
          </div>
          <div className={`${typography.caption} flex flex-wrap items-center gap-x-3 gap-y-0.5 tabular-nums text-[#43474e]`}>
            <span>
              Amount <span className={`${typography.bodyStrong} text-[#1b1c19]`}>{formatCurrency(transaction.amount)}</span>
            </span>
            <span>
              Net received{' '}
              <span className={`${typography.bodyStrong} text-[#1b1c19]`}>{formatCurrency(transaction.total)}</span>
            </span>
          </div>
        </div>
      )}

      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#74777f] pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Search by name, amount, or order number"
          placeholder="Search by name, amount, or order #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              if (searchTerm) setSearchTerm('');
              else inputRef.current?.blur();
            }
          }}
          className={`${formInputClass} pl-10 pr-10`}
          autoComplete="off"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#43474e]"
          >
            <XMarkIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <kbd
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 text-caption text-[#74777f]/50 pointer-events-none"
            aria-hidden="true"
          >
            /
          </kbd>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {linkedCount > 0 && (
          <button
            type="button"
            onClick={() => setHideLinked((v) => !v)}
            className={hideLinked ? visibilityPillInactive : visibilityPillActive}
            aria-pressed={!hideLinked}
          >
            {hideLinked ? (
              <EyeSlashIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <EyeIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            {hideLinked ? 'Show completed item' : 'Hide completed & linked'}
          </button>
        )}
        {voidCount > 0 && (
          <button
            type="button"
            onClick={() => setHideVoid((v) => !v)}
            className={hideVoid ? visibilityPillInactive : visibilityPillActive}
            aria-pressed={!hideVoid}
          >
            {hideVoid ? (
              <EyeSlashIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <EyeIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            {hideVoid ? 'Show void product' : 'Hide void'}
          </button>
        )}
      </div>

      {isAlreadyLinked && transactionLinkedProducts.length > 0 && transaction ? (
        <div className="space-y-2">
          <p className={`${typography.label} text-[#74777f]`}>
            Linked {transactionLinkedProducts.length === 1 ? 'product' : 'products'}
          </p>
          <div className="space-y-1.5">
            {transactionLinkedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#006a68]/35 bg-[#006a68]/10"
                >
                  <ProductThumbnail imageUrl={product.imageUrl} productName={product.item} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`${typography.bodyStrong} line-clamp-2 text-[#1b1c19]`}>
                      {product.item}
                    </p>
                    <p className={`${typography.caption} tabular-nums text-[#43474e] mt-0.5`}>
                      {formatProductAmountLine(product, transaction.total)}
                    </p>
                  </div>
                  <CheckIcon className="w-4 h-4 text-[#006a68] shrink-0" aria-hidden="true" />
                </div>
            ))}
          </div>
        </div>
      ) : (
        transaction &&
        matchSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className={`${typography.label} text-[#74777f]`}>
              Suggested matches ({matchSuggestions.length})
            </p>
            <div className="space-y-1.5">
              {matchSuggestions.map(({ product }) => {
                const id = product.id || '';
                const isSelected = tempSelectedIds.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => id && handleToggle(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors text-left ${
                      isSelected
                        ? 'border-[#006a68]/35 bg-[#006a68]/10 ring-1 ring-[#006a68]/20'
                        : 'border-[rgba(196,198,207,0.45)] bg-white hover:bg-[#fbf9f3] hover:border-[rgba(196,198,207,0.65)]'
                    }`}
                  >
                    <ProductThumbnail imageUrl={product.imageUrl} productName={product.item} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`${typography.bodyStrong} line-clamp-1 text-[#1b1c19]`}>
                        {product.item}
                      </p>
                      <p className={`${typography.caption} tabular-nums text-[#43474e] mt-0.5`}>
                        {formatProductAmountLine(product, transaction.total)}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-[#006a68] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );

  const body = (
    <div className="max-h-[45vh] overflow-y-auto py-2">
      <p className={`${typography.label} text-[#74777f] px-4 sm:px-6 mb-1.5`}>
        All eligible products
      </p>
      {filteredProducts.length > 0 ? (
        <ul>
          {filteredProducts.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </ul>
      ) : searchTerm ? (
        <div className="text-center py-10 px-4">
          <p className={`${typography.body} text-[#74777f] mb-3`}>
            No products match &ldquo;{searchTerm}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className={`${typography.captionStrong} px-4 py-2 rounded-xl bg-[#eae8e2] text-[#43474e] hover:bg-[#e4e2dd]`}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="text-center py-10 px-4">
          <p className={`${typography.body} text-[#74777f]`}>No products available to link.</p>
        </div>
      )}
    </div>
  );

  const handleUnlinkConfirm = async () => {
    setShowUnlinkConfirm(false);
    await onProductSelect([], { keepModalOpen: true });
    setTempSelectedIds([]);
  };

  const unlinkConfirmMessage =
    transactionLinkedProducts.length === 1
      ? `Are you sure you want to unlink "${transactionLinkedProducts[0].item}" from this transaction? The product's received amount will be cleared. This action cannot be undone.`
      : `Are you sure you want to unlink ${transactionLinkedProducts.length} products from this transaction? Their received amounts will be updated. This action cannot be undone.`;

  const footer = (
    <form onSubmit={handleSave} className="space-y-3 w-full">
      {tempSelectedIds.length > 0 && transaction && (
        <div className="px-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`${typography.bodyStrong} text-[#1b1c19]`}>
              {tempSelectedIds.length} product{tempSelectedIds.length !== 1 ? 's' : ''} selected
            </p>
            <button
              type="button"
              onClick={() => setTempSelectedIds([])}
              className={`${typography.caption} text-[#74777f] hover:text-[#1b1c19] underline`}
            >
              Clear all
            </button>
          </div>
          <p className={`${typography.caption} tabular-nums text-[#43474e]`}>
            Selected paid {formatCurrency(totalSelectedPaid)} · Net received{' '}
            {formatCurrency(netReceived)} · Difference {formatCurrency(selectionDifference)}
          </p>
        </div>
      )}

      {tempSelectedIds.length >= 2 && (
        <div className="px-1 space-y-2.5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={splitEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                setSplitEnabled(enabled);
                if (enabled) {
                  setSplitAmounts(equalSplitAmounts(tempSelectedIds, netReceived));
                }
              }}
              className="mt-0.5 rounded border-[#c4c6cf] text-[#006a68] focus:ring-[#006a68]/40"
            />
            <span className={`${typography.caption} text-[#43474e]`}>
              <span className={`${typography.bodyStrong} text-[#1b1c19]`}>
                Split net received between products
              </span>
              {!splitEnabled && (
                <span className="block mt-0.5">
                  Each product will receive the full net received amount ({formatCurrency(netReceived)}).
                </span>
              )}
            </span>
          </label>

          {splitEnabled && (
            <div className="space-y-2 pl-7">
              <div className="flex items-center justify-between gap-2">
                <p className={`${typography.caption} text-[#74777f]`}>Custom amount per product</p>
                <button
                  type="button"
                  onClick={() => setSplitAmounts(equalSplitAmounts(tempSelectedIds, netReceived))}
                  className={`${typography.captionStrong} text-[#006a68] hover:text-[#022448] underline`}
                >
                  Split equally
                </button>
              </div>
              {selectedProducts.map((product) => {
                const id = product.id || '';
                return (
                  <div key={id} className="space-y-1">
                    <label htmlFor={`split-${id}`} className={`${formLabelClass} line-clamp-1`}>
                      {product.item}
                    </label>
                    <ProductFormCurrencyInput
                      id={`split-${id}`}
                      value={
                        splitAmounts[id] != null && splitAmounts[id] !== ''
                          ? parseFloat(splitAmounts[id])
                          : null
                      }
                      onChange={(value) =>
                        setSplitAmounts((prev) => ({ ...prev, [id]: value }))
                      }
                    />
                  </div>
                );
              })}
              <p
                className={`${typography.caption} tabular-nums ${
                  splitAmountsValid ? 'text-[#43474e]' : 'text-[#ba1a1a]'
                }`}
              >
                Allocated {formatCurrency(allocatedSplitTotal)} / {formatCurrency(netReceived)}
                {!splitAmountsValid && ' · amounts must equal net received'}
              </p>
            </div>
          )}
        </div>
      )}

      {tempSelectedIds.length === 1 && !isAlreadyLinked && !selectedProducts[0]?.isVoid && (
        <label className="flex items-start gap-2.5 px-1 cursor-pointer">
          <input
            type="checkbox"
            checked={completeWorkflow}
            onChange={(e) => setCompleteWorkflow(e.target.checked)}
            className="mt-0.5 rounded border-[#c4c6cf] text-[#006a68] focus:ring-[#006a68]/40"
          />
          <span className={`${typography.caption} text-[#43474e]`}>
            <span className={`${typography.bodyStrong} text-[#1b1c19]`}>Accept refund &amp; finish</span>
            <span className="block mt-0.5">
              Mark workflow complete and set refund from this transaction
            </span>
          </span>
        </label>
      )}

      <div className="flex gap-3">
        {isAlreadyLinked && (
          <button
            type="button"
            onClick={() => setShowUnlinkConfirm(true)}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-[#ba1a1a]/30 text-[#ba1a1a] bg-[#ba1a1a]/5 hover:bg-[#ba1a1a]/10 transition-colors shrink-0"
          >
            Unlink
          </button>
        )}
        <button type="button" onClick={closeModal} className={formFooterCancelClass}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={tempSelectedIds.length === 0 || !splitAmountsValid}
          className={formFooterPrimaryClass}
        >
          {linkButtonLabel}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        header={header}
        body={body}
        footer={footer}
        showCloseButton={false}
        size="md"
      />
      <ConfirmDeleteModal
        isOpen={showUnlinkConfirm}
        title="Unlink Product"
        message={unlinkConfirmMessage}
        confirmLabel="Unlink"
        onConfirm={handleUnlinkConfirm}
        onCancel={() => setShowUnlinkConfirm(false)}
      />
    </>
  );
};

export default ProductLinkModal;
