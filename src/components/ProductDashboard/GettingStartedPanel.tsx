import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import {
  buildAmazonBookmarkletHref,
  buildWayfairBookmarkletHref,
  buildWalmartBookmarkletHref,
} from '../../utils/bookmarklet';
import { getAppOrigin } from '../../utils/importHandoff';
import { ParsedProductImport } from '../../utils/productCSVParser';
import { ProductCSVImporter } from './ProductCSVImporter';

const DISMISS_KEY = 'art_getting_started_dismissed';

export function isGettingStartedDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissGettingStarted(): void {
  try {
    localStorage.setItem(DISMISS_KEY, 'true');
  } catch {
    // Ignore quota errors
  }
}

interface GettingStartedPanelProps {
  onImportProducts: (products: ParsedProductImport[]) => Promise<{ added: number; skipped: number }>;
  isImporting?: boolean;
}

export const GettingStartedPanel: React.FC<GettingStartedPanelProps> = ({
  onImportProducts,
  isImporting = false,
}) => {
  const [dismissed, setDismissed] = useState(isGettingStartedDismissed());
  const [mobileSetupOpen, setMobileSetupOpen] = useState(false);
  const [copiedRetailer, setCopiedRetailer] = useState<string | null>(null);

  const appOrigin = getAppOrigin();
  const bookmarklets = useMemo(() => ({
    amazon: buildAmazonBookmarkletHref(appOrigin),
    wayfair: buildWayfairBookmarkletHref(appOrigin),
    walmart: buildWalmartBookmarkletHref(appOrigin),
  }), [appOrigin]);

  const copyBookmarklet = (retailer: string, href: string) => {
    navigator.clipboard.writeText(href).then(() => {
      setCopiedRetailer(retailer);
      setTimeout(() => setCopiedRetailer(null), 2000);
    });
  };

  const handleDismiss = () => {
    dismissGettingStarted();
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className={`rounded-xl border ${colors.border.default} bg-white shadow-sm overflow-hidden mb-4`}>
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[rgba(196,198,207,0.3)] bg-[#f5f4f0]/60">
        <div>
          <h2 className={`${typography.bodyStrong} ${colors.text.primary}`}>Getting started</h2>
          <p className={`text-xs ${colors.text.muted} mt-0.5`}>
            Three quick steps to set up your account
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className={`p-1 rounded-md ${colors.text.muted} hover:${colors.text.secondary} hover:bg-[#e4e2dd] transition-colors`}
          aria-label="Dismiss getting started"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Step 1 — Bookmark */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#022448] text-white text-xs font-semibold flex items-center justify-center">1</span>
            <h3 className={`${typography.bodyStrong} ${colors.text.primary}`}>Set up browser bookmark</h3>
          </div>
          <div className={`ml-8 text-xs ${colors.text.muted} space-y-2`}>
            <p className="hidden sm:block leading-relaxed">
              Show your bookmarks bar (Ctrl/⌘+Shift+B), drag a button below to the bar, then click it on an order page.
            </p>
            <p className="sm:hidden leading-relaxed">
              Create a bookmark, paste the copied code as the URL, then run it on an order page.
            </p>
            <p className={`${colors.text.secondary}`}>
              New orders import automatically — use this for ongoing tracking.
            </p>

            <div className="hidden sm:flex flex-wrap gap-2 pt-1">
              <a
                href={bookmarklets.amazon}
                draggable
                onClick={e => e.preventDefault()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colors.border.default} ${colors.text.secondary} font-medium cursor-grab active:cursor-grabbing select-none`}
              >
                Import Amazon Order
              </a>
              <a
                href={bookmarklets.wayfair}
                draggable
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7b189f]/30 text-[#7b189f] font-medium cursor-grab active:cursor-grabbing select-none"
              >
                Import Wayfair Order
              </a>
              <a
                href={bookmarklets.walmart}
                draggable
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0071dc]/30 text-[#0071dc] font-medium cursor-grab active:cursor-grabbing select-none"
              >
                Import Walmart Order
              </a>
            </div>

            <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setMobileSetupOpen(v => !v)}
                className={`text-xs font-medium ${colors.text.secondary} hover:underline`}
              >
                {mobileSetupOpen ? 'Hide bookmark codes' : 'Copy bookmark codes'}
              </button>
              {mobileSetupOpen && (
                <div className="mt-2 space-y-2">
                  {([
                    { id: 'amazon', label: 'Amazon', href: bookmarklets.amazon },
                    { id: 'wayfair', label: 'Wayfair', href: bookmarklets.wayfair },
                    { id: 'walmart', label: 'Walmart', href: bookmarklets.walmart },
                  ] as const).map(({ id, label, href }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => copyBookmarklet(id, href)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${colors.border.default} ${colors.text.secondary} font-medium`}
                    >
                      {copiedRetailer === id ? `✓ ${label} copied` : `Copy ${label} bookmark URL`}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Step 2 — CSV import */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#022448] text-white text-xs font-semibold flex items-center justify-center">2</span>
            <h3 className={`${typography.bodyStrong} ${colors.text.primary}`}>Import your existing product list</h3>
          </div>
          <div className="ml-8">
            <ProductCSVImporter
              onImportComplete={onImportProducts}
              isLoading={isImporting}
              compact
            />
          </div>
        </section>

        {/* Step 3 — Transactions */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#022448] text-white text-xs font-semibold flex items-center justify-center">3</span>
            <h3 className={`${typography.bodyStrong} ${colors.text.primary}`}>Record your refunds</h3>
          </div>
          <div className={`ml-8 text-xs ${colors.text.muted} space-y-2`}>
            <p className="leading-relaxed">
              Export your PayPal activity as CSV (Activity → Download → CSV) and import it, or add other refunds manually — on the Transactions page.
            </p>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0070BA] text-white text-xs font-medium hover:bg-[#005ea6] transition-colors"
            >
              Go to Transactions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GettingStartedPanel;
