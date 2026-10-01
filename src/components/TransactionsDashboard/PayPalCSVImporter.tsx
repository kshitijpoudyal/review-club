import React, { useState, useRef } from 'react';
import { parsePayPalCSV, validatePayPalCSV } from '../../utils/paypalCSVParser';
import { Transaction } from '../../types/Transaction';

interface PayPalCSVImporterProps {
  onImportComplete: (transactions: Transaction[]) => Promise<{ added: number; skipped: number; withdrawalSkipped?: number }>;
  isLoading?: boolean;
  showExportHint?: boolean;
}

export const PayPalCSVImporter: React.FC<PayPalCSVImporterProps> = ({
  onImportComplete,
  isLoading = false,
  showExportHint = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
    details?: { added: number; skipped: number; withdrawalSkipped?: number };
  }>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportStatus({
        status: 'error',
        message: 'Please select a CSV file'
      });
      return;
    }

    setImportStatus({ status: 'processing', message: 'Reading CSV file...' });

    try {
      const content = await file.text();
      
      // Validate CSV format
      const validation = validatePayPalCSV(content);
      if (!validation.isValid) {
        setImportStatus({
          status: 'error',
          message: `Invalid CSV format: ${validation.error}`
        });
        return;
      }

      setImportStatus({ status: 'processing', message: 'Parsing transactions...' });

      // Parse transactions
      const transactions = parsePayPalCSV(content);
      
      if (transactions.length === 0) {
        setImportStatus({
          status: 'error',
          message: 'No valid transactions found in the CSV file'
        });
        return;
      }

      setImportStatus({ 
        status: 'processing', 
        message: `Importing ${transactions.length} transactions...` 
      });

      // Import transactions
      const result = await onImportComplete(transactions);
      
      setImportStatus({
        status: 'success',
        message: `Import completed successfully!`,
        details: result
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setImportStatus({ status: 'idle' });
      }, 5000);

    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to import CSV'
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = () => {
    switch (importStatus.status) {
      case 'processing':
        return <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />;
      case 'success':
        return <span className="text-lg">✅</span>;
      case 'error':
        return <span className="text-lg">❌</span>;
      default:
        return <span className="text-lg">📁</span>;
    }
  };

  const getStatusColor = () => {
    switch (importStatus.status) {
      case 'processing':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="space-y-4">
      {showExportHint && (
        <p className="text-sm text-gray-600">
          Download from PayPal: <strong>Activity → Statements → Activity download → CSV</strong>
        </p>
      )}
      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${getStatusColor()}
          ${isLoading ? 'pointer-events-none opacity-50' : 'hover:border-blue-400 hover:bg-blue-50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Import PayPal Transactions
            </h3>
            <p className="text-sm text-gray-600">
              {importStatus.status === 'idle' 
                ? 'Drop your PayPal CSV file here or click to browse'
                : importStatus.message
              }
            </p>
          </div>

          {importStatus.status === 'success' && importStatus.details && (
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-center space-x-4 text-green-700">
                <span>✅ Added: {importStatus.details.added}</span>
                <span>⏭️ Skipped: {importStatus.details.skipped}</span>
                {importStatus.details.withdrawalSkipped && importStatus.details.withdrawalSkipped > 0 && (
                  <span>🚫 Withdrawals: {importStatus.details.withdrawalSkipped}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
