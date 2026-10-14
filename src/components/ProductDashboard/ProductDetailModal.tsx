import React from 'react';
import { Product, DEFAULT_REVIEW_MEDIA_TYPE } from '../../types/Product';
import { typography } from '../../utils/typography';
import { getBadgeClasses, getDeltaPillClasses } from '../../utils/colors';
import { formatCurrency } from '../../utils/currency';
import { getProductStatus } from '../../utils/productStatus';
import { getStoreFromProduct } from '../../utils/retailerUtils';
import {
  getExpectedReceivedForProduct,
  getProductRefundExpectation,
  getRefundExpectationSummary,
} from '../../utils/refundUtils';
import { useVendors } from '../../hooks/useVendors';
import { ProductTransactionLink } from '../../hooks/useProductTransactionLinks';
import { Modal, ProductThumbnail } from '../common';
import { ProductFormSectionHeader } from './ProductFormSectionHeader';
import { Button } from '@/components/ui/button';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  transactionLinks?: ProductTransactionLink[];
  onClose: () => void;
  onEdit?: () => void;
}

const REVIEW_STEPS: { field: keyof Product; label: string }[] = [
  { field: 'orderPlaced', label: 'Placed' },
  { field: 'orderDelivered', label: 'Delivered' },
  { field: 'reviewAdded', label: 'Reviewed' },
  { field: 'reviewLive', label: 'Live' },
  { field: 'reviewSSSent', label: 'Screenshot' },
];

const STORE_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  walmart: 'Walmart',
  wayfair: 'Wayfair',
};

