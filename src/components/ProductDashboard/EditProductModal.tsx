import React, { useState, useEffect } from 'react';
import { Product } from '../../types/Product';
import { typography } from '../../utils/typography';
import { getBadgeClasses } from '../../utils/colors';
import { Modal, ProductThumbnail } from '../common';
import { useVendors } from '../../hooks/useVendors';
import { getProductStatus } from '../../utils/productStatus';
import { parseBookmarkletClipboard } from '../../utils/bookmarklet';
import {
  applyBookmarkletPayload,
  ImportStatus,
  updateProductNumbers,
  updateProductPaid,
} from './productFormUtils';
import { RefundExpectation } from '../../types/Product';
import { ProductFormRefundExpectationSection } from './ProductFormRefundExpectationSection';
import { ProductFormQuickImportSection } from './ProductFormQuickImportSection';
import { ProductFormReviewJourneySection } from './ProductFormReviewJourneySection';
import { ProductFormProductDetailsSection } from './ProductFormProductDetailsSection';
import { ProductFormFinancialsSection } from './ProductFormFinancialsSection';
import { ProductFormReviewRequirementSection } from './ProductFormReviewRequirementSection';
import { formFooterCancelClass, formFooterPrimaryClass } from './productFormStyles';

interface EditProductModalProps {
  product: Product;
  isOpen: boolean;
  onSave: (updatedProduct: Product) => void;
  onCancel: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onSave,
  onCancel,
}) => {
  const { activeVendors, DEFAULT_VENDOR_ID, getVendorName } = useVendors();
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product });
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [showPasteBox, setShowPasteBox] = useState(false);

  useEffect(() => {
    setEditedProduct({ ...product });
  }, [product]);

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

  const status = getProductStatus(editedProduct);
  const vendorName = getVendorName(editedProduct.vendorId);

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
        <div className="mx-6 my-4 flex items-center gap-3 px-4 py-3 bg-[#9e9e9e]/10 border border-[#9e9e9e]/30 rounded-xl">
          <svg className="w-4 h-4 text-[#74777f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className={`${typography.body} text-[#43474e]`}>
            This product is <strong>Void</strong>. Use the ⋮ menu in the table to un-void it.
          </p>
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

      <ProductFormRefundExpectationSection
        product={editedProduct}
        onChange={(expectation: RefundExpectation) =>
          setEditedProduct(prev => ({ ...prev, refundExpectation: expectation }))
        }
      />

      <ProductFormFinancialsSection
        product={editedProduct}
        onPaidChange={(value) => setEditedProduct(prev => updateProductPaid(prev, value))}
        onReceivedChange={(value) => setEditedProduct(prev => updateProductNumbers(prev, 'received', value))}
        onResetDelta={() => setEditedProduct(prev => ({ ...prev, delta: null, received: null }))}
      />

      <ProductFormQuickImportSection
        variant="compact"
        importStatus={importStatus}
        onClipboardImport={handleClipboardImport}
        showPasteBox={showPasteBox}
        onPasteBoxPaste={handlePasteBoxPaste}
        onPasteBoxClose={() => setShowPasteBox(false)}
      />
    </div>
  );

  const modalFooter = (
    <div className="flex gap-3 w-full">
      <button type="button" onClick={onCancel} className={formFooterCancelClass}>
        Cancel
      </button>
      <button type="button" onClick={handleSave} className={formFooterPrimaryClass}>
        Update Product
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      header={modalHeader}
      body={modalBody}
      footer={modalFooter}
      showCloseButton={false}
      size="lg"
    />
  );
};

export default EditProductModal;
