import React, { useState, useEffect } from 'react';
import { Product } from '../../types/Product';
import { typography } from '../../utils/typography';
import { getBadgeClasses } from '../../utils/colors';
import { Modal, ProductThumbnail } from '../common';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import { useVendors } from '../../hooks/useVendors';
import { applyProductVoid, getProductStatus } from '../../utils/productStatus';
import { parseBookmarkletClipboard } from '../../utils/bookmarklet';
import {
  applyBookmarkletPayload,
  getClipboardImportLabel,
  ImportStatus,
  updateProductNumbers,
  updateProductPaid,
} from './productFormUtils';
import { RefundExpectation } from '../../types/Product';
import { ProductFormRefundExpectationSection } from './ProductFormRefundExpectationSection';
import { ProductFormReviewJourneySection } from './ProductFormReviewJourneySection';
import { ProductFormProductDetailsSection } from './ProductFormProductDetailsSection';
import { ProductFormFinancialsSection } from './ProductFormFinancialsSection';
import { ProductFormReviewRequirementSection } from './ProductFormReviewRequirementSection';
import { FORM_CONTROL_HEIGHT } from './productFormStyles';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface EditProductModalProps {
  product: Product;
  isOpen: boolean;
  onSave: (updatedProduct: Product) => void;
  onCancel: () => void;
  onDelete?: (productId: string) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onSave,
  onCancel,
  onDelete,
}) => {
  const { activeVendors, DEFAULT_VENDOR_ID, getVendorName } = useVendors();
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product });
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setEditedProduct({ ...product });
  }, [product]);

  useEffect(() => {
    if (!isOpen) {
      setShowMoreMenu(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.edit-product-more-menu')) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const handleInputChange = (field: keyof Product, value: unknown) => {
    setEditedProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailsChange = (field: keyof Product, value: string | null) => {
    handleInputChange(field, value);
  };

  const handleStepToggle = (field: keyof Product, newValue: boolean) => {
    const REVIEW_FIELDS: (keyof Product)[] = [
      'orderPlaced', 'orderDelivered', 'reviewAdded', 'reviewLive', 'reviewSSSent',
    ];
    const idx = REVIEW_FIELDS.indexOf(field);
    if (!newValue && idx >= 0) {
      const updates: Partial<Product> = {};
      for (let i = idx; i < REVIEW_FIELDS.length; i++) {
        (updates as Record<string, boolean>)[REVIEW_FIELDS[i]] = false;
      }
      setEditedProduct(prev => ({ ...prev, ...updates }));
    } else {
      setEditedProduct(prev => ({ ...prev, [field]: newValue }));
    }
  };

  const applyPayload = (data: ReturnType<typeof parseBookmarkletClipboard>) => {
    setEditedProduct(prev => applyBookmarkletPayload(prev, data));
    const isUrlOnly = !data.productName && !data.orderDate && !!data.orderNumber;
    setImportStatus(isUrlOnly ? 'url-only' : 'success');
    setShowPasteBox(false);
    setTimeout(() => setImportStatus('idle'), 4000);
  };

  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = parseBookmarkletClipboard(text);
      applyPayload(data);
    } catch {
      setShowPasteBox(true);
      setImportStatus('idle');
    }
  };

  const handlePasteBoxPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    try {
      const data = parseBookmarkletClipboard(text);
      applyPayload(data);
    } catch {
      setImportStatus('error');
      setShowPasteBox(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleSave = () => onSave(editedProduct);

  const handleMarkVoid = () => {
    setEditedProduct(prev => applyProductVoid(prev));
  };

  const handleUnvoid = () => {
    setEditedProduct(prev => ({ ...prev, isVoid: false }));
  };

  const handleConfirmDelete = () => {
    setIsConfirmingDelete(false);
    if (editedProduct.id) {
      onDelete?.(editedProduct.id);
    }
  };

  const status = getProductStatus(editedProduct);
  const vendorName = getVendorName(editedProduct.vendorId);
  const clipboardLabel = getClipboardImportLabel(importStatus);

  const modalHeader = (
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-input/15">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <ProductThumbnail
          imageUrl={editedProduct.imageUrl}
          productName={editedProduct.item}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h2 className={`${typography.modalTitle} line-clamp-2 leading-snug`}>
            {editedProduct.item || 'Untitled Product'}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={getBadgeClasses(status.type)}>
              {status.label}
            </span>
            {vendorName && (
              <>
                <span className={`${typography.caption} text-muted-foreground`} aria-hidden="true">·</span>
                <span className={`${typography.caption} text-muted-foreground`}>{vendorName}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCancel}
        className="flex-shrink-0"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );

  const modalBody = (
    <div className="divide-y divide-input/12">
      {editedProduct.isVoid && (
        <div className="mx-6 my-4 flex items-center justify-between gap-3 px-4 py-3 bg-status-gray/10 border border-status-gray/30 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className={`${typography.body} text-on-surface-variant`}>
              This product is <strong>Void</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUnvoid}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border border-input/60 text-on-surface-variant bg-background hover:bg-surface-variant transition-colors"
          >
            Un-Void
          </button>
        </div>
      )}

      {!editedProduct.isVoid && (
        <ProductFormReviewJourneySection
          product={editedProduct}
          onStepToggle={handleStepToggle}
        />
      )}

      <ProductFormReviewRequirementSection
        value={editedProduct.reviewMediaType}
        onChange={(value) => handleInputChange('reviewMediaType', value)}
      />

      <ProductFormProductDetailsSection
        product={editedProduct}
        activeVendors={activeVendors}
        defaultVendorId={DEFAULT_VENDOR_ID}
        onChange={handleDetailsChange}
        mode="edit"
      />

      <ProductFormFinancialsSection
        product={editedProduct}
        onPaidChange={(value) => setEditedProduct(prev => updateProductPaid(prev, value))}
        onReceivedChange={(value) => setEditedProduct(prev => updateProductNumbers(prev, 'received', value))}
        onResetDelta={() => setEditedProduct(prev => ({ ...prev, delta: null, received: null }))}
      />

      <ProductFormRefundExpectationSection
        product={editedProduct}
        isActive={isOpen}
        defaultExpanded={false}
        showPaidExpectedLine={false}
        onChange={(expectation: RefundExpectation) =>
          setEditedProduct(prev => ({ ...prev, refundExpectation: expectation }))
        }
      />

      {importStatus !== 'idle' && (
        <div className="px-6 py-3">
          <p className={`${typography.caption} text-muted-foreground`}>{clipboardLabel.text}</p>
        </div>
      )}

      {showPasteBox && (
        <div className="px-6 py-3 space-y-2">
          <div className="rounded-xl border border-input/40 bg-card p-3 space-y-2">
            <p className={`${typography.caption} text-muted-foreground`}>
              Long-press below and tap <strong>Paste</strong>
            </p>
            <Textarea
              autoFocus
              rows={3}
              placeholder="Paste bookmarklet data here…"
              onPaste={handlePasteBoxPaste}
              className="min-h-0 rounded-lg py-2 text-caption md:text-caption tabular-nums placeholder:text-input"
            />
            <button
              type="button"
              onClick={() => setShowPasteBox(false)}
              className={`${typography.caption} text-muted-foreground hover:text-foreground`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const modalFooter = (
    <div className="flex items-center gap-2 w-full">
      <div className="relative edit-product-more-menu flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowMoreMenu(prev => !prev)}
          className={`${FORM_CONTROL_HEIGHT} px-4 rounded-xl ${typography.button} inline-flex items-center gap-1.5 bg-card border border-input/55 text-on-surface-variant hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
          aria-expanded={showMoreMenu}
          aria-haspopup="menu"
        >
          More
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMoreMenu && (
          <div
            role="menu"
            className="absolute left-0 bottom-full mb-2 w-56 material-popover rounded-[0.875rem] shadow-navy-md z-50 py-1.5 border border-border/50"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowMoreMenu(false);
                void handleClipboardImport();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <span className="w-4 h-4 mr-3 text-muted-foreground">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Update from Clipboard
            </button>
            {!editedProduct.isVoid && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowMoreMenu(false);
                  handleMarkVoid();
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-status-amber-fg hover:bg-status-amber/10 transition-colors"
              >
                <span className="w-4 h-4 mr-3 text-status-amber-fg">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </span>
                Mark as Void
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowMoreMenu(false);
                  setIsConfirmingDelete(true);
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive-container transition-colors"
              >
                <span className="w-4 h-4 mr-3 text-destructive">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </span>
                Delete Product
              </button>
            )}
          </div>
        )}
      </div>
      <Button variant="outline" size="control" type="button" onClick={onCancel} className="flex-1">
        Cancel
      </Button>
      <Button size="control" type="button" onClick={handleSave} className="flex-1">
        Update Product
      </Button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onCancel}
        header={modalHeader}
        body={modalBody}
        footer={modalFooter}
        showCloseButton={false}
        size="lg"
      />
      <ConfirmDeleteModal
        isOpen={isConfirmingDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${editedProduct.item}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </>
  );
};

export default EditProductModal;
