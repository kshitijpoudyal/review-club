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
import { FORM_CONTROL_HEIGHT, formFooterCancelClass, formFooterPrimaryClass } from './productFormStyles';

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
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[rgba(196,198,207,0.15)]">
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
                <span className={`${typography.caption} text-[#74777f]`} aria-hidden="true">·</span>
                <span className={`${typography.caption} text-[#74777f]`}>{vendorName}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#74777f] hover:text-[#1b1c19] hover:bg-[#eae8e2] rounded-full transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const modalBody = (
    <div className="divide-y divide-[rgba(196,198,207,0.12)]">
      {editedProduct.isVoid && (
        <div className="mx-6 my-4 flex items-center justify-between gap-3 px-4 py-3 bg-[#9e9e9e]/10 border border-[#9e9e9e]/30 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-[#74777f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className={`${typography.body} text-[#43474e]`}>
              This product is <strong>Void</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUnvoid}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border border-[rgba(196,198,207,0.6)] text-[#43474e] bg-[#fbf9f3] hover:bg-[#e4e2dd] transition-colors"
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
        onChange={(expectation: RefundExpectation) =>
          setEditedProduct(prev => ({ ...prev, refundExpectation: expectation }))
        }
      />

      {importStatus !== 'idle' && (
        <div className="px-6 py-3">
          <p className={`${typography.caption} text-[#74777f]`}>{clipboardLabel.text}</p>
        </div>
      )}

      {showPasteBox && (
        <div className="px-6 py-3 space-y-2">
          <div className="rounded-xl border border-[rgba(196,198,207,0.4)] bg-white p-3 space-y-2">
            <p className={`${typography.caption} text-[#74777f]`}>
              Long-press below and tap <strong>Paste</strong>
            </p>
            <textarea
              autoFocus
              rows={3}
              placeholder="Paste bookmarklet data here…"
              onPaste={handlePasteBoxPaste}
              className={`w-full ${typography.caption} tabular-nums bg-white border border-[rgba(196,198,207,0.4)] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#022448]/20 text-[#1b1c19] placeholder:text-[#c4c6cf]`}
            />
            <button
              type="button"
              onClick={() => setShowPasteBox(false)}
              className={`${typography.caption} text-[#74777f] hover:text-[#1b1c19]`}
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
          className={`${FORM_CONTROL_HEIGHT} px-4 rounded-xl ${typography.button} inline-flex items-center gap-1.5 bg-white border border-[rgba(196,198,207,0.55)] text-[#43474e] hover:bg-[#fbf9f3] focus:outline-none focus:ring-2 focus:ring-[#022448]/20 transition-colors`}
          aria-expanded={showMoreMenu}
          aria-haspopup="menu"
        >
          More
          <svg className="w-4 h-4 text-[#74777f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMoreMenu && (
          <div
            role="menu"
            className="absolute left-0 bottom-full mb-2 w-56 bg-[#fbf9f3] rounded-2xl shadow-[0_12px_32px_rgba(2,36,72,0.10)] z-50 py-2 border border-[rgba(196,198,207,0.15)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowMoreMenu(false);
                void handleClipboardImport();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-[#1b1c19] hover:bg-[#eae8e2] transition-colors"
            >
              <span className="w-4 h-4 mr-3 text-[#74777f]">
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
                className="flex items-center w-full px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <span className="w-4 h-4 mr-3 text-amber-600">
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
                className="flex items-center w-full px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
              >
                <span className="w-4 h-4 mr-3 text-[#ba1a1a]">
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
      <button type="button" onClick={onCancel} className={formFooterCancelClass}>
        Cancel
      </button>
      <button type="button" onClick={handleSave} className={formFooterPrimaryClass}>
        Update Product
      </button>
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
