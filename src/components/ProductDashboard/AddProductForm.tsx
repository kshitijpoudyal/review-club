import React, { useEffect, useState } from "react";
import { Product, DEFAULT_REVIEW_MEDIA_TYPE, RefundExpectation, ReviewMediaType } from "../../types/Product";
import { typography } from '../../utils/typography';
import { Modal } from "../common";
import { useVendors } from "../../hooks/useVendors";
import { BookmarkletPayload, parseBookmarkletClipboard, bookmarkletPayloadToProductFields } from "../../utils/bookmarklet";
import {
  applyBookmarkletPayload,
  ImportStatus,
} from "./productFormUtils";
import { ProductFormQuickImportSection } from "./ProductFormQuickImportSection";
import { ProductFormProductDetailsSection } from "./ProductFormProductDetailsSection";
import { ProductFormRefundExpectationSection } from "./ProductFormRefundExpectationSection";
import { updateProductPaid } from "./productFormUtils";
import { ProductFormReviewRequirementSection } from "./ProductFormReviewRequirementSection";
import { formFooterCancelClass, formFooterPrimaryClass } from "./productFormStyles";

interface AddProductFormProps {
  isOpen: boolean;
  onAdd: (product: Product) => void;
  onCancel: () => void;
  externalImport?: { payload: BookmarkletPayload; productIndex?: number } | null;
  onExternalImportApplied?: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  isOpen,
  onAdd,
  onCancel,
  externalImport,
  onExternalImportApplied,
}) => {
  const { activeVendors, DEFAULT_VENDOR_ID } = useVendors();
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [showPasteBox, setShowPasteBox] = useState(false);

  const emptyProduct = (): Product => ({
    item: "",
    url: "",
    imageUrl: "",
    orderDate: null,
    orderNumber: "",
    orderPlaced: true,
    orderDelivered: false,
    reviewAdded: false,
    reviewLive: false,
    reviewSSSent: false,
    paid: null,
    received: null,
    delta: null,
    isVoid: false,
    vendorId: DEFAULT_VENDOR_ID,
    reviewMediaType: DEFAULT_REVIEW_MEDIA_TYPE,
  });

  const [newProduct, setNewProduct] = useState<Product>(emptyProduct);

  const handleInputChange = (field: keyof Product, value: string | number | boolean | null | ReviewMediaType) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailsChange = (field: keyof Product, value: string | null) => {
    handleInputChange(field, value);
  };

  const resetForm = () => {
    setNewProduct(emptyProduct());
    setImportStatus('idle');
    setShowPasteBox(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.item.trim()) {
      onAdd(newProduct);
      resetForm();
    }
  };

  const applyPayload = (data: ReturnType<typeof parseBookmarkletClipboard>, productIndex = 0) => {
    const fields = bookmarkletPayloadToProductFields(data, productIndex);
    setNewProduct(prev => applyBookmarkletPayload(prev, { ...data, ...fields }));
    const isUrlOnly = !fields.productName && !data.orderDate && !!data.orderNumber;
    setImportStatus(isUrlOnly ? 'url-only' : 'success');
    setShowPasteBox(false);
    setTimeout(() => setImportStatus('idle'), 4000);
  };

  useEffect(() => {
    if (!isOpen || !externalImport?.payload) return;
    applyPayload(externalImport.payload, externalImport.productIndex ?? 0);
    onExternalImportApplied?.();
  }, [isOpen, externalImport, onExternalImportApplied]);

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

  const modalHeader = (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[rgba(196,198,207,0.15)]">
      <h2 className={typography.modalTitle}>Add Product</h2>
      <button
        type="button"
        onClick={handleCancel}
        className="w-8 h-8 flex items-center justify-center text-[#74777f] hover:text-[#1b1c19] hover:bg-[#eae8e2] rounded-full transition-colors"
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const modalBody = (
    <form id="add-product-form" onSubmit={handleSubmit}>
      <div className="divide-y divide-[rgba(196,198,207,0.12)]">
        <ProductFormQuickImportSection
          importStatus={importStatus}
          onClipboardImport={handleClipboardImport}
          showPasteBox={showPasteBox}
          onPasteBoxPaste={handlePasteBoxPaste}
          onPasteBoxClose={() => setShowPasteBox(false)}
        />

        <ProductFormReviewRequirementSection
          value={newProduct.reviewMediaType}
          onChange={(value: ReviewMediaType) => setNewProduct(prev => ({ ...prev, reviewMediaType: value }))}
        />

        <ProductFormProductDetailsSection
          product={newProduct}
          activeVendors={activeVendors}
          defaultVendorId={DEFAULT_VENDOR_ID}
          onChange={handleDetailsChange}
          mode="add"
          nameRequired
          paidRequired
          onPaidChange={(value) =>
            setNewProduct(prev => updateProductPaid(prev, value))
          }
        />

        <ProductFormRefundExpectationSection
          product={newProduct}
          onChange={(expectation: RefundExpectation) =>
            setNewProduct(prev => ({ ...prev, refundExpectation: expectation }))
          }
        />
      </div>
    </form>
  );

  const modalFooter = (
    <div className="flex gap-3 w-full">
      <button type="button" onClick={handleCancel} className={formFooterCancelClass}>
        Cancel
      </button>
      <button type="submit" form="add-product-form" className={formFooterPrimaryClass}>
        Add Product
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      header={modalHeader}
      body={modalBody}
      footer={modalFooter}
      showCloseButton={false}
      size="md"
    />
  );
};

export default AddProductForm;
