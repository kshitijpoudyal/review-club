import React from 'react';
import { usePendingGmailOrderImports } from '../../hooks/usePendingGmailOrderImports';
import { BookmarkletPayload, BookmarkletProduct } from '../../utils/bookmarklet';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';

interface PendingGmailImportsProps {
  onAdd: (payload: BookmarkletPayload, productIndex: number) => void;
}

function Thumbnail({ src, alt }: { src?: string; alt: string }) {
  const [hidden, setHidden] = React.useState(!src);
  if (hidden) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHidden(true)}
      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[rgba(196,198,207,0.2)]"
    />
  );
}

export const PendingGmailImports: React.FC<PendingGmailImportsProps> = ({ onAdd }) => {
  const { pendingImports, dismiss } = usePendingGmailOrderImports();

  if (pendingImports.length === 0) return null;

  return (
    <section className={`${colors.card.background} rounded-2xl ${colors.card.border} ${colors.card.shadow} p-4 sm:p-6 space-y-3`}>
      <div>
        <h2 className={typography.sectionTitle}>📦 New orders detected from Gmail</h2>
        <p className={`${typography.caption} mt-1`}>
          Extracted from your inbox automatically — review each one before adding it to the tracker.
        </p>
      </div>
      <div className="space-y-3">
        {pendingImports.map(({ id, payload }) => {
          const items: BookmarkletProduct[] = payload.products?.length
            ? payload.products
            : [{ productName: payload.productName, productUrl: payload.productUrl, imageUrl: payload.imageUrl }];

          return (
            <div key={id} className="p-3 rounded-xl border border-[rgba(196,198,207,0.2)] space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className={typography.caption}>
                  {payload.orderNumber && <>Order {payload.orderNumber}</>}
                  {payload.orderTotal != null && <> · ${payload.orderTotal.toFixed(2)}</>}
                  {payload.deliveryEstimate && <> · Arriving {payload.deliveryEstimate}</>}
                </p>
                <button
                  onClick={() => dismiss(id)}
                  className={`${colors.button.secondary} px-3 py-1 rounded-lg text-sm font-medium transition-colors shrink-0`}
                >
                  Dismiss
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Thumbnail src={item.imageUrl} alt={item.productName || 'Product image'} />
                      <div className="min-w-0">
                        <p className={`${typography.bodyStrong} truncate`}>{item.productName || 'Unknown item'}</p>
                        {item.quantity != null && item.quantity > 1 && (
                          <p className={typography.caption}>Qty {item.quantity}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onAdd(payload, index);
                        if (items.length === 1) dismiss(id);
                      }}
                      className={`${colors.button.primary} px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0`}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
