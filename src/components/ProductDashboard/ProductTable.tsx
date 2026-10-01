import React, { useState, useEffect } from 'react';
import { Product } from '../../types/Product';
import EditProductModal from './EditProductModal';
import { getProductStatus } from '../../utils/productStatus';
import { getBadgeClasses } from '../../utils/colors';
import { useProductPayPalLinks, ProductPayPalLink } from '../../hooks/useProductPayPalLinks';
import { TableView, TableColumn, TableRow, MobileCardContent } from '../common/TableView';
import { colors, getFinancialColor } from '../../utils/colors';
import { useVendors } from '../../hooks/useVendors';
import { formatCurrency } from '../../utils/currency';
import { getStoreBorderColor } from '../../utils/retailerUtils';
import { typography } from '../../utils/typography';
import { ProductThumbnail, ReviewMediaBadge } from '../common';
import { useToast } from '../common/Toast';
import { generateReview, GeneratedReview } from '../../utils/generateReview';
import GeneratedReviewModal from '../common/GeneratedReviewModal';

interface ProductTableProps {
  products: Product[];
  onUpdateProduct?: (index: number, updatedProduct: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onClearFilters?: () => void;
  readOnly?: boolean;
  loading?: boolean;
  userId?: string;
  hasAnyProducts?: boolean;
}

const ITEM_NAME_CLASSES =
  'min-w-0 w-full break-words leading-snug line-clamp-2 lg:line-clamp-none lg:whitespace-normal';

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onClearFilters,
  readOnly = false,
  loading = false,
  userId,
  hasAnyProducts = true,
}) => {
  const [showDropdown, setShowDropdown] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [generatingReviewId, setGeneratingReviewId] = useState<string | number | null>(null);
  const [generatedReview, setGeneratedReview] = useState<GeneratedReview | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { showToast, dismissToast } = useToast();

  // Get product IDs for checking PayPal links
  const productIds = products.map(p => p.id).filter(Boolean) as string[];
  const { getLinkedPayPalLinks } = useProductPayPalLinks(userId, productIds);

  const renderItemName = (product: Product) => {
    const baseClass = `${typography.bodyStrong} ${colors.text.primary}`;

    if (product.url) {
      return (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          title={product.item}
          className={`${baseClass} ${ITEM_NAME_CLASSES} hover:${colors.text.link} transition-colors`}
        >
          {product.item}
        </a>
      );
    }

    return (
      <span title={product.item} className={`${baseClass} ${ITEM_NAME_CLASSES}`}>
        {product.item}
      </span>
    );
  };

  const getRowClassName = (product: Product) => {
    if (product.isVoid) return colors.background.voidRow;
    return '';
  };

  const renderPayPalBadge = (link: ProductPayPalLink, index: number) => (
    <span
      key={link.transactionId || `paypal-${index}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0070BA]/10 text-[#0070BA] ${typography.captionStrong} tabular-nums flex-shrink-0`}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l-1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      {formatCurrency(link.amount)}
    </span>
  );

  const renderPayPalBadges = (links: ProductPayPalLink[]) => {
    if (links.length === 0) return null;
    return links.map((link, index) => renderPayPalBadge(link, index));
  };

  const renderPayPalBadgeColumn = (links: ProductPayPalLink[]) => {
    if (links.length === 0) return null;
    return (
      <div className="flex flex-col items-end gap-1 shrink-0 self-start pr-1 lg:pr-2">
        {links.map((link, index) => renderPayPalBadge(link, index))}
      </div>
    );
  };

  // Get vendor information
  const { getVendorName } = useVendors();

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
    setShowDropdown(null);
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    const productIndex = products.findIndex(p => p.id === updatedProduct.id);
    if (productIndex !== -1 && onUpdateProduct) {
      onUpdateProduct(productIndex, updatedProduct);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleCancelEdit = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

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

  const getDeltaClass = (delta: number | null) => {
    if (delta === null) return colors.text.muted;
    if (delta > 0) return colors.financial.positive;
    if (delta < 0) return colors.financial.negative;
    return colors.text.muted;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      // Split the date string to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString; // Return original string if parsing fails
    }
  };

  // Shared function to get next status action for a product
  const getNextStatusAction = (product: Product) => {
    // Void product: offer Un-Void as the primary quick action
    if (product.isVoid) {
      return {
        type: 'unvoid',
        label: 'Un-Void',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        updateFn: () => ({ ...product, isVoid: false })
      };
    }

    // Order Placed -> Mark as Order Delivered
    if (product.orderPlaced && !product.orderDelivered) {
      return {
        type: 'delivered',
        label: 'Mark as Delivered',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
        updateFn: () => ({ ...product, orderDelivered: true })
      };
    }
    
    // Order Delivered -> Mark as Review Added
    if (product.orderPlaced && product.orderDelivered && !product.reviewAdded) {
      return {
        type: 'review-added',
        label: 'Mark as Review Added',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
        updateFn: () => ({ ...product, reviewAdded: true })
      };
    }
    
    // Review Added -> Mark as Review Live
    if (product.orderPlaced && product.orderDelivered && product.reviewAdded && !product.reviewLive) {
      return {
        type: 'review-live',
        label: 'Mark as Review Live',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        updateFn: () => ({ ...product, reviewLive: true })
      };
    }
    
    // Review Live -> Mark as Screenshot Sent
    if (product.orderPlaced && product.orderDelivered && product.reviewAdded && product.reviewLive && !product.reviewSSSent) {
      return {
        type: 'screenshot-sent',
        label: 'Mark as Screenshot Sent',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        updateFn: () => ({ ...product, reviewSSSent: true })
      };
    }
    
    return null; // No next step available
  };

  // Shared function to handle status update
  const handleStatusUpdate = (product: Product, updateFn: () => Product) => {
    const updatedProduct = updateFn();
    const productIndex = products.findIndex(p => p.id === product.id);
    if (productIndex !== -1 && onUpdateProduct) {
      onUpdateProduct(productIndex, updatedProduct);
    }
    setShowDropdown(null);
  };

  const handleGenerateReview = async (product: Product, rowId: string | number) => {
    if (generatingReviewId !== null) return; // re-entrancy guard
    setShowDropdown(null);
    setGeneratingReviewId(rowId);
    const loadingToastId = showToast('Generating review…', 'loading');
    try {
      const generated = await generateReview(product.item);
      dismissToast(loadingToastId);
      setGeneratedReview(generated);
      setIsReviewModalOpen(true);
    } catch (err) {
      dismissToast(loadingToastId);
      showToast(err instanceof Error ? err.message : 'Failed to generate review', 'error');
    } finally {
      setGeneratingReviewId(null);
    }
  };

  // Shared dropdown menu component for mobile
  const renderMobileDropdown = (product: Product, index: number) => {
    if (showDropdown !== index) return null;

    const nextAction = getNextStatusAction(product);
    const mobileStatus = getProductStatus(product);

    return (
      <div className="absolute right-0 top-full mt-2 bg-[#fbf9f3] border border-[rgba(196,198,207,0.15)] rounded-2xl shadow-[0_12px_32px_rgba(2,36,72,0.10)] z-50 min-w-[180px] py-2">
        {mobileStatus.type === 'add-review' && (
          <button
            onClick={() => handleGenerateReview(product, product.id || index)}
            className="block w-full text-left px-4 py-2.5 text-sm text-[#022448] hover:bg-[#006a68]/10 transition-colors font-medium"
          >
            Generate Review
          </button>
        )}

        {/* Dynamic status update button (Un-Void for void products, next step otherwise) */}
        {nextAction && (
          <button
            onClick={() => handleStatusUpdate(product, nextAction.updateFn)}
            className="block w-full text-left px-4 py-2.5 text-sm text-[#022448] hover:bg-[#006a68]/10 transition-colors font-medium"
          >
            {nextAction.label}
          </button>
        )}
        
        <button
          onClick={() => handleEditProduct(product)}
          className="block w-full text-left px-4 py-2.5 text-sm text-[#1b1c19] hover:bg-[#eae8e2] transition-colors"
        >
          Edit
        </button>
      </div>
    );
  };

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'item',
      label: `Item (${products.length})`,
      align: 'left',
      sortable: true,
      className: 'w-[48%] lg:w-[38%] pr-3 lg:pr-4',
    },
    {
      key: 'vendor',
      label: 'Vendor',
      align: 'left',
      sortable: true,
      className: 'pr-3 lg:pr-4',
    },
    {
      key: 'date',
      label: 'Date',
      align: 'left',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      sortable: true
    },
    {
      key: 'paid',
      label: 'Paid',
      align: 'center',
      sortable: true
    },
    {
      key: 'received',
      label: 'Received',
      align: 'center',
      sortable: true
    },
    {
      key: 'delta',
      label: 'Delta',
      align: 'center',
      sortable: true
    },
    ...(readOnly ? [] : [{ 
      key: 'actions', 
      label: 'Actions',
      align: 'center' as const,
      width: 'w-24'
    }])
  ];

  // Transform products into table rows
  const rows: TableRow[] = products.map((product, index) => {
    const status = getProductStatus(product);
    const paypalLinks = product.id ? getLinkedPayPalLinks(product.id) : [];
    const storeBorderColor = getStoreBorderColor(product);

    return {
      id: product.id || index,
      borderColor: storeBorderColor,
      className: getRowClassName(product),
      sortValues: {
        item: product.item || '',
        vendor: getVendorName(product.vendorId) || '',
        date: product.orderDate || '',
        status: status.label,
        paid: product.paid ?? null,
        received: product.received ?? null,
        delta: product.delta ?? null,
      },
      data: {
        item: (
          <div className="flex items-start gap-3 min-w-0 w-full">
            <ProductThumbnail
              imageUrl={product.imageUrl}
              productName={product.item}
              size="md"
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              {renderItemName(product)}
            </div>
            {renderPayPalBadgeColumn(paypalLinks)}
          </div>
        ),
        vendor: (
          <div className='flex flex-col'>
            <span className={`${typography.tableCellStrong} ${colors.text.secondary}`}>
              {getVendorName(product.vendorId)}
            </span>
          </div>
        ),
        date: (
          <div className='flex flex-col'>
            <span className={`${typography.tableCellStrong} ${colors.text.secondary}`}>
              {formatDate(product.orderDate)}
            </span>
          </div>
        ),
        status: (
          <div className='flex flex-col items-center gap-1'>
            <span className={getBadgeClasses(status.type)}>
              {status.label}
            </span>
            <ReviewMediaBadge
              reviewMediaType={product.reviewMediaType}
              show={status.type === 'add-review'}
            />
          </div>
        ),
        paid: (
          <div className='flex flex-col'>
            <span className={`${typography.numeric} ${colors.text.primary}`}>
              {formatCurrency(product.paid)}
            </span>
          </div>
        ),
        received: (
          <div className='flex flex-col'>
            <span className={`${typography.numeric} ${colors.text.primary}`}>
              {formatCurrency(product.received)}
            </span>
          </div>
        ),
        delta: (
          <div className='flex flex-col'>
            <span className={`${typography.numericStrong} ${getDeltaClass(product.delta)}`}>
              {formatCurrency(product.delta)}
            </span>
          </div>
        ),
        actions: null // Will be handled by the actions array below
      },
      actions: readOnly ? [] : [
        ...(status.type === 'add-review' ? [{
          label: 'Generate Review',
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          ),
          onClick: () => handleGenerateReview(product, product.id || index)
        }] : []),
        // Dynamic status update button using shared logic
        ...(() => {
          const nextAction = getNextStatusAction(product);
          return nextAction ? [{
            label: nextAction.label,
            variant: 'default' as const,
            icon: nextAction.icon,
            onClick: () => handleStatusUpdate(product, nextAction.updateFn)
          }] : [];
        })(),
        {
          label: 'Edit Product',
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          onClick: () => handleEditProduct(product)
        }
      ]
    };
  });

  // Mobile cards data
  const mobileCards: MobileCardContent[] = products.map((product, index) => {
    const status = getProductStatus(product);
    const storeBorderColor = getStoreBorderColor(product);
    const paypalLinks = product.id ? getLinkedPayPalLinks(product.id) : [];

    const headerContent = (
      <div className="space-y-3">
        {/* Status, link pills, date, and actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
            <span className={getBadgeClasses(status.type)}>
              {status.label}
            </span>
            <ReviewMediaBadge
              reviewMediaType={product.reviewMediaType}
              show={status.type === 'add-review'}
            />
            {paypalLinks.length > 0 && renderPayPalBadges(paypalLinks)}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`${typography.caption} ${colors.text.muted}`}>{formatDate(product.orderDate) || '—'}</span>
            {!readOnly && (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowDropdown(showDropdown === index ? null : index)}
                  className={`flex items-center justify-center w-8 h-8 ${colors.button.secondary} rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#022448]`}
                  title="More actions"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 10a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                  </svg>
                </button>
                {renderMobileDropdown(product, index)}
              </div>
            )}
          </div>
        </div>

        {/* Title + Image */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {product.url ? (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                title={product.item}
                className={`${typography.bodyStrong} text-section-title leading-snug line-clamp-2 ${colors.text.primary} hover:${colors.text.link} transition-colors`}
              >
                {product.item}
              </a>
            ) : (
              <h3
                title={product.item}
                className={`${typography.bodyStrong} text-section-title leading-snug line-clamp-2 ${colors.text.primary}`}
              >
                {product.item}
              </h3>
            )}
          </div>
          <ProductThumbnail
            imageUrl={product.imageUrl}
            productName={product.item}
            size="lg"
          />
        </div>

        {/* Vendor */}
        {product.vendorId && (
          <p className={`${typography.caption}`}>
            <span className="font-medium">Vendor:</span> {getVendorName(product.vendorId)}
          </p>
        )}

        {/* Financials */}
        <div className="flex items-end gap-5">
          <div>
            <p className={`${typography.caption} mb-0.5`}>Paid</p>
            <p className={`${typography.numeric} ${colors.financial.negative}`}>{formatCurrency(product.paid)}</p>
          </div>
          <div>
            <p className={`${typography.caption} mb-0.5`}>Received</p>
            <p className={`${typography.numeric} ${getFinancialColor(product.received)}`}>{formatCurrency(product.received)}</p>
          </div>
          <div>
            <p className={`${typography.caption} mb-0.5`}>Delta</p>
            <p className={`${typography.numericStrong} ${getDeltaClass(product.delta)}`}>{formatCurrency(product.delta)}</p>
          </div>
        </div>
      </div>
    );

    const financialContent = null;
    const actionsContent = null;

    return {
      headerContent,
      financialContent,
      actionsContent,
      borderColor: storeBorderColor,
      className: getRowClassName(product),
      noDividers: true,
    };
  });

  return (
    <>
      <TableView
        columns={columns}
        rows={rows}
        mobileCards={mobileCards}
        emptyMessage={
          hasAnyProducts
            ? 'No products found matching your criteria.'
            : 'No products yet. Use Getting Started above to import your list or add your first product.'
        }
        onClearFilters={onClearFilters}
        activeDropdown={showDropdown}
        loading={loading}
        onDropdownToggle={(rowId) => setShowDropdown(prev => prev === rowId ? null : rowId)}
        trailingSpacerRow
      />

      {/* Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <EditProductModal
          isOpen={isModalOpen}
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={handleCancelEdit}
          onDelete={(productId) => {
            onDeleteProduct?.(productId);
            handleCancelEdit();
          }}
        />
      )}

      <GeneratedReviewModal
        isOpen={isReviewModalOpen}
        review={generatedReview}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </>
  );
};

export default ProductTable;
