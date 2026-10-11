import { typography } from '../../utils/typography';
import React from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { getClipboardImportLabel, ImportStatus } from './productFormUtils';
import { Textarea } from '@/components/ui/textarea';

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
  if (status === 'success') return `${base} bg-brand/10 text-brand border-brand/25`;
  if (status === 'url-only') return `${base} bg-status-amber/10 text-status-amber-fg border-status-amber/30`;
  if (status === 'error') return `${base} bg-destructive-container text-destructive border-destructive/20`;
  return `${base} bg-secondary text-on-surface-variant border-transparent hover:bg-surface-variant`;
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
          <span className={`${typography.caption} text-muted-foreground`}>{clipboardLabel.text}</span>
        )}
      </div>

      {showPasteBox && (
        <div className="rounded-xl border border-input/40 bg-card p-3 space-y-2">
          <p className={`${typography.caption} text-muted-foreground`}>
            Long-press below and tap <strong>Paste</strong>
          </p>
          <Textarea
            autoFocus
            rows={3}
            placeholder="Paste bookmarklet data here…"
            onPaste={onPasteBoxPaste}
            className="min-h-0 rounded-lg py-2 text-caption md:text-caption tabular-nums placeholder:text-input"
          />
          <button
            type="button"
            onClick={onPasteBoxClose}
            className={`${typography.caption} text-muted-foreground hover:text-foreground`}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFormQuickImportSection;
