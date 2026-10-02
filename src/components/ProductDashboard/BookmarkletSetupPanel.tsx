import React, { useMemo, useState } from 'react';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import {
  buildAmazonBookmarkletHref,
  buildWayfairBookmarkletHref,
  buildWalmartBookmarkletHref,
} from '../../utils/bookmarklet';
import { getAppOrigin } from '../../utils/importHandoff';

interface BookmarkletSetupPanelProps {
  defaultExpanded?: boolean;
}

export const BookmarkletSetupPanel: React.FC<BookmarkletSetupPanelProps> = ({ defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const [wayfairBookmarkletCopied, setWayfairBookmarkletCopied] = useState(false);
  const [walmartBookmarkletCopied, setWalmartBookmarkletCopied] = useState(false);

  const appOrigin = getAppOrigin();
  const bookmarklets = useMemo(() => ({
    amazon: buildAmazonBookmarkletHref(appOrigin),
    wayfair: buildWayfairBookmarkletHref(appOrigin),
    walmart: buildWalmartBookmarkletHref(appOrigin),
  }), [appOrigin]);

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={`flex items-center gap-1.5 text-xs ${colors.text.muted} hover:${colors.text.secondary} transition-colors`}
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        Browser shortcut setup
      </button>

      {expanded && (
        <div className={`mt-3 text-xs ${colors.text.muted} space-y-3 pl-4 border-l-2 border-[rgba(196,198,207,0.3)]`}>
          <p className="leading-relaxed">
            Shortcuts extract order data (including tax), copy JSON to your clipboard, and{' '}
            <strong>open this app with the Add Product form pre-filled</strong>.
            No popup appears on the retailer page.
          </p>
          <div className="hidden sm:block">
            <p className={`font-semibold text-xs ${colors.text.secondary} mb-1`}>Desktop — drag to bookmarks bar</p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>Show bookmarks bar (Ctrl/⌘+Shift+B)</li>
              <li>Drag a button below to your bookmarks bar</li>
              <li>On the matching order page, click it → app opens with Add Product form</li>
              <li className="text-[#74777f]">Wayfair: open <strong>View/Edit Details</strong> for the item first (multi-order lists)</li>
              <li className="text-[#74777f]">Walmart: open <strong>Purchase history → Order details</strong></li>
            </ol>
            <div className="flex flex-wrap gap-2 mt-2">
              <a
                href={bookmarklets.amazon}
                draggable
                onClick={e => e.preventDefault()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colors.border.default} ${colors.text.secondary} text-xs font-medium cursor-grab active:cursor-grabbing select-none`}
              >
                📦 Import Amazon Order
              </a>
              <a
                href={bookmarklets.wayfair}
                draggable
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7b189f]/30 text-[#7b189f] text-xs font-medium cursor-grab active:cursor-grabbing select-none"
              >
                🛋️ Import Wayfair Order
              </a>
              <a
                href={bookmarklets.walmart}
                draggable
                onClick={e => e.preventDefault()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0071dc]/30 text-[#0071dc] text-xs font-medium cursor-grab active:cursor-grabbing select-none"
              >
                🛒 Import Walmart Order
              </a>
            </div>
          </div>

          <div className={`sm:border-t sm:${colors.border.default} sm:pt-2`}>
            <p className={`font-semibold text-xs ${colors.text.secondary} mb-1`}>Android & iPhone — one-time setup</p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed mb-2">
              <li>Bookmark any page in your browser (create one per retailer)</li>
              <li>Open Bookmarks → long-press it → Edit</li>
              <li>Clear the URL field → paste the code below → Save</li>
            </ol>
            <p className={`font-semibold text-xs ${colors.text.secondary} mb-1`}>Each time you add a product:</p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed mb-2">
              <li>Open the retailer order details page</li>
              <li>
                <strong>Android Chrome:</strong> tap the address bar → type the bookmark name → select the shortcut
              </li>
              <li>
                <strong>iPhone Safari:</strong> tap the share/bookmarks icon → run your saved shortcut
              </li>
              <li>The app opens with Add Product form pre-filled — review and save</li>
              <li className="text-[#74777f]">Re-copy bookmark URLs below if you still see an old on-page popup</li>
              <li className="text-[#74777f]">If redirect fails, use Import from Clipboard in the app (JSON is copied automatically)</li>
            </ol>

            {[
              { label: 'Amazon bookmark URL:', href: bookmarklets.amazon, copied: bookmarkletCopied, setCopied: setBookmarkletCopied, border: colors.border.default },
              { label: 'Wayfair bookmark URL:', href: bookmarklets.wayfair, copied: wayfairBookmarkletCopied, setCopied: setWayfairBookmarkletCopied, border: 'border-[#7b189f]/30' },
              { label: 'Walmart bookmark URL:', href: bookmarklets.walmart, copied: walmartBookmarkletCopied, setCopied: setWalmartBookmarkletCopied, border: 'border-[#0071dc]/30' },
            ].map(({ label, href, copied, setCopied, border }) => (
              <div key={label} className="relative mb-3 last:mb-0">
                <p className={`mb-1 text-xs ${colors.text.secondary}`}>{label}</p>
                <textarea
                  readOnly
                  value={href}
                  rows={3}
                  onFocus={e => e.target.select()}
                  className={`w-full px-2 py-2 pr-16 ${typography.caption} tabular-nums rounded-lg border ${border} bg-white ${colors.text.muted} resize-none`}
                />
                <button
                  type="button"
                  onClick={() => copyText(href, setCopied)}
                  className={`absolute top-7 right-2 px-2 py-1 rounded ${typography.captionStrong} transition-colors ${
                    copied
                      ? 'bg-[#006a68]/10 text-[#006a68]'
                      : `${colors.background.secondary} ${colors.text.secondary} hover:bg-[#e4e2dd]`
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkletSetupPanel;
