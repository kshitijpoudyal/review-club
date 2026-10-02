import React, { useState } from 'react';
import { usePendingGmailOrderImports } from '../../hooks/usePendingGmailOrderImports';
import { BookmarkletPayload, BookmarkletProduct } from '../../utils/bookmarklet';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';

const GMAIL_IMPORTS_EXPANDED_KEY = 'art_gmail_imports_expanded';

interface PendingGmailImportsProps {
  onAdd: (payload: BookmarkletPayload, productIndex: number) => void;
}

function readExpandedPreference(): boolean {
  try {
    return localStorage.getItem(GMAIL_IMPORTS_EXPANDED_KEY) === 'true';
  } catch {
    return false;
  }
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
  const [expanded, setExpanded] = useState(readExpandedPreference);

  if (pendingImports.length === 0) return null;

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(GMAIL_IMPORTS_EXPANDED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const totalCount = pendingImports.length;
  const collapsedSummary = `${totalCount} order${totalCount !== 1 ? 's' : ''} waiting to review`;

  return (
    <div className="px-4 sm:px-6 md:px-6 lg:px-8 mb-2">
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(2,36,72,0.07)] overflow-hidden border border-[#2563eb]/10">
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#fbf9f3]/80 transition-colors"
        >
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#2563eb]/10 text-[#1d4ed8] text-caption font-semibold tabular-nums">
              {totalCount}
            </span>
            <div className="min-w-0">
              <p className={`${typography.captionStrong} text-[#1b1c19]`}>
                📦 New orders detected from Gmail
              </p>
              {!expanded && (
                <p className="text-sm text-[#43474e] mt-0.5 truncate">{collapsedSummary}</p>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-[#74777f] flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="border-t border-[rgba(196,198,207,0.2)] divide-y divide-[rgba(196,198,207,0.15)]">
            {pendingImports.map(({ id, payload }) => {
              const items: BookmarkletProduct[] = payload.products?.length
                ? payload.products
                : [{ productName: payload.productName, productUrl: payload.productUrl, imageUrl: payload.imageUrl }];

              return (
                <div key={id} className="px-4 py-3 space-y-2">
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
        )}
      </div>
    </div>
  );
};
