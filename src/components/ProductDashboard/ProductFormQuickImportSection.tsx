import { typography } from '../../utils/typography';
import React from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { getClipboardImportLabel, ImportStatus } from './productFormUtils';

interface ProductFormQuickImportSectionProps {
  importStatus: ImportStatus;
  onClipboardImport: () => void;
  showPasteBox: boolean;
  onPasteBoxPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onPasteBoxClose: () => void;
  /** Compact styling for Edit Product — same behavior, lower visual weight */
  variant?: 'default' | 'compact';
}

export function clipboardIconButtonClass(status: ImportStatus): string {
  const base = 'inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors shrink-0';
  if (status === 'success') return `${base} bg-[#006a68]/10 text-[#006a68] border-[#006a68]/25`;
  if (status === 'url-only') return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  if (status === 'error') return `${base} bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/20`;
  return `${base} bg-[#eae8e2] text-[#43474e] border-transparent hover:bg-[#e4e2dd]`;
}

export const ProductFormQuickImportSection: React.FC<ProductFormQuickImportSectionProps> = ({
  importStatus,
  onClipboardImport,
  showPasteBox,
  onPasteBoxPaste,
  onPasteBoxClose,
  variant = 'default',
}) => {
  const clipboardLabel = getClipboardImportLabel(importStatus);
  const isCompact = variant === 'compact';

  return (
    <div className={`px-6 ${isCompact ? 'py-3' : 'py-4'} space-y-3`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClipboardImport}
          title={clipboardLabel.text}
          aria-label={clipboardLabel.text}
          className={clipboardIconButtonClass(importStatus)}
        >
          <PaperClipIcon className="w-4 h-4" />
        </button>
        {importStatus !== 'idle' && (
          <span className={`${typography.caption} text-[#74777f]`}>{clipboardLabel.text}</span>
        )}
      </div>

      {showPasteBox && (
        <div className="rounded-xl border border-[rgba(196,198,207,0.4)] bg-white p-3 space-y-2">
          <p className={`${typography.caption} text-[#74777f]`}>
            Long-press below and tap <strong>Paste</strong>
          </p>
          <textarea
            autoFocus
            rows={3}
            placeholder="Paste bookmarklet data here…"
            onPaste={onPasteBoxPaste}
            className={`w-full ${typography.caption} tabular-nums bg-white border border-[rgba(196,198,207,0.4)] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#022448]/20 text-[#1b1c19] placeholder:text-[#c4c6cf]`}
          />
          <button
            type="button"
            onClick={onPasteBoxClose}
            className={`${typography.caption} text-[#74777f] hover:text-[#1b1c19]`}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFormQuickImportSection;