const REVIEW_MEDIA_LABELS: Record<string, string> = {
  text: 'Text only',
  photo: 'Photo',
  video: 'Video',
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  // Plain YYYY-MM-DD dates are parsed as local to avoid timezone shifts.
  const plain = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const date = plain
    ? (() => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      })()
    : new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-1.5">
    <dt className={`${typography.caption} text-muted-foreground shrink-0`}>{label}</dt>
    <dd className={`${typography.bodyStrong} text-right min-w-0 break-words`}>{children}</dd>
  </div>
);

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  transactionLinks = [],
  onClose,
  onEdit,
}) => {
  const { getVendorName } = useVendors();
  const status = getProductStatus(product);
  const vendorName = getVendorName(product.vendorId);
  const store = getStoreFromProduct(product);
  const expectation = getProductRefundExpectation(product);
  const expectedReceived = getExpectedReceivedForProduct(product);
  const empty = <span className="text-muted-foreground font-normal">—</span>;

  const modalHeader = (
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-input/15">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <ProductThumbnail imageUrl={product.imageUrl} productName={product.item} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className={`${typography.modalTitle} line-clamp-3 leading-snug`}>
            {product.item || 'Untitled Product'}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={getBadgeClasses(status.type)}>{status.label}</span>
            {vendorName && (
              <>
                <span className={`${typography.caption} text-muted-foreground`} aria-hidden="true">·</span>
                <span className={`${typography.caption} text-muted-foreground`}>{vendorName}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0" aria-label="Close">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );

  const modalBody = (
    <div className="divide-y divide-input/12">
      {product.isVoid ? (
        <div className="mx-6 my-4 px-4 py-3 bg-status-gray/10 border border-status-gray/30 rounded-xl">
          <p className={`${typography.body} text-on-surface-variant`}>
            This product is <strong>Void</strong>.
          </p>
        </div>
      ) : (
        <div className="px-6 py-5">
          <ProductFormSectionHeader title="Review journey" />
          <ol className="flex items-start">
            {REVIEW_STEPS.map((step, i) => {
              const done = !!product[step.field];
              const nextDone = i < REVIEW_STEPS.length - 1 && !!product[REVIEW_STEPS[i + 1].field];
              return (
                <React.Fragment key={step.field}>
                  <li className="flex flex-col items-center flex-1 gap-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        done ? 'bg-brand border-brand text-brand-foreground' : 'bg-card border-input text-muted-foreground'
                      }`}
                    >
                      {done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Done">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={typography.captionStrong}>{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`${typography.caption} text-center leading-tight ${
                        done ? 'text-brand font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                  {i < REVIEW_STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`h-0.5 flex-1 mx-1 mt-4 ${done && nextDone ? 'bg-brand' : 'bg-surface-variant'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </div>
      )}

      <div className="px-6 py-5">
        <ProductFormSectionHeader title="Order details" className="mb-2" />
        <dl>
          <DetailRow label="Order date">{formatDate(product.orderDate) ?? empty}</DetailRow>
          <DetailRow label="Order number">
            {product.orderNumber ? <span className="tabular-nums">{product.orderNumber}</span> : empty}
          </DetailRow>
          <DetailRow label="Store">{STORE_LABELS[store] ?? 'Other'}</DetailRow>
          <DetailRow label="Vendor">{vendorName || empty}</DetailRow>
          <DetailRow label="Review requirement">
            {REVIEW_MEDIA_LABELS[product.reviewMediaType ?? DEFAULT_REVIEW_MEDIA_TYPE]}
          </DetailRow>
          <DetailRow label="Product link">
            {product.url ? (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open listing ↗
              </a>
            ) : (
              empty
            )}
          </DetailRow>
          {product.statusChangedAt && (
            <DetailRow label="Status updated">{formatDate(product.statusChangedAt)}</DetailRow>
          )}
        </dl>
      </div>

      <div className="px-6 py-5">
        <ProductFormSectionHeader title="Financials" className="mb-2" />
        <dl>
          <DetailRow label="Paid"><span className="tabular-nums">{formatCurrency(product.paid)}</span></DetailRow>
          {product.tax != null && product.tax > 0 && (
            <DetailRow label="Tax"><span className="tabular-nums">{formatCurrency(product.tax)}</span></DetailRow>
          )}
          <DetailRow label="Expected refund">
            <span className="tabular-nums">{formatCurrency(expectedReceived)}</span>
            <span className={`block ${typography.caption} text-muted-foreground font-normal`}>
              {getRefundExpectationSummary(expectation, product.paid)}
            </span>
          </DetailRow>
          <DetailRow label="Received"><span className="tabular-nums">{formatCurrency(product.received)}</span></DetailRow>
          {product.refundReceivedAt && (
            <DetailRow label="Refund received">{formatDate(product.refundReceivedAt)}</DetailRow>
          )}
          <DetailRow label="Delta">
            <span className={`${typography.numericStrong} ${getDeltaPillClasses(product.delta)}`}>
              {formatCurrency(product.delta)}
            </span>
          </DetailRow>
        </dl>
        {expectation.notes && (
          <p className={`${typography.caption} text-on-surface-variant mt-3 whitespace-pre-wrap`}>
            {expectation.notes}
          </p>
        )}
      </div>

      {transactionLinks.length > 0 && (
        <div className="px-6 py-5">
          <ProductFormSectionHeader title={`Linked transactions (${transactionLinks.length})`} className="mb-2" />
          <dl>
            {transactionLinks.map((link, index) => (
              <DetailRow key={link.transactionId || index} label={link.transactionId || 'Transaction'}>
                <span className="tabular-nums">{formatCurrency(link.amount)}</span>
              </DetailRow>
            ))}
          </dl>
        </div>
      )}
    </div>
  );

  const modalFooter = (
    <div className="flex items-center gap-2 w-full">
      <Button variant="outline" size="control" type="button" onClick={onClose} className="flex-1">
        Close
      </Button>
      {onEdit && (
        <Button size="control" type="button" onClick={onEdit} className="flex-1">
          Edit Product
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={modalHeader}
      body={modalBody}
      footer={modalFooter}
      showCloseButton={false}
      size="md"
    />
  );
};

export default ProductDetailModal;
