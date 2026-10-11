import React, { useRef, useState } from 'react';
import { parseProductCSV, ParsedProductImport, validateProductCSV } from '../../utils/productCSVParser';
import { colors } from '../../utils/colors';

const TEMPLATE_URL = '/templates/product-import-template.csv';

interface ProductCSVImporterProps {
  onImportComplete: (products: ParsedProductImport[]) => Promise<{ added: number; skipped: number }>;
  isLoading?: boolean;
  compact?: boolean;
}

export const ProductCSVImporter: React.FC<ProductCSVImporterProps> = ({
  onImportComplete,
  isLoading = false,
  compact = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
    details?: { added: number; skipped: number };
  }>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportStatus({ status: 'error', message: 'Please select a CSV file' });
      return;
    }

    setImportStatus({ status: 'processing', message: 'Reading CSV file...' });

    try {
      const content = await file.text();
      const validation = validateProductCSV(content);
      if (!validation.isValid) {
        setImportStatus({
          status: 'error',
          message: `Invalid CSV format: ${validation.error}`,
        });
        return;
      }

      setImportStatus({ status: 'processing', message: 'Parsing products...' });
      const { products, skipped: parseSkipped } = parseProductCSV(content);

      if (products.length === 0) {
        setImportStatus({
          status: 'error',
          message: 'No valid products found in the CSV file',
        });
        return;
      }

      setImportStatus({
        status: 'processing',
        message: `Importing ${products.length} products...`,
      });

      const result = await onImportComplete(products);
      const totalSkipped = result.skipped + parseSkipped;

      setImportStatus({
        status: 'success',
        message: 'Import completed successfully!',
        details: { added: result.added, skipped: totalSkipped },
      });

      setTimeout(() => setImportStatus({ status: 'idle' }), 5000);
    } catch (error) {
      console.error('Error importing product CSV:', error);
      setImportStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to import CSV',
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const getStatusColor = () => {
    switch (importStatus.status) {
      case 'processing':
        return 'border-status-blue/40 bg-status-blue/8';
      case 'success':
        return 'border-brand/30 bg-brand/8';
      case 'error':
        return 'border-destructive/30 bg-destructive-container/60';
      default:
        return dragOver ? 'border-brand bg-brand/5' : 'border-input bg-card';
    }
  };

  const padding = compact ? 'p-4' : 'p-6';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={TEMPLATE_URL}
          download="product-import-template.csv"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colors.border.default} ${colors.text.secondary} text-xs font-medium hover:bg-muted transition-colors`}
        >
          Download template
        </a>
        <span className={`text-xs ${colors.text.muted}`}>
          Item required · status columns use Y or blank · paid/received as numbers
        </span>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg ${padding} text-center cursor-pointer transition-all
          ${getStatusColor()}
          ${isLoading ? 'pointer-events-none opacity-50' : 'hover:border-status-blue/50 hover:bg-status-blue/8'}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const files = e.target.files;
            if (files?.length) handleFileSelect(files[0]);
          }}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center space-y-2">
          <span className="text-lg">
            {importStatus.status === 'processing' ? '⏳' : importStatus.status === 'success' ? '✅' : importStatus.status === 'error' ? '❌' : '📁'}
          </span>
          <div>
            <p className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-foreground mb-0.5`}>
              Import product list
            </p>
            <p className="text-xs text-on-surface-variant">
              {importStatus.status === 'idle'
                ? 'Drop your CSV here or click to browse'
                : importStatus.message}
            </p>
          </div>

          {importStatus.status === 'success' && importStatus.details && (
            <div className="text-xs text-brand flex gap-3">
              <span>Added: {importStatus.details.added}</span>
              {importStatus.details.skipped > 0 && (
                <span>Skipped: {importStatus.details.skipped}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCSVImporter;
